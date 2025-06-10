/*
  # Complete Campus Market Database Schema

  1. New Tables
    - `users` - User profiles with verification status
    - `products` - Product listings with images and details
    - `chats` - Chat conversations between users
    - `messages` - Individual messages in chats
    - `orders` - Order tracking and management
    - `notifications` - User notifications
    - `user_preferences` - User category preferences
    - `verification_requests` - Student verification requests

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure data access based on user relationships

  3. Features
    - Full-text search on products
    - Image storage support
    - Real-time messaging
    - Order management
    - Notification system
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  university text,
  avatar_url text,
  phone text,
  bio text,
  is_verified boolean DEFAULT false,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  category text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('new', 'used')),
  images text[] DEFAULT '{}',
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_sold boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, seller_id, product_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  payment_method text DEFAULT 'cod' CHECK (payment_method IN ('cod', 'ecocash', 'paynow')),
  total_amount decimal(10,2) NOT NULL,
  delivery_address text,
  delivery_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL CHECK (type IN ('message', 'order', 'product', 'system')),
  is_read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  preferred_categories text[] DEFAULT '{}',
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  student_id_image_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saved_products table
CREATE TABLE IF NOT EXISTS saved_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all profiles" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create products" ON products FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- Chats policies
CREATE POLICY "Users can read own chats" ON chats FOR SELECT TO authenticated 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create chats" ON chats FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE TO authenticated 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages policies
CREATE POLICY "Users can read messages in their chats" ON messages FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM chats WHERE chats.id = messages.chat_id 
    AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
  ));
CREATE POLICY "Users can create messages in their chats" ON messages FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM chats WHERE chats.id = messages.chat_id 
    AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
  ) AND auth.uid() = sender_id);

-- Orders policies
CREATE POLICY "Users can read own orders" ON orders FOR SELECT TO authenticated 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE TO authenticated 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Verification requests policies
CREATE POLICY "Users can read own verification requests" ON verification_requests FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create verification requests" ON verification_requests FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Saved products policies
CREATE POLICY "Users can manage own saved products" ON saved_products FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_sold ON products(is_sold);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', title || ' ' || description));

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update chat last_message
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats 
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update chat when new message is added
CREATE TRIGGER update_chat_on_new_message 
  AFTER INSERT ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text,
  p_data jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, body, type, data)
  VALUES (p_user_id, p_title, p_body, p_type, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ language 'plpgsql';

-- Insert sample data for development
INSERT INTO users (id, email, name, university, is_verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'john@example.com', 'John Doe', 'University of Zimbabwe', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'jane@example.com', 'Jane Smith', 'Midlands State University', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'mike@example.com', 'Mike Johnson', 'National University of Science and Technology', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (title, description, price, category, condition, images, seller_id) VALUES
  ('MacBook Pro 13"', 'Excellent condition MacBook Pro with M1 chip. Perfect for students.', 1200.00, 'Electronics', 'used', 
   ARRAY['https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=400'], 
   '550e8400-e29b-41d4-a716-446655440000'),
  ('Calculus Textbook', 'Stewart Calculus 8th Edition. Great condition, no highlighting.', 45.00, 'Books', 'used',
   ARRAY['https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400'],
   '550e8400-e29b-41d4-a716-446655440001'),
  ('Study Desk', 'Wooden study desk with drawers. Perfect for dorm room.', 80.00, 'Furniture', 'used',
   ARRAY['https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=400'],
   '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT DO NOTHING;