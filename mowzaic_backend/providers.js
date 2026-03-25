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

export default router;
