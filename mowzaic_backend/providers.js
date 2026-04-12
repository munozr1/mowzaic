import express from 'express';
import { validateToken } from './middleware.js';
import supabase from './db.js';
import {
  createSupabaseClientWithAuth,
  asyncHandler,
  ValidationError,
  AuthorizationError,
  DatabaseError
} from './utils.js';
import logger from './logger.js';

const router = express.Router();

/**
 * Middleware to ensure the authenticated user has provider or admin role.
 * Must be used after validateToken.
 */
const requireProvider = async (req, res, next) => {
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || !userData) {
    return res.status(403).json({ message: 'Unable to verify user role' });
  }

  if (userData.role !== 'provider' && userData.role !== 'admin') {
    return res.status(403).json({ message: 'Only providers can access this resource' });
  }

  req.user.dbRole = userData.role;
  next();
};

/**
 * GET /providers/dashboard
 * Returns all bookings assigned to this provider, with property and customer details.
 * Groups by property and includes: address, new client status, estimates, booking history.
 */
router.get("/dashboard", validateToken, requireProvider, asyncHandler(async (req, res) => {
  const providerId = req.user.id;

  // Get all bookings assigned to this provider with property and customer info
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      date_of_service,
      date_booked,
      service_status,
      payment_status,
      customer_id,
      property_id,
      subscription_id,
      properties (
        id,
        address,
        city,
        state,
        postal,
        has_pets
      )
    `)
    .eq('provider_id', providerId)
    .order('date_of_service', { ascending: false });

  if (bookingsError) {
    throw new DatabaseError('Error fetching provider bookings');
  }

  // Get unique property IDs from bookings
  const propertyIds = [...new Set(bookings.map(b => b.property_id))];

  // Get estimates for those properties
  const { data: estimates, error: estimatesError } = await supabase
    .from('estimates')
    .select('*')
    .in('property_id', propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000']);

  if (estimatesError) {
    logger.warn('Error fetching estimates for provider dashboard:', estimatesError);
  }

  // Get customer info for bookings
  const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))];
  const { data: customers, error: customersError } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, phone')
    .in('id', customerIds.length > 0 ? customerIds : ['00000000-0000-0000-0000-000000000000']);

  if (customersError) {
    logger.warn('Error fetching customer info:', customersError);
  }

  // Group bookings by property
  const propertiesMap = {};
  for (const booking of bookings) {
    const propId = booking.property_id;
    if (!propertiesMap[propId]) {
      propertiesMap[propId] = {
        property: booking.properties,
        bookings: [],
        customer: null,
        estimates: [],
        hasCompletedService: false,
        isNewClient: true,
      };
    }
    propertiesMap[propId].bookings.push({
      id: booking.id,
      date_of_service: booking.date_of_service,
      date_booked: booking.date_booked,
      service_status: booking.service_status,
      payment_status: booking.payment_status,
      subscription_id: booking.subscription_id,
    });

    if (booking.service_status === 'completed') {
      propertiesMap[propId].hasCompletedService = true;
      propertiesMap[propId].isNewClient = false;
    }

    // Attach customer info
    if (booking.customer_id && customers) {
      const customer = customers.find(c => c.id === booking.customer_id);
      if (customer) {
        propertiesMap[propId].customer = customer;
      }
    }
  }

  // Attach estimates to properties
  if (estimates) {
    for (const est of estimates) {
      if (propertiesMap[est.property_id]) {
        propertiesMap[est.property_id].estimates.push(est);
      }
    }
  }

  const properties = Object.values(propertiesMap);

  logger.info(`Provider dashboard loaded for ${providerId}: ${properties.length} properties`);
  res.json({ properties });
}));

/**
 * POST /providers/create-estimate
 * Creates an estimate for a property. Only providers/admins can create estimates.
 */
router.post("/create-estimate", validateToken, requireProvider, asyncHandler(async (req, res) => {
  const { propertyId, priceCents } = req.body;

  if (!propertyId || !priceCents) {
    throw new ValidationError('Missing required fields: propertyId and priceCents');
  }

  if (typeof priceCents !== 'number' || priceCents < 100) {
    throw new ValidationError('priceCents must be a number of at least 100 ($1.00)');
  }

  const { data, error } = await supabase
    .from('estimates')
    .insert({ property_id: propertyId, price_cents: priceCents })
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error creating estimate');
  }

  logger.info(`Estimate created for property ID: ${propertyId} with price: ${priceCents}`);
  res.json(data);
}));

/**
 * PATCH /providers/estimates/:id/release
 * Releases an estimate so the customer can see and accept/reject it.
 */
router.patch("/estimates/:id/release", validateToken, requireProvider, asyncHandler(async (req, res) => {
  const estimateId = req.params.id;

  // Verify the estimate exists
  const { data: existing, error: fetchError } = await supabase
    .from('estimates')
    .select('*, properties(id)')
    .eq('id', estimateId)
    .single();

  if (fetchError || !existing) {
    throw new ValidationError('Estimate not found');
  }

  if (existing.released) {
    throw new ValidationError('Estimate is already released');
  }

  const { data, error } = await supabase
    .from('estimates')
    .update({ released: true, released_at: new Date().toISOString() })
    .eq('id', estimateId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error releasing estimate');
  }

  logger.info(`Estimate ${estimateId} released by provider ${req.user.id}`);
  res.json(data);
}));

/**
 * GET /providers/role
 * Returns the user's role from the public.users table.
 * Used by frontend to determine which dashboard to show.
 */
router.get("/role", validateToken, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error) {
    throw new DatabaseError('Error fetching user role');
  }

  res.json({ role: data?.role || 'user' });
}));

/**
 * GET /providers/today
 * Returns today's scheduled stops for this provider in chronological order.
 * Includes property details and customer info for each stop.
 * Used by the mobile app's Itinerary and Current Stop screens.
 */
router.get("/today", validateToken, requireProvider, asyncHandler(async (req, res) => {
  const providerId = req.user.id;

  // Get today's date range in UTC
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      date_of_service,
      service_status,
      payment_status,
      customer_id,
      property_id,
      subscription_id,
      properties (
        id,
        address,
        city,
        state,
        postal,
        coordinates,
        codes,
        has_pets
      )
    `)
    .eq('provider_id', providerId)
    .neq('service_status', 'canceled')
    .gte('date_of_service', todayStart.toISOString())
    .lte('date_of_service', todayEnd.toISOString())
    .order('date_of_service', { ascending: true });

  if (bookingsError) {
    throw new DatabaseError('Error fetching today\'s stops');
  }

  // Fetch customer details
  const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))];
  let customers = [];
  if (customerIds.length > 0) {
    const { data: customerData, error: customerError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone')
      .in('id', customerIds);
    if (!customerError) customers = customerData;
  }

  // Build ordered stop list
  const stops = bookings.map((booking, index) => ({
    stop_number: index + 1,
    booking: {
      id: booking.id,
      date_of_service: booking.date_of_service,
      service_status: booking.service_status,
      payment_status: booking.payment_status,
      subscription_id: booking.subscription_id,
    },
    property: booking.properties,
    customer: customers.find(c => c.id === booking.customer_id) || null,
  }));

  logger.info(`Today's stops for provider ${providerId}: ${stops.length} stops`);
  res.json({ stops });
}));

