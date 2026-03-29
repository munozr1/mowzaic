import express from 'express';
import supabase from './db.js';
import { validateToken } from './middleware.js';
import { 
  gen14days, 
  createSupabaseClientWithAuth,
  asyncHandler,
  ValidationError,
  AuthenticationError,
  DatabaseError,
  NotFoundError
} from './utils.js';
import logger from './logger.js';
const router = express.Router();

// Get availability this week, no need for jwt, anyone can check before booking
// Accepts optional ?org_id= query param to scope availability per org
router.get("/availability/this-week", asyncHandler(async (req, res) => {
  const days = gen14days();
  //these are days that we are unavailable for example due to breaks
  const unavailableDays = [6, 0]; // 1 = Monday, 2 = Tuesday, 3 = Wednesday 4 = Thursday 5 = Friday 6 = Saturday 7 = Sunday
  const MAX_BOOKINGS_PER_DAY = 10;

  // First filter out unavailable days
  const available = days.filter(date => {
    const dayOfWeek = new Date(date).getDay();
    return !unavailableDays.includes(dayOfWeek);
  });

  // Get all bookings grouped by date, scoped to org if provided
  let query = supabase
    .from('bookings')
    .select('date_of_service')
    .gte('date_of_service', new Date().toISOString().split('T')[0]); // Only get future bookings

  const orgId = req.query.org_id;
  if (orgId) {
    query = query.eq('org_id', orgId);
  }

  const { data, error } = await query;
  
  if (error) {
    throw new DatabaseError('Error fetching bookings');
  }
  
  // Count bookings per day
  const bookingsPerDay = data.reduce((acc, booking) => {
    const date = booking.date_of_service.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Filter out days that have reached maximum bookings
  const availableDates = available.filter(date => {
    const dateStr = date.split('T')[0];
    return (bookingsPerDay[dateStr] || 0) < MAX_BOOKINGS_PER_DAY;
  });

  res.json(availableDates);
}));

router.get("/:id", validateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  
  if (!id) {
    throw new ValidationError('Booking ID is required');
  }

  const { data, error } = await client
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    throw new DatabaseError('Error fetching booking');
  }

  if (!data) {
    throw new NotFoundError('Booking not found');
  }
  
  res.json(data);
}));

/*
*
* User creates booking
*
*/
router.post("/", validateToken, asyncHandler(async (req, res) => {
    // 1. Setup client and authenticated user ID
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new AuthenticationError('Missing or malformed authorization header');
    }

    const jwt = authHeader.split(' ')[1];
    const client = createSupabaseClientWithAuth(jwt);

    // FIX: NEVER trust req.body.userId. Use the authenticated user ID.
    const userId = req.user.id; 

    logger.info("Booking request received for user:", { userId: userId, body: req.body });

    // 2. Destructure and Validate Required Fields
    const {
        selectedAddress,
        selectedDate,
        message,
        codes,
        hasPets,
        providerId,
        // userId (Ignored, using req.user.id instead)
    } = req.body;

    // Check for missing required fields
    if (!selectedAddress || !selectedDate) {
        throw new ValidationError('Missing required fields: address and date are mandatory.');
    }

    // Validate address structure
    if (!selectedAddress.address || !selectedAddress.city ||
        !selectedAddress.state || !selectedAddress.postal ||
        !selectedAddress.coordinates || selectedAddress.coordinates.length !== 2) {
        throw new ValidationError('Invalid address structure', {
            details: "Address must include address, city, state, postal, and coordinates[lat, lng]"
        });
    }

    // Validate date
    if (!selectedDate.bookingDate || isNaN(new Date(selectedDate.bookingDate).getTime())) {
        throw new ValidationError('Invalid booking date', {
            details: "Booking date must be a valid date string"
        });
    }

    try {
        // --- 3. Secure Property Creation/Lookup (RPC 1: check_and_create_property) ---
        // This function handles property creation, ownership check, and user association securely.
        const { data: property, error: propError } = await client.rpc('check_and_create_property', {
            _address: selectedAddress.address,
            _city: selectedAddress.city,
            _state: selectedAddress.state,
            _postal: selectedAddress.postal,
            _has_pets: hasPets ?? false,
            _coordinates: `(${selectedAddress.coordinates[0]},${selectedAddress.coordinates[1]})`,
            _codes: codes || [],
            _org_id: req.user.org_id || null
        });

        if (propError) {
             // Handle the "already owned" validation error thrown from the function
             if (propError.details?.includes('ValidationError')) {
                throw new ValidationError(propError.message);
             }
             throw new DatabaseError(`Error in property RPC: ${propError.message}`);
        }
        
        const propertyId = property.id;
        
        // --- 4. Secure Transactional Booking (RPC 2: create_full_booking_transaction) ---
        // This function handles the atomic creation of estimate, subscription, message, and booking.
        const { data: booking, error: bookingError } = await client.rpc('create_full_booking_transaction', {
            p_user_id: userId,
            p_property_id: propertyId,
            p_date_of_service: selectedDate.bookingDate,
            p_message: message,
            p_provider_id: providerId || null,
            p_org_id: req.user.org_id || null,
        });

        if (bookingError) {
             throw new DatabaseError(`Error in booking RPC: ${bookingError.message}`);
        }
        
        logger.info("Booking created with ID:", { bookingId: booking.id });

        // --- 5. Success Response ---
        // The booking object contains foreign keys to the newly created estimate, property, and subscription.
        res.status(201).json({
            success: true,
            booking,
            // You may want to fetch related data (property, estimate, subscription) 
            // separately in the frontend using the IDs returned in the booking object.
        });

    } catch (error) {
        // Let the asyncHandler handle the thrown Validation/Database/Authentication errors
        throw error;
    }
}));

