-- Migration 004: Update RPC functions to accept and propagate org_id
-- Phase 2D: All new parameters have DEFAULT NULL for backward compatibility

-- Update handle_new_user to set org_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _role public.user_role;
  _org_id uuid;
BEGIN
  BEGIN
    _role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    _role := 'user';
  END;

  IF _role IS NULL THEN
    _role := 'user';
  END IF;

  -- Read org_id from metadata (set by frontend during registration)
  BEGIN
    _org_id := (NEW.raw_user_meta_data->>'org_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    _org_id := NULL;
  END;

  INSERT INTO public.users (id, email, source, password, role, org_id)
  VALUES (NEW.id, NEW.email, 'auth', 'oauth', _role, _org_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Update check_and_create_property to accept and propagate org_id
CREATE OR REPLACE FUNCTION public.check_and_create_property(
    _address text,
    _city text,
    _state text,
    _postal text,
    _has_pets boolean,
    _coordinates point,
    _codes jsonb,
    _org_id uuid DEFAULT NULL
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
    user_id_from_jwt := auth.uid();

    IF user_id_from_jwt IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Scope property lookup to org if provided
    IF _org_id IS NOT NULL THEN
        SELECT * INTO existing_property_record
        FROM public.properties
        WHERE address = _address
          AND city = _city
          AND state = _state
          AND postal = _postal
          AND org_id = _org_id
        LIMIT 1;
    ELSE
        SELECT * INTO existing_property_record
        FROM public.properties
        WHERE address = _address
          AND city = _city
          AND state = _state
          AND postal = _postal
        LIMIT 1;
    END IF;

    IF existing_property_record.id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.user_properties
            WHERE property_id = existing_property_record.id
              AND user_id = user_id_from_jwt
              AND deleted_at IS NULL
        ) INTO active_association_exists;

        IF active_association_exists THEN
            RETURN row_to_json(existing_property_record);
        ELSE
            INSERT INTO public.user_properties (property_id, user_id, deleted_at, org_id)
            VALUES (existing_property_record.id, user_id_from_jwt, NULL, _org_id);
            RETURN row_to_json(existing_property_record);
        END IF;
    ELSE
        INSERT INTO public.properties (address, city, state, postal, has_pets, coordinates, codes, org_id)
        VALUES (_address, _city, _state, _postal, _has_pets, _coordinates, _codes, _org_id)
        RETURNING * INTO property_record;

        INSERT INTO public.user_properties (property_id, user_id, deleted_at, org_id)
        VALUES (property_record.id, user_id_from_jwt, NULL, _org_id);

        RETURN row_to_json(property_record);
    END IF;
END;
$$;

-- Update create_full_booking_transaction to accept and propagate org_id
CREATE OR REPLACE FUNCTION public.create_full_booking_transaction(
    p_user_id uuid,
    p_property_id uuid,
    p_date_of_service timestamp,
    p_message text,
    p_provider_id uuid DEFAULT NULL,
    p_org_id uuid DEFAULT NULL
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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    INSERT INTO public.estimates (property_id, price_cents, org_id)
    VALUES (p_property_id, NULL, p_org_id)
    RETURNING id INTO new_estimate_id;

    INSERT INTO public.subscriptions (estimate_id, property_id, user_id, status, org_id)
    VALUES (new_estimate_id, p_property_id, p_user_id, 'pending', p_org_id)
    RETURNING id INTO new_subscription_id;

    IF p_message IS NOT NULL AND p_message != '' THEN
        INSERT INTO public.messages (user_id, property_id, message, org_id)
        VALUES (p_user_id, p_property_id, p_message, p_org_id)
        RETURNING id INTO new_message_id;
    END IF;

    INSERT INTO public.bookings (
        customer_id, property_id, date_of_service, subscription_id,
        message_id, service_status, payment_status, provider_id, org_id
    )
    VALUES (
        p_user_id, p_property_id, p_date_of_service, new_subscription_id,
        new_message_id, 'scheduled', 'pending', p_provider_id, p_org_id
    )
    RETURNING * INTO new_booking_record;

    RETURN row_to_json(new_booking_record);
END;
$$;
