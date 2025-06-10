/*
  # Fix Auth Triggers and User Creation

  1. Issues Fixed
    - Fix user creation during signup
    - Ensure proper handling of auth events
    - Add better error handling for user profile creation

  2. Changes
    - Update handle_new_user function to properly handle user creation
    - Add explicit error handling in user creation process
    - Ensure proper metadata handling from auth.users
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
  user_name text;
BEGIN
  -- Get the user ID
  new_user_id := NEW.id;
  
  -- Get the user name from metadata or use a default
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
  
  -- Log the user creation attempt (for debugging)
  RAISE NOTICE 'Creating user profile for: % (%) with name: %', 
    NEW.email, new_user_id, user_name;
  
  -- Insert user profile with data from auth metadata
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
    new_user_id,
    NEW.email,
    user_name,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    'pending',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    is_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE users.is_verified END,
    updated_at = now();
  
  -- Create default user preferences
  INSERT INTO public.user_preferences (
    user_id,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a separate trigger for updates to handle email confirmation
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if email_confirmed_at has changed from null to a value
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET 
      is_verified = true,
      verification_status = 'approved',
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating user verification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_user_update();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO postgres;
GRANT SELECT ON auth.users TO service_role;