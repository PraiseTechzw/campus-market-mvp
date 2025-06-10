/*
  # Fix Database Permissions and RLS Policies

  1. Security Updates
    - Fix RLS policies for users table
    - Allow users to insert their own profile
    - Ensure proper access control for all tables

  2. Policy Updates
    - Users can create their own profile during signup
    - Users can read all public profile information
    - Users can update only their own profile
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create comprehensive user policies
CREATE POLICY "Users can read all profiles" ON users 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with data from auth metadata
  INSERT INTO users (id, email, name, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    is_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE users.is_verified END;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure auth schema access for the function
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;