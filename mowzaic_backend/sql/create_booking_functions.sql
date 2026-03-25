-- ============================================
-- RPC Functions for Booking Flow
-- Run this in your Supabase SQL editor
-- ============================================

-- Function 1: check_and_create_property
-- This function checks if a property exists, validates ownership, and creates/associates it with the user
CREATE OR REPLACE FUNCTION public.check_and_create_property(
    _address text,
    _city text,
    _state text,
    _postal text,
    _has_pets boolean,
    _coordinates point,
    _codes jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_property_record RECORD;
    property_record RECORD;
    user_id_from_jwt uuid;
    active_association_exists boolean;
BEGIN
    -- Get the authenticated user's ID from JWT
    user_id_from_jwt := auth.uid();
    
    IF user_id_from_jwt IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Check if property exists with same address/city/state/postal
    SELECT * INTO existing_property_record
    FROM public.properties
    WHERE address = _address
      AND city = _city
      AND state = _state
      AND postal = _postal
    LIMIT 1;

    IF existing_property_record.id IS NOT NULL THEN
        -- Property exists, check for active association
        SELECT EXISTS(
            SELECT 1 FROM public.user_properties
            WHERE property_id = existing_property_record.id
              AND user_id = user_id_from_jwt
              AND deleted_at IS NULL
        ) INTO active_association_exists;

        IF active_association_exists THEN
            -- User already has active association, return property
            RETURN row_to_json(existing_property_record);
        ELSE
            -- Create new association
            INSERT INTO public.user_properties (property_id, user_id, deleted_at)
            VALUES (existing_property_record.id, user_id_from_jwt, NULL);
            
            RETURN row_to_json(existing_property_record);
        END IF;
    ELSE
        -- Property doesn't exist, create it
        INSERT INTO public.properties (address, city, state, postal, has_pets, coordinates, codes)
        VALUES (_address, _city, _state, _postal, _has_pets, _coordinates, _codes)
        RETURNING * INTO property_record;

        -- Create association
        INSERT INTO public.user_properties (property_id, user_id, deleted_at)
        VALUES (property_record.id, user_id_from_jwt, NULL);

        RETURN row_to_json(property_record);
    END IF;
END;
$$;

-- Function 2: create_full_booking_transaction
-- This function creates estimate, subscription, message, and booking atomically
CREATE OR REPLACE FUNCTION public.create_full_booking_transaction(
    p_user_id uuid,
    p_property_id uuid,
    p_date_of_service timestamp,
    p_message text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_estimate_id bigint;
    new_subscription_id bigint;
    new_message_id integer;
    new_booking_record RECORD;
BEGIN
    -- Validate user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Create estimate
    INSERT INTO public.estimates (property_id, price_cents)
    VALUES (p_property_id, NULL)
    RETURNING id INTO new_estimate_id;

    -- Create subscription
    INSERT INTO public.subscriptions (estimate_id, property_id, user_id, status)
    VALUES (new_estimate_id, p_property_id, p_user_id, 'pending')
    RETURNING id INTO new_subscription_id;

    -- Create message if provided
    IF p_message IS NOT NULL AND p_message != '' THEN
        INSERT INTO public.messages (user_id, property_id, message)
        VALUES (p_user_id, p_property_id, p_message)
        RETURNING id INTO new_message_id;
    END IF;

    -- Create booking
    INSERT INTO public.bookings (
        customer_id,
        property_id,
        date_of_service,
        subscription_id,
        message_id,
        service_status,
        payment_status,
        provider_id
    )
    VALUES (
        p_user_id,
        p_property_id,
        p_date_of_service,
        new_subscription_id,
        new_message_id,
        'scheduled',
        'pending',
        NULL
    )
    RETURNING * INTO new_booking_record;

    RETURN row_to_json(new_booking_record);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_and_create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_full_booking_transaction TO authenticated;
