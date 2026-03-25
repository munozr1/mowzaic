-- Migration: Switch from custom auth to Supabase Auth
-- This migrates user IDs from integer to UUID to align with Supabase auth.users

-- Step 1: Drop all foreign key constraints temporarily
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE user_properties DROP CONSTRAINT IF EXISTS user_properties_user_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Step 2: Alter users table - change id from integer to uuid
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE users ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 3: Update foreign key columns in related tables to uuid
ALTER TABLE bookings ALTER COLUMN customer_id TYPE uuid USING gen_random_uuid();
ALTER TABLE user_properties ALTER COLUMN user_id TYPE uuid USING gen_random_uuid();
ALTER TABLE messages ALTER COLUMN user_id TYPE uuid USING gen_random_uuid();
ALTER TABLE subscriptions ALTER COLUMN user_id TYPE uuid USING gen_random_uuid();

-- Step 4: Re-add foreign key constraints
ALTER TABLE bookings 
  ADD CONSTRAINT bookings_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_properties 
  ADD CONSTRAINT user_properties_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages 
  ADD CONSTRAINT messages_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE subscriptions 
  ADD CONSTRAINT subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Update RLS policies to use auth.uid() instead of custom JWT

-- Bookings policies
DROP POLICY IF EXISTS "client_all" ON bookings;
DROP POLICY IF EXISTS "provider_read" ON bookings;
DROP POLICY IF EXISTS "provider_update" ON bookings;

CREATE POLICY "client_all" ON bookings
FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "provider_read" ON bookings
FOR SELECT
TO authenticated
USING (provider_id = auth.uid());

CREATE POLICY "provider_update" ON bookings
FOR UPDATE
TO authenticated
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

-- Users policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

CREATE POLICY "Users can view their own data" ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own data" ON users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- User properties policies
DROP POLICY IF EXISTS "client_read" ON user_properties;

CREATE POLICY "client_read" ON user_properties
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "client_insert" ON user_properties
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "client_update" ON user_properties
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own messages" ON messages
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 6: Add first_name and last_name columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name text;

-- Step 7: Drop the old name column if it exists and we have first_name/last_name
-- ALTER TABLE users DROP COLUMN IF EXISTS name;

-- Step 8: Add stripe_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_id text UNIQUE;
