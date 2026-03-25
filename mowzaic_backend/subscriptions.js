import express from 'express';
import { validateToken } from './middleware.js';
import { 
  createSupabaseClientWithAuth,
  asyncHandler,
  ValidationError,
  AuthenticationError,
  DatabaseError,
  NotFoundError
} from './utils.js';
import logger from './logger.js';
import stripe from './stripeClient.js';
import { deleteFutureSubscriptionBookings } from './subscriptionHelpers.js';

const router = express.Router();

/**
 * Get all subscriptions for the authenticated user
 * GET /subscriptions
 */
router.get('/', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);

  // Fetch subscriptions with related property and estimate data
  const { data: subscriptions, error } = await client
    .from('subscriptions')
    .select(`
      id,
      created_at,
      start_date,
      canceled_at,
      frequency,
      status,
      next_service_date,
      stripe_subscription_id,
      properties:property_id (
        id,
        address,
        city,
        state,
        postal
      ),
      estimates:estimate_id (
        id,
        price_cents
      )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError('Failed to fetch subscriptions');
  }

  res.json({ subscriptions });
}));

/**
 * Get a single subscription by ID
 * GET /subscriptions/:id
 */
router.get('/:id', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  const subscriptionId = req.params.id;

  if (!subscriptionId) {
    throw new ValidationError('Missing subscription ID');
  }

  // Fetch subscription details
  const { data: subscription, error: subError } = await client
    .from('subscriptions')
    .select(`
      id,
      created_at,
      start_date,
      canceled_at,
      frequency,
      status,
      next_service_date,
      stripe_subscription_id,
      properties:property_id (
        id,
        address,
        city,
        state,
        postal
      ),
      estimates:estimate_id (
        id,
        price_cents
      )
    `)
    .eq('id', subscriptionId)
    .eq('user_id', req.user.id)
    .single();

  if (subError || !subscription) {
    throw new NotFoundError('Subscription not found');
  }

  // Fetch upcoming bookings for this subscription
  const { data: upcomingBookings, error: bookingsError } = await client
    .from('bookings')
    .select('id, date_of_service, service_status, payment_status')
    .eq('subscription_id', subscriptionId)
    .gte('date_of_service', new Date().toISOString())
    .order('date_of_service', { ascending: true });

  if (bookingsError) {
    logger.warn('Failed to fetch upcoming bookings:', bookingsError);
  }

  res.json({
    subscription,
    upcomingBookings: upcomingBookings || []
  });
}));

/**
 * Cancel a subscription
 * PATCH /subscriptions/:id/cancel
 */
router.patch('/:id/cancel', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  const subscriptionId = req.params.id;

  if (!subscriptionId) {
    throw new ValidationError('Missing subscription ID');
  }

  // Fetch subscription
  const { data: subscription, error: fetchError } = await client
    .from('subscriptions')
    .select('id, user_id, stripe_subscription_id, status')
    .eq('id', subscriptionId)
    .single();

  if (fetchError || !subscription) {
    throw new NotFoundError('Subscription not found');
  }

  // Verify ownership
  if (subscription.user_id !== req.user.id) {
    throw new AuthenticationError('Unauthorized: You do not own this subscription');
  }

  // Check if already canceled
  if (subscription.status === 'canceled') {
    throw new ValidationError('Subscription is already canceled');
  }

  try {
    // Cancel the Stripe subscription
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // Update DB (webhook will also update, but we do it here for immediate response)
    const { data: updated, error: updateError } = await client
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to update subscription status');
    }

    // Delete future unpaid bookings
    await deleteFutureSubscriptionBookings(subscriptionId);

    logger.info(`Subscription ${subscriptionId} canceled by user ${req.user.id}`);
    res.json({
      message: 'Subscription canceled successfully',
      subscription: updated
    });

  } catch (error) {
    logger.error('Error canceling subscription:', error);
    if (error.type === 'StripeInvalidRequestError') {
      throw new ValidationError('Subscription already canceled in Stripe');
    }
    throw new DatabaseError('Failed to cancel subscription');
  }
}));

/**
 * Update subscription frequency
 * PATCH /subscriptions/:id/update-frequency
 * Body: { frequency: 'weekly' | 'biweekly' }
 */
router.patch('/:id/update-frequency', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  const subscriptionId = req.params.id;
  const { frequency } = req.body;

  if (!subscriptionId) {
    throw new ValidationError('Missing subscription ID');
  }

  if (!frequency || !['weekly', 'biweekly'].includes(frequency)) {
    throw new ValidationError('Invalid frequency. Must be weekly or biweekly');
  }

  // Fetch subscription
  const { data: subscription, error: fetchError } = await client
    .from('subscriptions')
    .select('id, user_id, stripe_subscription_id, status, frequency, estimate_id')
    .eq('id', subscriptionId)
    .single();

  if (fetchError || !subscription) {
    throw new NotFoundError('Subscription not found');
  }

  // Verify ownership
  if (subscription.user_id !== req.user.id) {
    throw new AuthenticationError('Unauthorized: You do not own this subscription');
  }

  // Check if active
  if (subscription.status !== 'active') {
    throw new ValidationError('Can only update frequency for active subscriptions');
  }

  // Check if already at desired frequency
  if (subscription.frequency === frequency) {
    throw new ValidationError(`Subscription is already set to ${frequency}`);
  }

  try {
    // Get Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    
    // Update interval_count in Stripe
    const intervalCount = frequency === 'weekly' ? 1 : 2;
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price_data: {
          currency: 'usd',
          product: process.env.STRIPE_RECURRING_SERVICE_ID,
          unit_amount: stripeSubscription.items.data[0].price.unit_amount,
          recurring: {
            interval: 'week',
            interval_count: intervalCount
          }
        }
      }],
      proration_behavior: 'none' // Don't prorate when changing frequency
    });

    // Update DB
    const { data: updated, error: updateError } = await client
      .from('subscriptions')
      .update({ frequency })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to update subscription frequency');
    }

    // TODO: Recalculate future booking dates based on new frequency
    // This requires deleting existing unpaid bookings and recreating them
    // For now, existing bookings remain, new ones will use new frequency

    logger.info(`Subscription ${subscriptionId} frequency updated to ${frequency}`);
    res.json({
      message: 'Subscription frequency updated successfully',
      subscription: updated
    });

  } catch (error) {
    logger.error('Error updating subscription frequency:', error);
    if (error.type === 'StripeInvalidRequestError') {
      throw new ValidationError('Failed to update Stripe subscription');
    }
    throw new DatabaseError('Failed to update subscription frequency');
  }
}));

export default router;
