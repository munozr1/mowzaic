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

const router = express.Router();

/**
 * Accept an estimate
 * PATCH /estimates/:id/accept
 * Auth: Customer must own the property associated with the estimate
 */
router.patch('/:id/accept', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  const estimateId = req.params.id;

  if (!estimateId) {
    throw new ValidationError('Missing estimate ID');
  }

  // 1. Fetch estimate with property details
  const { data: estimate, error: estimateError } = await client
    .from('estimates')
    .select('id, property_id, accepted, released_at, released')
    .eq('id', estimateId)
    .single();

  if (estimateError || !estimate) {
    throw new NotFoundError('Estimate not found');
  }

  // 2. Check if estimate has been released by provider
  if (!estimate.released) {
    throw new ValidationError('Estimate has not been released by provider yet');
  }

  // 3. Validate estimate is still pending
  if (estimate.accepted !== 'pending') {
    throw new ValidationError(`Estimate has already been ${estimate.accepted}`);
  }

  // 4. Verify user owns the property
  const { data: userProperty, error: propertyError } = await client
    .from('user_properties')
    .select('property_id')
    .eq('property_id', estimate.property_id)
    .eq('user_id', req.user.id)
    .is('deleted_at', null)
    .single();

  if (propertyError || !userProperty) {
    throw new AuthenticationError('Unauthorized: You do not own this property');
  }

  // 5. Update estimate to accepted
  const { data: updatedEstimate, error: updateError } = await client
    .from('estimates')
    .update({ accepted: 'accepted' })
    .eq('id', estimateId)
    .select()
    .single();

  if (updateError) {
    throw new DatabaseError('Failed to accept estimate');
  }

  logger.info(`Estimate ${estimateId} accepted by user ${req.user.id}`);
  res.json({
    message: 'Estimate accepted successfully',
    estimate: updatedEstimate
  });
}));

/**
 * Reject an estimate
 * PATCH /estimates/:id/reject
 * Auth: Customer must own the property associated with the estimate
 */
router.patch('/:id/reject', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  const estimateId = req.params.id;

  if (!estimateId) {
    throw new ValidationError('Missing estimate ID');
  }

  // 1. Fetch estimate with property details
  const { data: estimate, error: estimateError } = await client
    .from('estimates')
    .select('id, property_id, price_cents, accepted, released_at, released')
    .eq('id', estimateId)
    .single();

  if (estimateError || !estimate) {
    throw new NotFoundError('Estimate not found');
  }

  // 2. Check if estimate has been released by provider
  if (!estimate.released) {
    throw new ValidationError('Estimate has not been released by provider yet');
  }

  // 3. Validate estimate is still pending
  if (estimate.accepted !== 'pending') {
    throw new ValidationError(`Estimate has already been ${estimate.accepted}`);
  }

  // 4. Verify user owns the property
  const { data: userProperty, error: propertyError } = await client
    .from('user_properties')
    .select('property_id')
    .eq('property_id', estimate.property_id)
    .eq('user_id', req.user.id)
    .is('deleted_at', null)
    .single();

  if (propertyError || !userProperty) {
    throw new AuthenticationError('Unauthorized: You do not own this property');
  }

  // 5. Update estimate to rejected
  const { data: updatedEstimate, error: updateError } = await client
    .from('estimates')
    .update({ accepted: 'rejected' })
    .eq('id', estimateId)
    .select()
    .single();

  if (updateError) {
    throw new DatabaseError('Failed to reject estimate');
  }

  logger.info(`Estimate ${estimateId} rejected by user ${req.user.id}`);
  res.json({
    message: 'Estimate rejected successfully',
    estimate: updatedEstimate
  });
}));

export default router;
