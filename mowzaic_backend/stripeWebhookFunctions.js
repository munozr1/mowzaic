import supabase from "./db.js";
import stripe from "./stripeClient.js";
import logger from "./logger.js";
import { createSubscriptionBookings, createNextSubscriptionBooking, deleteFutureSubscriptionBookings } from './subscriptionHelpers.js';

/*
//the events table is used to log all Stripe events for debugging and auditing purposes
CREATE TABLE events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL, -- e.g., "signup", "charge.succeeded", etc.
  metadata JSONB,           -- Stripe payload or useful custom info
  source TEXT DEFAULT 'internal', -- "internal", "stripe", "marketing", etc.
  created_at TIMESTAMP DEFAULT now()
);
*/
export async function checkoutSessionCompleted(event) {
  const session = event.data.object;
  // Log the session for debugging
  await supabase
    .from('events')
    .insert({
      event_type: 'checkout.session.completed',
      metadata: session,
      source: 'stripe'
    });
  
  // Check if payment was successful
  if (session.payment_status === 'paid') {
    
    // Handle subscription checkout
    if (session.mode === 'subscription') {
      try {
        const dbSubscriptionId = session.metadata.dbSubscriptionId;
        const stripeSubscriptionId = session.subscription;

        if (!dbSubscriptionId || !stripeSubscriptionId) {
          logger.error('Missing subscription IDs in session metadata');
          return;
        }

        // Update DB subscription with Stripe subscription ID and activate it
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            stripe_subscription_id: stripeSubscriptionId,
            status: 'active',
            start_date: new Date().toISOString()
          })
          .eq('id', dbSubscriptionId);

        if (updateError) {
          logger.error(`Failed to activate subscription ${dbSubscriptionId}:`, updateError);
          return;
        }

        // Fetch subscription details to create bookings
        const { data: subscription, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('id', dbSubscriptionId)
          .single();

        if (fetchError || !subscription) {
          logger.error(`Failed to fetch subscription ${dbSubscriptionId}:`, fetchError);
          return;
        }

        // Create initial bookings
        await createSubscriptionBookings(subscription);
        
        logger.info(`Subscription ${dbSubscriptionId} activated via checkout and bookings created`);
      } catch (error) {
        logger.error('Error handling subscription checkout completion:', error);
      }
      return;
    }

    // Handle one-time booking checkout
    const bookingId = session.metadata.bookingId;

    if (bookingId) {
      logger.info(`Payment successful for booking ID: ${bookingId}`);

      try {
        // Get payment intent ID from session
        const paymentIntentId = session.payment_intent;

        // Update booking status to 'paid' and store payment_intent_id
        const { data, error } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'paid',
            payment_intent_id: paymentIntentId 
          })
          .eq('id', bookingId)
          .select('id, payment_status')
          .single();

        if (error) throw error;

        if (data) {
          console.log(`Booking ${bookingId} updated to status: ${data.payment_status}`);
        } else {
          console.error(`Booking ${bookingId} not found in database`);
        }
      } catch (error) {
        console.error(`Error updating booking status: ${error.message}`);
      }
    } else {
      console.error('No bookingId found in session metadata');
    }
  }
}

