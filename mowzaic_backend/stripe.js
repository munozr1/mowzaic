import express from 'express';
import supabase from './db.js';
import { validateToken } from './middleware.js';
import logger from './logger.js';
import { DatabaseError, createSupabaseClientWithAuth} from './utils.js';
import { customerDeleted ,customerCreated ,chargeSucceeded, chargeUpdated, checkoutSessionCompleted, paymentIntentSucceeded, subscriptionCreated, invoicePaymentSucceeded, subscriptionDeleted, invoicePaymentFailed } from './stripeWebhookFunctions.js';
import stripe from './stripeClient.js';

const DEFAULT_DOMAIN = process.env.MODE === 'development' ? 'http://localhost:5173' : 'https://www.mowzaic.com';

// Helper to get the return URL for the user's org domain
async function getOrgReturnUrl(orgId) {
  if (!orgId) return `${DEFAULT_DOMAIN}/book`;
  try {
    const { data } = await supabase
      .from('organizations')
      .select('domain')
      .eq('id', orgId)
      .single();
    if (data?.domain) {
      const protocol = process.env.MODE === 'development' ? 'http' : 'https';
      return `${protocol}://${data.domain}/book`;
    }
  } catch { /* fall through */ }
  return `${DEFAULT_DOMAIN}/book`;
}
const router = express.Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;


// Create a separate router for the webhook to avoid body parsing
const webhookRouter = express.Router();

// This route needs to be registered before any JSON body parser middleware
webhookRouter.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const payload = req.body; // This is now a Buffer
  let event;
  
  try {
    // Verify the webhook signature if you have a webhook secret
    if (endpointSecret) {
      event = await stripe.webhooks.constructEventAsync(payload, sig, endpointSecret);
    } else {
      // If no webhook secret, parse the raw body
      event = JSON.parse(payload.toString());
    }
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await checkoutSessionCompleted(event);
        break;
      case 'payment_intent.succeeded':
        await paymentIntentSucceeded(event);
        break;
      case 'charge.updated':
        await chargeUpdated(event);
        break;
      case 'charge.succeeded':
        await chargeSucceeded(event);
        break;
      case 'customer.created':
        await customerCreated(event);
        break;
      case 'customer.deleted':
        await customerDeleted(event);
        break;
      case 'customer.subscription.created':
        await subscriptionCreated(event);
        break;
      case 'customer.subscription.deleted':
        await subscriptionDeleted(event);
        break;
      case 'invoice.payment_succeeded':
        await invoicePaymentSucceeded(event);
        break;
      case 'invoice.payment_failed':
        await invoicePaymentFailed(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

const getPropertyPrice = async (propertyId) => {
 //get the most recent estimate for the property
  const { data, error } = await supabase
    .from('estimates')
    .select('price_cents')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching estimate:', error);
    return 3500;
  }

  return data?.[0]?.price_cents || 3500;
}


// Function to handle fetching or creating a Stripe Customer
const getOrCreateStripeCustomer = async (userId,  authJwt) => {
    // 1. Get the authenticated user's details from your DB to check for existing stripe_id
    // Note: You may need a simple Supabase query here, as req.user doesn't have stripe_id
    const client = createSupabaseClientWithAuth(authJwt);
    const { data: userData, error } = await client
        .from('users')
        .select('stripe_id, email, first_name, last_name')
        .eq('id', userId)
        .single();

    if (error || !userData) {
        logger.error(`Error fetching user data for Stripe: ${error?.message}`);
        throw new DatabaseError('Failed to retrieve user details for payment.', error);
    }
    
    // 2. Check if Stripe Customer ID already exists
    if (userData.stripe_id) {
        logger.info(`Existing Stripe customer ID found: ${userData.stripe_id}`);
        return userData.stripe_id;
    }

    // 3. If not, create a new Stripe Customer
    const name = `${userData.first_name} ${userData.last_name}`.trim();
    logger.info(`Creating new Stripe customer for user ID: ${userId}, email: ${userData.email}`);

    const customer = await stripe.customers.create({
        email: userData.email,
        name: name,
        metadata: {
            userId: userId,
        },
    });

    // 4. Update your Supabase user record with the new Stripe Customer ID
    const { error: updateError } = await client
        .from('users')
        .update({ stripe_id: customer.id })
        .eq('id', userId);

    if (updateError) {
        logger.error(`Error updating user with new Stripe customer ID: ${updateError.message}. Deleting orphaned Stripe customer.`);
        // Crucial: Clean up the Stripe customer if DB update fails
        await stripe.customers.del(customer.id); 
        throw new DatabaseError('Failed to save Stripe Customer ID to database.', updateError);
    }

    logger.info(`Successfully created and saved Stripe customer ID: ${customer.id}`);
    return customer.id;
};


// Main router for other Stripe routes
router.post('/create-checkout-session', validateToken, async (req, res) => {
    // Ensure the required fields are available in req.user from validateToken
    const { id: userId } = req.user; 
    const { propertyId, bookingId } = req.body;
    
    // Required for RLS/Auth to fetch stripe_id
    const authHeader = req.headers.authorization;
    const jwt = authHeader.split(' ')[1];

    try {
        // Phase 1: Ensure Stripe Customer ID Exists
        const stripeCustomerId = await getOrCreateStripeCustomer(userId, jwt);

        // Phase 2: Create Checkout Session 
        const priceCents = await getPropertyPrice(propertyId);
        const description = 'Initial basic lawn care service includes mowing, edging, and blowing.';

        const item = {
            price_data: {
                currency: 'usd',
                product_data: { name: 'Initial Lawn Care Service', description: description },
                unit_amount: priceCents,
            },
            quantity: 1,
        };

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId, // Pass the ID here
            line_items: [item],
            mode: 'payment',
            ui_mode: 'embedded',
            return_url: `${await getOrgReturnUrl(req.user.org_id)}?booking=${bookingId}`,
            metadata: {
                bookingId: bookingId,
                userId: userId,
                orgId: req.user.org_id || '',
            },
        });

        res.json({
            clientSecret: session.client_secret,
            sessionId: session.id
        });

    } catch (error) {
        console.error('Error in create-checkout-session:', error);
        res.status(500).json({ error: error.message || 'Failed to process checkout request.' });
    }
});

