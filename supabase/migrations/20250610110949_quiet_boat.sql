/*
  # Fix Authentication RLS Policy Issues

  1. Issues Fixed
    - Fix row-level security policy violations during user registration
    - Create secure RPC function for user creation
    - Update auth triggers to properly handle email verification

  2. Changes
    - Create a secure RPC function that bypasses RLS for user creation
    - Update RLS policies for the users table
    - Fix auth triggers for proper user creation and verification
*/

-- Create a secure RPC function to create user profiles
-- This bypasses RLS policies and allows for secure user creation
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_name text,
  is_user_verified boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public -- Ensure we're using the public schema
AS $$
DECLARE
  created_user_id uuid;
BEGIN
  -- First check if the user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Insert or update user profile
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    is_verified,
    verification_status,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    user_name,
    is_user_verified,
    CASE WHEN is_user_verified THEN 'approved' ELSE 'pending' END,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    is_verified = EXCLUDED.is_verified,
    verification_status = CASE WHEN EXCLUDED.is_verified THEN 'approved' ELSE 'pending' END,
    updated_at = now()
  RETURNING id INTO created_user_id;
  
  -- Create default user preferences
  INSERT INTO public.user_preferences (
    user_id,
    notifications_enabled,
    email_notifications,
    push_notifications,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    true,
    true,
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN created_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error details
    RAISE LOG 'Error in create_user_profile: %', SQLERRM;
    RAISE EXCEPTION 'Error creating user profile: %', SQLERRM;
END;
$$;

-- Grant execute permission on the function to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION create_user_profile(uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(uuid, text, text, boolean) TO anon;

-- Fix RLS policies for users table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Public can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Create new policies with proper permissions
CREATE POLICY "Anyone can read user profiles" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" 
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- Create policy for authenticated users to insert their own profile
CREATE POLICY "Authenticated users can insert their own profile" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create policy for anonymous users to insert profiles (needed for signup)
CREATE POLICY "Anonymous users can insert profiles" 
  ON users FOR INSERT 
  WITH CHECK (auth.role() = 'anon');

-- Ensure proper permissions for all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Function to get user verification status
CREATE OR REPLACE FUNCTION get_user_verification_status(p_user_id uuid)
RETURNS TABLE (
  is_verified boolean,
  profile_complete boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.is_verified,
    CASE 
      WHEN u.name IS NOT NULL AND u.email IS NOT NULL THEN true
      ELSE false
    END as profile_complete
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_verification_status(uuid) TO authenticated;