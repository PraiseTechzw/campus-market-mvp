/*
  # Campus Market Storage Configuration

  This file contains SQL statements to configure storage buckets and policies.
  Note: In a real Supabase project, you would create these buckets through the dashboard,
  but this file serves as documentation for the required storage setup.

  1. Storage Buckets
    - `avatars` - User profile pictures
    - `products` - Product images
    - `verification` - Student ID verification images
    - `chat-media` - Chat images and media

  2. Security Policies
    - Appropriate access controls for each bucket
    - Read/write permissions based on user roles
*/

-- Note: The following is for documentation purposes.
-- In a real Supabase project, you would create these buckets through the dashboard.

/*
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'User profile pictures', false),
  ('products', 'Product images', true),
  ('verification', 'Student ID verification images', false),
  ('chat-media', 'Chat images and media', false);

-- Set up storage policies for avatars bucket
-- Allow users to read their own avatar
CREATE POLICY "Users can read own avatar"
ON storage.objects FOR SELECT
USING (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'avatars'
);

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'avatars'
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'avatars'
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'avatars'
);

-- Set up storage policies for products bucket
-- Allow anyone to read product images
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'products'
);

-- Allow users to upload product images they own
CREATE POLICY "Users can upload own product images"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'products'
);

-- Allow users to update product images they own
CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
USING (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'products'
);

-- Allow users to delete product images they own
CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
USING (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'products'
);

-- Set up storage policies for verification bucket
-- Allow users to read their own verification images
CREATE POLICY "Users can read own verification images"
ON storage.objects FOR SELECT
USING (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'verification'
);

-- Allow users to upload their own verification images
CREATE POLICY "Users can upload own verification images"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.uid() = (storage.foldername(name))[1]::uuid
  AND bucket_id = 'verification'
);

-- Set up storage policies for chat-media bucket
-- Allow chat participants to read chat media
CREATE POLICY "Chat participants can read chat media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM chats c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

-- Allow chat participants to upload chat media
CREATE POLICY "Chat participants can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM chats c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);
*/

-- Create helper function to upload avatar
CREATE OR REPLACE FUNCTION upload_avatar_url(
  user_id uuid,
  avatar_url text
)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  -- Update user's avatar_url
  UPDATE users
  SET avatar_url = avatar_url,
      updated_at = now()
  WHERE id = user_id
  RETURNING avatar_url INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to upload product images
CREATE OR REPLACE FUNCTION update_product_images(
  product_id uuid,
  image_urls text[]
)
RETURNS text[] AS $$
DECLARE
  result text[];
BEGIN
  -- Update product's images
  UPDATE products
  SET images = image_urls,
      updated_at = now()
  WHERE id = product_id
    AND seller_id = auth.uid()
  RETURNING images INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to upload verification image
CREATE OR REPLACE FUNCTION submit_verification_request(
  user_id uuid,
  student_id_image_url text,
  university text,
  student_id_number text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  request_id uuid;
BEGIN
  -- Insert verification request
  INSERT INTO verification_requests (
    user_id,
    student_id_image_url,
    university,
    student_id_number
  )
  VALUES (
    user_id,
    student_id_image_url,
    university,
    student_id_number
  )
  RETURNING id INTO request_id;
  
  -- Create notification for user
  PERFORM create_notification(
    user_id,
    'Verification Submitted',
    'Your student verification request has been submitted and is under review.',
    'system',
    jsonb_build_object('requestId', request_id)
  );
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION upload_avatar_url(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_images(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_verification_request(uuid, text, text, text) TO authenticated;