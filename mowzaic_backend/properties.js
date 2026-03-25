import express from 'express';
import { validateToken } from './middleware.js';
import { 
  createSupabaseClientWithAuth,
  asyncHandler,
  ValidationError,
  AuthenticationError,
  DatabaseError,
  NotFoundError,
  jwtDecode
} from './utils.js';
import logger from './logger.js';

const router = express.Router();

// Get all properties, must be authenticated and will only return properties associated with the user
router.get('/', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);

  const claims = jwtDecode(jwt);
  logger.info(`Getting all properties for user ${JSON.stringify(claims)}\njwt: ${jwt}`);

  const { data: properties, error } = await client
    .from('user_properties')
    .select('property_id, property:properties(city, state, postal, address, has_pets, coordinates, codes)')
    .eq('user_id', claims.id)
    .is('deleted_at', null);

  if (error) {
    throw new DatabaseError('Error fetching properties');
  }

  logger.info(`Fetched ${properties.length} properties for user ${claims.id}`);
  const flatProperties = (properties || []).map(item => ({
    ...item.property,
    property_id: item.property_id
  }));

  res.json({
    properties: flatProperties
  });
}));

// Get property by ID
router.get('/:id', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);

  const { data: property, error } = await client
    .from('properties')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) {
    throw new DatabaseError('Error fetching property');
  }

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  res.json({ property });
}));

router.post('/', validateToken, asyncHandler(async (req, res) => {
    // Phase 1. Setup client
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new AuthenticationError('Missing or malformed authorization header');
    }

    const jwt = authHeader.split(' ')[1];
    // We use the authenticated client to ensure the JWT (and user ID) is passed to the RPC function.
    const client = createSupabaseClientWithAuth(jwt); 

    // Phase 2. Input Validation
    const { address, city, state, postal, has_pets } = req.body;

    if (!address || !city || !state || !postal) {
        throw new ValidationError('Missing required fields');
    }

    try {
        // Phase 3. Call the Secure RPC Function
        // The function handles all logic: check existence, check ownership, create property/association.
        const { data: property, error } = await client.rpc('check_and_create_property', {
            // Map request body data to the function's parameters (_address, _city, etc.)
            _address: address, 
            _city: city,
            _state: state,
            _postal: postal,
            _has_pets: has_pets ?? false
        });

        if (error) {
            // Check for the custom validation error thrown by the PostgreSQL function
            if (error.details?.includes('ValidationError')) {
                // Return a 400 status with the message "Property already registered by another active user."
                throw new ValidationError(error.message);
            }
            // All other errors (DB connection, internal syntax, etc.) are treated as a DatabaseError
            throw new DatabaseError(`Error processing property via RPC: ${error.message}`);
        }
        
        // The function returns the property row. Determine status based on whether the property was newly created or existing.
        // We'll default to 201 Created if we got data back, but the frontend should also check if the property was new.
        const statusCode = data && data.id ? 201 : 200;

        logger.info(`Property operation successful for user ${req.user.id}. Status: ${statusCode}`);
        res.status(statusCode).json({ property });

    } catch (error) {
        // The asyncHandler middleware will catch the thrown errors (ValidationError, DatabaseError)
        throw error;
    }
}));

// Update property
router.put('/:id', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);

  const { address, city, state, postal, has_pets } = req.body;

  if (!address || !city || !state || !postal) {
    throw new ValidationError('Missing required fields');
  }

  const { data: property, error } = await client
    .from('properties')
    .update({ 
      address, 
      city, 
      state, 
      postal,
      has_pets: has_pets ?? false 
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error updating property');
  }

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  res.json({ property });
}));

// Delete property
/*
* Disassociate property from user
*/
router.delete('/:id', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  //decode the jwt to get user id
  const claims = jwtDecode(jwt);
  logger.info(`Decoded JWT: ${JSON.stringify(claims)}`);

  const propertyId = req.params.id;
  logger.info(`Disassociating property ${propertyId}`);
  logger.info(`${jwt}`)

  // 1: Check for active subscriptions
  const { data: subscriptions, error: subError } = await client
    .from('subscriptions')
    .select('id')
    .eq('property_id', propertyId)
    .eq('status', 'active');

  if (subError) {
    throw new DatabaseError('Error checking subscriptions');
  }

  if (subscriptions.length > 0) {
    throw new ValidationError('Active subscription exists. Cancel it before disassociating the property.');
  }

  // 2: Disassociate property
  // TODO: add RLS to properties table to ensure only the owner can disassociate
  const { error: updateError } = await client
    .from('user_properties')
    .update({deleted_at: new Date().toISOString()}) // Soft delete
    .eq('property_id', propertyId)
    //.eq('user_id', claims.id) // redundant, rls already enforces this
    .is('deleted_at', null);

  if (updateError) {
    throw new DatabaseError(`Error disassociating property: ${updateError.message}`);
  }

  logger.info(`Property ${propertyId} disassociated successfully`);
  await client.from('events').insert({
    event_type: 'property_disassociated',
    source: 'mowzaic-api',
    metadata: {
      property_id: propertyId,
      user_id: claims.id
    }
  });

  res.json({ message: 'Property disassociated successfully' });
}));

export { router as propertyRoutes }; 
