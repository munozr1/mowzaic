import { createClient } from '@supabase/supabase-js';
import logger from './logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Calculate the next service date based on frequency and last completed booking
 * Aligns to same day of week
 * @param {Date} lastServiceDate - Date of the last completed service
 * @param {string} frequency - 'weekly' or 'biweekly'
 * @returns {Date} Next service date
 */
export function calculateNextServiceDate(lastServiceDate, frequency) {
  const daysToAdd = frequency === 'weekly' ? 7 : 14;
  const nextDate = new Date(lastServiceDate);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
}

/**
 * Get unavailable days (weekends) from database
 * @returns {Promise<number[]>} Array of unavailable day numbers (0 = Sunday, 6 = Saturday)
 */
async function getUnavailableDays() {
  const { data, error } = await supabaseAdmin
    .from('unavailable_days')
    .select('day');

  if (error) {
    logger.error('Error fetching unavailable days:', error);
    return [0, 6]; // Default to weekends
  }

  return data.map(d => d.day);
}

/**
 * Adjust date to next available day if it falls on weekend
 * @param {Date} date - Date to check
 * @param {number[]} unavailableDays - Array of unavailable day numbers
 * @returns {Date} Adjusted date
 */
function adjustToAvailableDay(date, unavailableDays) {
  const adjusted = new Date(date);
  while (unavailableDays.includes(adjusted.getDay())) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return adjusted;
}

/**
 * Create subscription bookings based on frequency
 * - Weekly: Create 2 bookings (covers 2-week window)
 * - Biweekly: Create 1 booking (covers 2-week window)
 * @param {Object} subscription - Subscription object with frequency, next_service_date, etc.
 * @returns {Promise<Array>} Array of created booking IDs
 */
export async function createSubscriptionBookings(subscription) {
  try {
    const { id, frequency, next_service_date, property_id, user_id, estimate_id, org_id } = subscription;

    // Fetch estimate to get pricing
    const { data: estimate, error: estimateError } = await supabaseAdmin
      .from('estimates')
      .select('price_cents')
      .eq('id', estimate_id)
      .single();

    if (estimateError || !estimate) {
      logger.error(`Failed to fetch estimate ${estimate_id}:`, estimateError);
      throw new Error('Estimate not found');
    }

    const unavailableDays = await getUnavailableDays();
    const bookingCount = frequency === 'weekly' ? 2 : 1;
    const bookingsToCreate = [];

    let currentDate = new Date(next_service_date);

    for (let i = 0; i < bookingCount; i++) {
      // Adjust date if it falls on unavailable day
      const adjustedDate = adjustToAvailableDay(currentDate, unavailableDays);

      bookingsToCreate.push({
        customer_id: user_id,
        property_id: property_id,
        subscription_id: id,
        date_of_service: adjustedDate.toISOString(),
        service_status: 'scheduled',
        payment_status: 'pending',
        provider_id: null,
        message_id: null,
        org_id: org_id || null
      });

      // Calculate next date in the series
      const daysToAdd = frequency === 'weekly' ? 7 : 14;
      currentDate.setDate(currentDate.getDate() + daysToAdd);
    }

    // Insert all bookings
    const { data: createdBookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingsToCreate)
      .select('id');

    if (bookingError) {
      logger.error('Error creating subscription bookings:', bookingError);
      throw new Error('Failed to create bookings');
    }

    logger.info(`Created ${createdBookings.length} bookings for subscription ${id}`);
    return createdBookings.map(b => b.id);

  } catch (error) {
    logger.error('Error in createSubscriptionBookings:', error);
    throw error;
  }
}

/**
 * Create the next booking in a subscription to maintain the rolling window
 * @param {number} subscriptionId - Subscription ID
 * @returns {Promise<string>} Created booking ID
 */
export async function createNextSubscriptionBooking(subscriptionId) {
  try {
    // Fetch subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, frequency, property_id, user_id, estimate_id, next_service_date, org_id')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      logger.error(`Subscription ${subscriptionId} not found:`, subError);
      throw new Error('Subscription not found');
    }

    // Fetch the latest booking to calculate next date
    const { data: lastBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('date_of_service')
      .eq('subscription_id', subscriptionId)
      .order('date_of_service', { ascending: false })
      .limit(1)
      .single();

    if (bookingError || !lastBooking) {
      logger.error('No bookings found for subscription:', subscriptionId);
      throw new Error('No bookings found');
    }

    // Calculate next service date
    const nextDate = calculateNextServiceDate(
      new Date(lastBooking.date_of_service),
      subscription.frequency
    );

    // Adjust for unavailable days
    const unavailableDays = await getUnavailableDays();
    const adjustedDate = adjustToAvailableDay(nextDate, unavailableDays);

    // Fetch estimate pricing
    const { data: estimate, error: estimateError } = await supabaseAdmin
      .from('estimates')
      .select('price_cents')
      .eq('id', subscription.estimate_id)
      .single();

    if (estimateError || !estimate) {
      throw new Error('Estimate not found');
    }

    // Create the new booking
    const { data: newBooking, error: insertError } = await supabaseAdmin
      .from('bookings')
      .insert({
        customer_id: subscription.user_id,
        property_id: subscription.property_id,
        subscription_id: subscriptionId,
        date_of_service: adjustedDate.toISOString(),
        service_status: 'scheduled',
        payment_status: 'pending',
        provider_id: null,
        message_id: null,
        org_id: subscription.org_id || null
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Error creating next subscription booking:', insertError);
      throw new Error('Failed to create booking');
    }

    logger.info(`Created next booking ${newBooking.id} for subscription ${subscriptionId}`);
    return newBooking.id;

  } catch (error) {
    logger.error('Error in createNextSubscriptionBooking:', error);
    throw error;
  }
}

/**
 * Delete all future unpaid bookings for a canceled subscription
 * @param {number} subscriptionId - Subscription ID
 * @returns {Promise<number>} Number of deleted bookings
 */
export async function deleteFutureSubscriptionBookings(subscriptionId) {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('subscription_id', subscriptionId)
      .eq('payment_status', 'pending')
      .gte('date_of_service', now)
      .select('id');

    if (error) {
      logger.error('Error deleting future bookings:', error);
      throw new Error('Failed to delete bookings');
    }

    logger.info(`Deleted ${data.length} future bookings for subscription ${subscriptionId}`);
    return data.length;

  } catch (error) {
    logger.error('Error in deleteFutureSubscriptionBookings:', error);
    throw error;
  }
}