export async function paymentIntentSucceeded(event) {
// As a backup, also check payment_intent.succeeded events
  const paymentIntent = event.data.object;
  // Log the payment intent for debugging
  await supabase
    .from('events')
    .insert({
      event_type: 'payment_intent.succeeded',
      metadata: paymentIntent,
      source: 'stripe'
    });
  
  // We need to find the checkout session associated with this payment intent
  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      expand: ['data.metadata']
    });
    
    if (sessions.data.length > 0) {
      const relatedSession = sessions.data[0];
      const bookingId = relatedSession.metadata.bookingId;
      
      if (bookingId) {
        console.log(`Payment intent succeeded for booking ID: ${bookingId}`);
        
        // Update booking status to 'paid' in the database
        const { data, error } = await supabase
          .from('bookings')
          .update({ payment_status: 'paid' })
          .eq('id', bookingId)
          .select('id, payment_status')
          .single();
          
        if (error) throw error;
        
        if (data) {
          console.log(`Booking ${bookingId} updated to status: ${data.payment_status}`);
        } else {
          console.error(`Booking ${bookingId} not found in database`);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing payment intent: ${error.message}`);
  }
}
export async function chargeUpdated(event) {
  const charge = event.data.object;
  // Log the charge for debugging
  await supabase
    .from('events')
    .insert({
      event_type: 'charge.updated',
      metadata: charge,
      source: 'stripe'
    });
  const status = charge.status;
  if (status === 'succeeded') {
    const bookingId = charge.metadata.bookingId;
    console.log(`Charge updated: ${charge.id}`);
  }
}

export async function customerCreated(event) {
  // Log the customer creation event
  await supabase
    .from('events')
    .insert({
      event_type: 'customer.created',
      metadata: event.data.object,
      source: 'stripe'
    });
}

export async function customerDeleted(event) {
  // Log the customer deletion event
  await supabase
    .from('events')
    .insert({
      event_type: 'customer.deleted',
      metadata: event.data.object,
      source: 'stripe'
    });
  const customer = event.data.object;
  logger.info(`Customer deleted: ${JSON.stringify(customer.id)}`);
  // in the metadata we have the userId
  const userId = customer.metadata.userId;
  if (userId) {
    await supabase
      .from('users')
      .update({ stripe_id: null })
      .eq('id', userId);
  }
}

export async function chargeSucceeded(event){
  // Log the charge succeeded event
  await supabase
    .from('events')
    .insert({
      event_type: 'charge.succeeded',
      metadata: event.data.object,
      source: 'stripe'
    });
  const charge = event.data.object;
  logger.info(`Charge succeeded: ${charge.id}`);

}

/**
 * Handle customer.subscription.created event
 * Note: Subscriptions created via checkout are handled in checkoutSessionCompleted
 * This is for direct subscription creation (if any)
 */
export async function subscriptionCreated(event) {
  const subscription = event.data.object;
  
  await supabase
    .from('events')
    .insert({
      event_type: 'customer.subscription.created',
      metadata: subscription,
      source: 'stripe'
    });

  logger.info(`Subscription created event logged: ${subscription.id} (handled by checkout.session.completed if via checkout)`);
}

/**
 * Handle invoice.payment_succeeded event
 * Updates booking payment status and creates next booking in rolling window
 */
export async function invoicePaymentSucceeded(event) {
  const invoice = event.data.object;
  
  await supabase
    .from('events')
    .insert({
      event_type: 'invoice.payment_succeeded',
      metadata: invoice,
      source: 'stripe'
    });

  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      logger.info('Invoice not associated with subscription, skipping');
      return;
    }

    // Find DB subscription
    const { data: dbSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, frequency')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subError || !dbSubscription) {
      logger.error(`Subscription not found for Stripe ID: ${subscriptionId}`);
      return;
    }

    // Find the next unpaid booking for this subscription
    const { data: nextBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('subscription_id', dbSubscription.id)
      .eq('payment_status', 'pending')
      .order('date_of_service', { ascending: true })
      .limit(1)
      .single();

    if (bookingError || !nextBooking) {
      logger.warn(`No pending bookings found for subscription ${dbSubscription.id}`);
      return;
    }

    // Mark booking as paid and store payment intent
    const paymentIntentId = invoice.payment_intent;
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        payment_status: 'paid',
        payment_intent_id: paymentIntentId
      })
      .eq('id', nextBooking.id);

    if (updateError) {
      logger.error(`Failed to update booking ${nextBooking.id}:`, updateError);
      return;
    }

    logger.info(`Booking ${nextBooking.id} marked as paid`);

    // Check how many future bookings exist
    const { data: futureBookings, error: countError } = await supabase
      .from('bookings')
      .select('id')
      .eq('subscription_id', dbSubscription.id)
      .eq('payment_status', 'pending')
      .gte('date_of_service', new Date().toISOString());

    if (countError) {
      logger.error('Error counting future bookings:', countError);
      return;
    }

    // Determine window size based on frequency
    const windowSize = dbSubscription.frequency === 'weekly' ? 2 : 1;

    // If we're below the window size, create the next booking
    if (futureBookings.length < windowSize) {
      await createNextSubscriptionBooking(dbSubscription.id);
      logger.info(`Created next booking for subscription ${dbSubscription.id}`);
    }

  } catch (error) {
    logger.error('Error handling invoice.payment_succeeded:', error);
  }
}

/**
 * Handle customer.subscription.deleted event
 * Cancels subscription and removes future unpaid bookings
 */
export async function subscriptionDeleted(event) {
  const subscription = event.data.object;
  
  await supabase
    .from('events')
    .insert({
      event_type: 'customer.subscription.deleted',
      metadata: subscription,
      source: 'stripe'
    });

  try {
    // Find DB subscription
    const { data: dbSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (fetchError || !dbSubscription) {
      logger.error(`Subscription not found in DB: ${subscription.id}`);
      return;
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('id', dbSubscription.id);

    if (updateError) {
      logger.error(`Failed to cancel subscription ${dbSubscription.id}:`, updateError);
      return;
    }

    // Delete future unpaid bookings
    await deleteFutureSubscriptionBookings(dbSubscription.id);
    
    logger.info(`Subscription ${dbSubscription.id} canceled and future bookings removed`);
  } catch (error) {
    logger.error('Error handling subscription.deleted:', error);
  }
}

/**
 * Handle invoice.payment_failed event
 * Logs failure for monitoring
 * TODO: Implement retry/dunning strategy - after 3 failures, should we auto-cancel?
 */
export async function invoicePaymentFailed(event) {
  const invoice = event.data.object;
  
  await supabase
    .from('events')
    .insert({
      event_type: 'invoice.payment_failed',
      metadata: invoice,
      source: 'stripe'
    });

  logger.warn(`Invoice payment failed: ${invoice.id} for subscription: ${invoice.subscription}`);
  
  // TODO: Implement failure handling
  // - Track failure count
  // - Send notification to customer
  // - After 3 failures, consider auto-canceling subscription
  // - Update subscription status to 'past_due' or similar
}