/*
*
* Get booking status
*
*/
router.get("/status/:id", validateToken, async (req, res) => {
  const {id} = req.params;
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);

  logger.info(`Fetching booking status for ID: ${id}`);
  const { data, error } = await client
    .from('bookings')
    .select('payment_status')
    .eq('id', id)
    .single();

  if (error) {
    logger.error("Error fetching booking status:", error);
    return res.status(500).json({ error: "Error fetching booking status", details: error});
  }

  res.json(data);
});

router.patch("/status/:id", validateToken, async (req, res) => {
  const { id } = req.params;
  const { service_status } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);

  const { data, error } = await client
    .from('bookings')
    .update({ service_status })
    .eq('id', id)
    .select('id, service_status, subscription, property_id, customer_id')
    .single();

  if (error) {
    logger.error("Error updating booking status", error);
    //return res.status(500).json({error: "Failed to update status"});
    throw new DatabaseError("Failed to update status");
  }

  return res.status(200).json({message: "Status updated successfully", data})
});

/*
* Customer cancels booking
* Must be at least 1 day before service date
*/
router.patch("/cancel/:id", validateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  const userId = req.user.id;

  // Fetch the booking to check ownership and service date
  const { data: booking, error: fetchError } = await client
    .from('bookings')
    .select('id, customer_id, date_of_service, service_status, payment_status')
    .eq('id', id)
    .eq('customer_id', userId) // Ensure user owns this booking
    .single();

  if (fetchError || !booking) {
    throw new NotFoundError('Booking not found or you do not have permission to cancel it');
  }

  // Check if booking is already canceled or completed
  if (booking.service_status === 'canceled') {
    throw new ValidationError('Booking is already canceled');
  }

  if (booking.service_status === 'completed') {
    throw new ValidationError('Cannot cancel a completed booking');
  }

  // Check if service date is today or in the past
  const serviceDate = new Date(booking.date_of_service);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  serviceDate.setHours(0, 0, 0, 0); // Start of service date

  if (serviceDate <= today) {
    // Service is today or has passed - cannot cancel
    return res.status(400).json({
      error: {
        code: 'CANCELLATION_TOO_LATE',
        message: 'Bookings cannot be canceled on the day of service or after. Please contact support for assistance.'
      }
    });
  }

  // Cancel the booking
  const { data: canceledBooking, error: cancelError } = await client
    .from('bookings')
    .update({ 
      service_status: 'canceled',
      payment_status: 'canceled'
    })
    .eq('id', id)
    .select()
    .single();

  if (cancelError) {
    throw new DatabaseError('Failed to cancel booking');
  }

  logger.info(`Booking ${id} canceled by customer ${userId}`);

  res.status(200).json({
    message: 'Booking canceled successfully',
    booking: canceledBooking
  });
}));

export default router;
