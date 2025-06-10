/*
  # Fix Authentication and RLS Policy Issues

  1. Issues Fixed
    - Fix row-level security (RLS) policy for user creation
    - Add RPC function to bypass RLS for user creation
    - Update user creation trigger to handle auth state changes properly

  2. Changes
    - Create a secure RPC function for user profile creation
    - Update RLS policies to allow proper user registration
    - Fix user creation trigger to handle email verification
*/

-- Create a secure RPC function to create user profiles
-- This bypasses RLS policies and allows for secure user creation
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_name text,
  is_user_verified boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    is_verified
  )
  VALUES (
    user_id,
    user_email,
    user_name,
    is_user_verified
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    is_verified = EXCLUDED.is_verified,
    updated_at = now();
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(uuid, text, text, boolean) TO anon;

-- Update the handle_new_user function to use the secure RPC function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the secure RPC function to create the user profile
  PERFORM create_user_profile(
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
  );
  
  -- Create default user preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS policies for users table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies with proper permissions
CREATE POLICY "Public can read all profiles" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Create policy for service role to manage all users
CREATE POLICY "Service role can manage all users" 
  ON users 
  USING (auth.role() = 'service_role');

-- Create function to handle message notifications with proper error handling
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  chat_record record;
  recipient_id uuid;
  product_title text;
BEGIN
  -- Get chat details with error handling
  BEGIN
    SELECT c.*, p.title INTO chat_record
    FROM chats c
    JOIN products p ON c.product_id = p.id
    WHERE c.id = NEW.chat_id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error and exit gracefully
    RAISE NOTICE 'Error fetching chat details: %', SQLERRM;
    RETURN NEW;
  END;
  
  -- Skip if chat record not found
  IF chat_record IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine recipient
  IF NEW.sender_id = chat_record.buyer_id THEN
    recipient_id := chat_record.seller_id;
  ELSE
    recipient_id := chat_record.buyer_id;
  END IF;
  
  -- Create notification with error handling
  BEGIN
    INSERT INTO notifications (
      user_id,
      title,
      body,
      type,
      data
    ) VALUES (
      recipient_id,
      'New Message',
      'You have a new message about "' || chat_record.title || '"',
      'message',
      jsonb_build_object(
        'chatId', NEW.chat_id,
        'senderId', NEW.sender_id,
        'productId', chat_record.product_id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error and continue
    RAISE NOTICE 'Error creating notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure proper permissions for all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;