/**
 * GET /providers/available-jobs
 * Returns unassigned, paid, upcoming bookings that any provider can claim.
 * Used by the mobile app's "Available Jobs" screen.
 */
router.get("/available-jobs", validateToken, requireProvider, asyncHandler(async (req, res) => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const { data: jobs, error } = await supabase
    .from('bookings')
    .select(`
      id,
      date_of_service,
      payment_status,
      service_status,
      property_id,
      properties (
        id,
        address,
        city,
        state,
        postal,
        coordinates,
        has_pets
      )
    `)
    .is('provider_id', null)
    .eq('payment_status', 'paid')
    .eq('service_status', 'scheduled')
    .gte('date_of_service', now.toISOString())
    .order('date_of_service', { ascending: true });

  if (error) {
    throw new DatabaseError('Error fetching available jobs');
  }

  logger.info(`Available jobs fetched: ${jobs.length} jobs`);
  res.json({ jobs });
}));

/**
 * POST /providers/claim-job/:bookingId
 * Allows a provider to claim an unassigned booking.
 * Sets provider_id on the booking only if it is currently unassigned.
 */
router.post("/claim-job/:bookingId", validateToken, requireProvider, asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const providerId = req.user.id;

  // Fetch booking and verify it is unclaimed
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, provider_id, service_status, payment_status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new ValidationError('Booking not found');
  }

  if (booking.provider_id !== null) {
    throw new ValidationError('This job has already been claimed by another provider');
  }

  if (booking.service_status !== 'scheduled') {
    throw new ValidationError('Only scheduled bookings can be claimed');
  }

  if (booking.payment_status !== 'paid') {
    throw new ValidationError('Only paid bookings can be claimed');
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ provider_id: providerId })
    .eq('id', bookingId)
    .is('provider_id', null) // Extra safety: only update if still null
    .select()
    .single();

  if (updateError || !updated) {
    throw new DatabaseError('Failed to claim job — it may have been claimed by another provider');
  }

  logger.info(`Provider ${providerId} claimed booking ${bookingId}`);
  res.json({ message: 'Job claimed successfully', booking: updated });
}));

/**
 * GET /providers/customers
 * Returns the list of customers this provider has added to their roster.
 */
router.get("/customers", validateToken, requireProvider, asyncHandler(async (req, res) => {
  const providerId = req.user.id;

  const { data, error } = await supabase
    .from('provider_clients')
    .select(`
      id,
      created_at,
      customer:customer_id (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError('Error fetching provider customers');
  }

  const customers = data.map(row => ({
    roster_id: row.id,
    added_at: row.created_at,
    ...row.customer,
  }));

  res.json({ customers });
}));

/**
 * POST /providers/customers/add
 * Adds an existing Mowzaic customer to this provider's roster by email or phone.
 * The target user must have role = 'user' (not provider or admin).
 */
router.post("/customers/add", validateToken, requireProvider, asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  const providerId = req.user.id;

  if (!email && !phone) {
    throw new ValidationError('Provide either email or phone to search for the customer');
  }

  // Look up the customer
  let query = supabase.from('users').select('id, first_name, last_name, email, phone, role');
  if (email) {
    query = query.eq('email', email.toLowerCase().trim());
  } else {
    query = query.eq('phone', phone.trim());
  }

  const { data: customer, error: lookupError } = await query.single();

  if (lookupError || !customer) {
    throw new ValidationError('No customer found with that email or phone');
  }

  if (customer.role !== 'user') {
    throw new ValidationError('Only customers (user role) can be added to your roster');
  }

  if (customer.id === providerId) {
    throw new ValidationError('You cannot add yourself to your roster');
  }

  // Upsert the relationship (ignore duplicate)
  const { error: insertError } = await supabase
    .from('provider_clients')
    .upsert(
      { provider_id: providerId, customer_id: customer.id },
      { onConflict: 'provider_id,customer_id', ignoreDuplicates: true }
    );

  if (insertError) {
    throw new DatabaseError('Error adding customer to roster');
  }

  logger.info(`Provider ${providerId} added customer ${customer.id} to roster`);
  res.json({
    message: 'Customer added to your roster',
    customer: {
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
    },
  });
}));

export default router;