//STRIPE_FIRST_TIME_SERVICE_ID=prod_RwDzdCvHdXQPlp
//STRIPE_RECURRING_SERVICE_ID=prod_TNIhsZc18g0gYM

/**
 * Create a recurring subscription for a property
 * POST /stripe/create-subscription
 * Body: { estimateId, frequency }
 */
router.post('/create-subscription', validateToken, async (req, res) => {
    const { id: userId } = req.user;
    const { estimateId, frequency } = req.body;

    // Required for RLS/Auth
    const authHeader = req.headers.authorization;
    const jwt = authHeader.split(' ')[1];
    const client = createSupabaseClientWithAuth(jwt);

    if (!estimateId || !frequency) {
        return res.status(400).json({ error: 'Missing required fields: estimateId and frequency' });
    }

    if (!['weekly', 'biweekly'].includes(frequency)) {
        return res.status(400).json({ error: 'Invalid frequency. Must be weekly or biweekly' });
    }

    try {
        // 1. Fetch the accepted estimate
        const { data: estimate, error: estimateError } = await client
            .from('estimates')
            .select('id, property_id, price_cents, accepted')
            .eq('id', estimateId)
            .single();

        if (estimateError || !estimate) {
            return res.status(404).json({ error: 'Estimate not found' });
        }

        if (estimate.accepted !== 'accepted') {
            return res.status(400).json({ error: 'Estimate must be accepted before subscribing' });
        }

        if (estimate.price_cents <= 0) {
            return res.status(400).json({ error: 'Estimate price must be greater than zero' });
        }

        // 2. Verify user owns the property
        const { data: userProperty, error: propertyError } = await client
            .from('user_properties')
            .select('property_id')
            .eq('property_id', estimate.property_id)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .single();

        if (propertyError || !userProperty) {
            return res.status(403).json({ error: 'Unauthorized: You do not own this property' });
        }

        // 3. Check if subscription already exists for this property
        const { data: existingSub, error: subCheckError } = await client
            .from('subscriptions')
            .select('id, status')
            .eq('property_id', estimate.property_id)
            .eq('user_id', userId)
            .in('status', ['pending', 'active']);

        if (!subCheckError && existingSub && existingSub.length > 0) {
            return res.status(400).json({ 
                error: 'Active subscription already exists for this property',
                subscriptionId: existingSub[0].id 
            });
        }

        // 4. Get or create Stripe customer
        const stripeCustomerId = await getOrCreateStripeCustomer(userId, jwt);

        // 5. Find the most recent completed booking to calculate next service date
        const { data: lastBooking, error: bookingError } = await client
            .from('bookings')
            .select('date_of_service')
            .eq('property_id', estimate.property_id)
            .eq('customer_id', userId)
            .eq('service_status', 'completed')
            .order('date_of_service', { ascending: false })
            .limit(1)
            .single();

        if (bookingError || !lastBooking) {
            return res.status(400).json({ 
                error: 'No completed bookings found. Complete first service before subscribing.' 
            });
        }

        // Calculate next service date (7 or 14 days after last service, same day of week)
        const lastServiceDate = new Date(lastBooking.date_of_service);
        const daysToAdd = frequency === 'weekly' ? 7 : 14;
        const nextServiceDate = new Date(lastServiceDate);
        nextServiceDate.setDate(nextServiceDate.getDate() + daysToAdd);

        // 6. Create Stripe Checkout Session for subscription
        const LAWN_CARE_PRODUCT_ID = process.env.STRIPE_RECURRING_SERVICE_ID;
        
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product: LAWN_CARE_PRODUCT_ID,
                    unit_amount: estimate.price_cents,
                    recurring: {
                        interval: 'week',
                        interval_count: frequency === 'weekly' ? 1 : 2
                    },
                },
                quantity: 1,
            }],
            success_url: `${await getOrgReturnUrl(req.user.org_id)}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${await getOrgReturnUrl(req.user.org_id)}/subscription-cancel`,
            metadata: {
                userId: userId,
                propertyId: estimate.property_id,
                estimateId: estimateId,
                frequency: frequency,
                nextServiceDate: nextServiceDate.toISOString(),
                orgId: req.user.org_id || ''
            },
        });

        // 7. Create pending subscription in database (will be activated by webhook)
        const { data: dbSubscription, error: dbError } = await client
            .from('subscriptions')
            .insert({
                user_id: userId,
                property_id: estimate.property_id,
                estimate_id: estimateId,
                frequency: frequency,
                status: 'pending',
                next_service_date: nextServiceDate.toISOString(),
                org_id: req.user.org_id || null
            })
            .select()
            .single();

        if (dbError) {
            logger.error('Failed to create subscription in DB:', dbError);
            throw new DatabaseError('Failed to create subscription in database');
        }

        // Store subscription ID in session metadata for webhook
        await stripe.checkout.sessions.update(session.id, {
            metadata: {
                ...session.metadata,
                dbSubscriptionId: dbSubscription.id
            }
        });

        logger.info(`Pending subscription ${dbSubscription.id} created for user ${userId}, property ${estimate.property_id}`);

        // 8. Return checkout URL
        res.json({
            subscriptionId: dbSubscription.id,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        logger.error('Error creating subscription:', error);
        res.status(500).json({ error: error.message || 'Failed to create subscription' });
    }
});

export { router as stripeRoutes, webhookRouter as stripeWebhookRoute };
