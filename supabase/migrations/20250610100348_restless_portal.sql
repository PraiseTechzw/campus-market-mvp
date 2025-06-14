/*
  # Complete Campus Market Database Schema

  This migration file contains the complete database schema for the Campus Market application,
  including tables, functions, triggers, policies, and storage configuration.

  1. Core Tables
    - `users` - User profiles with verification status
    - `products` - Product listings with images and specifications
    - `categories` - Product categories
    - `chats` - Chat conversations between users
    - `messages` - Individual messages in chats
    - `orders` - Order tracking and management
    - `notifications` - User notifications
    - `user_preferences` - User settings and preferences
    - `verification_requests` - Student verification requests
    - `saved_products` - User saved/favorited products
    - `product_reviews` - Product reviews and ratings
    - `user_addresses` - User delivery addresses
    - `reports` - User reports for products/users

  2. Storage Buckets
    - `avatars` - User profile pictures
    - `products` - Product images
    - `documents` - Student ID verification images
    - `chat-media` - Chat images and media

  3. Security
    - Row Level Security (RLS) on all tables
    - Comprehensive policies for data access
    - Secure storage bucket policies

  4. Functions
    - User profile management
    - Product search and filtering
    - Chat and messaging
    - Order management
    - Notification system
    - Verification process
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===============================
-- TABLES
-- ===============================

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
  rating decimal(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_earnings decimal(10,2) DEFAULT 0.0,
  last_active timestamptz DEFAULT now(),
  is_online boolean DEFAULT false,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  color text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO categories (name, description, icon, color, sort_order) VALUES
  ('Electronics', 'Phones, laptops, gadgets and electronic devices', 'phone-portrait', '#3B82F6', 1),
  ('Books', 'Textbooks, novels, academic materials', 'book', '#10B981', 2),
  ('Fashion', 'Clothing, shoes, accessories', 'shirt', '#F59E0B', 3),
  ('Services', 'Tutoring, repairs, and other services', 'construct', '#8B5CF6', 4),
  ('Furniture', 'Desks, chairs, dorm furniture', 'bed', '#EF4444', 5),
  ('Sports', 'Sports equipment and gear', 'football', '#06B6D4', 6),
  ('Beauty', 'Cosmetics, skincare, personal care', 'flower', '#EC4899', 7),
  ('Food', 'Snacks, meal plans, kitchen items', 'restaurant', '#84CC16', 8),
  ('Other', 'Miscellaneous items', 'ellipsis-horizontal', '#6B7280', 9)
ON CONFLICT (name) DO NOTHING;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  category_id uuid REFERENCES categories(id),
  category text NOT NULL, -- Denormalized for easier queries
  condition text NOT NULL CHECK (condition IN ('new', 'used', 'refurbished')),
  images text[] DEFAULT '{}',
  specifications jsonb DEFAULT '{}',
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_sold boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_promoted boolean DEFAULT false,
  view_count integer DEFAULT 0,
  save_count integer DEFAULT 0,
  location text,
  tags text[] DEFAULT '{}',
  availability_status text DEFAULT 'available' CHECK (availability_status IN ('available', 'pending', 'sold', 'removed')),
  expires_at timestamptz,
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
  last_message_sender_id uuid REFERENCES users(id),
  is_archived boolean DEFAULT false,
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
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'offer', 'system')),
  media_url text,
  offer_amount decimal(10,2),
  offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired')),
  is_read boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  reply_to_id uuid REFERENCES messages(id),
  created_at timestamptz DEFAULT now()
);

-- Create user_addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'home' CHECK (type IN ('dorm', 'home', 'work', 'other')),
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text,
  postal_code text,
  country text DEFAULT 'Zimbabwe',
  phone text,
  is_default boolean DEFAULT false,
  delivery_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE,
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed')),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'ecocash', 'paynow', 'bank_transfer')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  total_amount decimal(10,2) NOT NULL,
  delivery_method text DEFAULT 'meetup' CHECK (delivery_method IN ('meetup', 'delivery', 'pickup')),
  delivery_address_id uuid REFERENCES user_addresses(id),
  delivery_notes text,
  meetup_location text,
  meetup_time timestamptz,
  tracking_number text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL CHECK (type IN ('message', 'order', 'product', 'system', 'promotion', 'review')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read boolean DEFAULT false,
  action_url text,
  data jsonb DEFAULT '{}',
  expires_at timestamptz,
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
  sms_notifications boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  price_alerts boolean DEFAULT true,
  new_message_notifications boolean DEFAULT true,
  order_updates boolean DEFAULT true,
  product_recommendations boolean DEFAULT true,
  weekly_digest boolean DEFAULT true,
  language text DEFAULT 'en',
  currency text DEFAULT 'USD',
  timezone text DEFAULT 'UTC',
  privacy_level text DEFAULT 'public' CHECK (privacy_level IN ('public', 'students', 'private')),
  show_online_status boolean DEFAULT true,
  show_last_seen boolean DEFAULT true,
  allow_contact_from text DEFAULT 'verified' CHECK (allow_contact_from IN ('anyone', 'verified', 'none')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  student_id_image_url text NOT NULL,
  university text NOT NULL,
  student_id_number text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  verification_code text,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saved_products table
CREATE TABLE IF NOT EXISTS saved_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  collection_name text DEFAULT 'default',
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  images text[] DEFAULT '{}',
  is_verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(reviewer_id, product_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reported_product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  reported_message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('spam', 'inappropriate', 'fake', 'harassment', 'fraud', 'other')),
  reason text NOT NULL,
  description text,
  evidence_urls text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_views table for analytics
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  referrer text,
  session_id text,
  viewed_at timestamptz DEFAULT now()
);

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  query text NOT NULL,
  filters jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  clicked_product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- ===============================
-- ENABLE ROW LEVEL SECURITY
-- ===============================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- ===============================
-- SECURITY POLICIES
-- ===============================

-- Users policies
CREATE POLICY "Users can read all profiles" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT TO authenticated USING (true);

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
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE TO authenticated 
  USING (auth.uid() = sender_id);

-- User addresses policies
CREATE POLICY "Users can manage own addresses" ON user_addresses FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- Product reviews policies
CREATE POLICY "Anyone can read reviews" ON product_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reviews" ON product_reviews FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON product_reviews FOR UPDATE TO authenticated 
  USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON product_reviews FOR DELETE TO authenticated 
  USING (auth.uid() = reviewer_id);

-- Reports policies
CREATE POLICY "Users can read own reports" ON reports FOR SELECT TO authenticated 
  USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON reports FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = reporter_id);

-- Product views policies
CREATE POLICY "Users can create product views" ON product_views FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = viewer_id OR viewer_id IS NULL);
CREATE POLICY "Users can read own product views" ON product_views FOR SELECT TO authenticated 
  USING (auth.uid() = viewer_id);

-- Search history policies
CREATE POLICY "Users can manage own search history" ON search_history FOR ALL TO authenticated 
  USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ===============================
-- INDEXES
-- ===============================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_sold ON products(is_sold);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability_status);
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_products_specifications ON products USING gin(specifications);

-- Chats indexes
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- User addresses indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(is_default);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Saved products indexes
CREATE INDEX IF NOT EXISTS idx_saved_products_user_id ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_product_id ON saved_products(product_id);

-- Product reviews indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_seller_id ON product_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_reviewer_id ON product_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_product_id ON reports(reported_product_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(
  to_tsvector('english', 
    title || ' ' || 
    description || ' ' || 
    category || ' ' || 
    COALESCE(array_to_string(tags, ' '), '') || ' ' ||
    COALESCE((specifications->>'brand')::text, '') || ' ' ||
    COALESCE((specifications->>'model')::text, '')
  )
);

-- ===============================
-- FUNCTIONS AND TRIGGERS
-- ===============================

-- Function to update updated_at column
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
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update chat last_message
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats 
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
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

-- Function to create message notification
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  chat_record record;
  recipient_id uuid;
  product_title text;
BEGIN
  -- Get chat details
  SELECT c.*, p.title INTO chat_record
  FROM chats c
  JOIN products p ON c.product_id = p.id
  WHERE c.id = NEW.chat_id;
  
  -- Determine recipient
  IF NEW.sender_id = chat_record.buyer_id THEN
    recipient_id := chat_record.seller_id;
  ELSE
    recipient_id := chat_record.buyer_id;
  END IF;
  
  -- Create notification
  PERFORM create_notification(
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
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for message notifications
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Function to handle new user registration
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
  
  -- Create default user preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update product save count
CREATE OR REPLACE FUNCTION update_product_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET save_count = save_count + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET save_count = save_count - 1 WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for save count
CREATE TRIGGER update_product_save_count_trigger
  AFTER INSERT OR DELETE ON saved_products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_save_count();

-- Function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating decimal(3,2);
  review_count integer;
BEGIN
  -- Calculate new average rating
  SELECT AVG(rating)::decimal(3,2), COUNT(*)
  INTO avg_rating, review_count
  FROM product_reviews
  WHERE seller_id = NEW.seller_id;
  
  -- Update user rating
  UPDATE users
  SET rating = avg_rating,
      total_reviews = review_count
  WHERE id = NEW.seller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user rating updates
CREATE TRIGGER update_user_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Function to update product status when sold
CREATE OR REPLACE FUNCTION update_product_when_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Mark product as sold
    UPDATE products
    SET is_sold = true,
        availability_status = 'sold',
        updated_at = now()
    WHERE id = NEW.product_id;
    
    -- Update seller stats
    UPDATE users
    SET total_sales = total_sales + 1,
        total_earnings = total_earnings + NEW.total_amount
    WHERE id = NEW.seller_id;
    
    -- Create notifications
    PERFORM create_notification(
      NEW.buyer_id,
      'Order Completed',
      'Your order has been marked as completed.',
      'order',
      jsonb_build_object('orderId', NEW.id, 'productId', NEW.product_id)
    );
    
    PERFORM create_notification(
      NEW.seller_id,
      'Sale Completed',
      'Your item has been sold and the order is complete.',
      'order',
      jsonb_build_object('orderId', NEW.id, 'productId', NEW.product_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order completion
CREATE TRIGGER update_product_when_sold_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_product_when_sold();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'CM-' || to_char(now(), 'YYYYMMDD') || '-' || 
                      lpad(nextval('order_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Function to handle default address
CREATE OR REPLACE FUNCTION handle_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for default address
CREATE TRIGGER handle_default_address_trigger
  AFTER INSERT OR UPDATE ON user_addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION handle_default_address();

-- Function to update user last_active
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET last_active = now()
  WHERE id = auth.uid();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- SEARCH AND QUERY FUNCTIONS
-- ===============================

-- Function for advanced product search
CREATE OR REPLACE FUNCTION search_products(
  search_query text DEFAULT NULL,
  category_filter text DEFAULT NULL,
  min_price decimal DEFAULT NULL,
  max_price decimal DEFAULT NULL,
  condition_filter text DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price decimal,
  category text,
  condition text,
  images text[],
  specifications jsonb,
  seller_id uuid,
  is_sold boolean,
  is_featured boolean,
  view_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.category,
    p.condition,
    p.images,
    p.specifications,
    p.seller_id,
    p.is_sold,
    p.is_featured,
    p.view_count,
    p.created_at,
    p.updated_at,
    CASE 
      WHEN search_query IS NULL THEN 0
      ELSE ts_rank(
        to_tsvector('english', 
          p.title || ' ' || 
          p.description || ' ' || 
          p.category || ' ' || 
          COALESCE(array_to_string(p.tags, ' '), '') || ' ' ||
          COALESCE((p.specifications->>'brand')::text, '') || ' ' ||
          COALESCE((p.specifications->>'model')::text, '')
        ),
        plainto_tsquery('english', search_query)
      )
    END as rank
  FROM products p
  WHERE 
    p.is_sold = false
    AND p.availability_status = 'available'
    AND (
      search_query IS NULL OR
      to_tsvector('english', 
        p.title || ' ' || 
        p.description || ' ' || 
        p.category || ' ' || 
        COALESCE(array_to_string(p.tags, ' '), '') || ' ' ||
        COALESCE((p.specifications->>'brand')::text, '') || ' ' ||
        COALESCE((p.specifications->>'model')::text, '')
      ) @@ plainto_tsquery('english', search_query)
    )
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (condition_filter IS NULL OR p.condition = condition_filter)
  ORDER BY 
    CASE WHEN sort_by = 'relevance' AND search_query IS NOT NULL THEN rank END DESC,
    p.is_featured DESC,
    CASE WHEN sort_by = 'price_asc' THEN p.price END ASC,
    CASE WHEN sort_by = 'price_desc' THEN p.price END DESC,
    CASE WHEN sort_by = 'newest' THEN p.created_at END DESC,
    CASE WHEN sort_by = 'popular' THEN p.view_count END DESC,
    p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user profile statistics
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  university text,
  avatar_url text,
  is_verified boolean,
  rating numeric,
  total_reviews bigint,
  total_sales bigint,
  total_earnings numeric,
  active_listings bigint,
  sold_listings bigint,
  joined_days integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.university,
    u.avatar_url,
    u.is_verified,
    COALESCE(AVG(pr.rating), 0)::numeric as rating,
    COUNT(pr.id)::bigint as total_reviews,
    COUNT(DISTINCT o.id)::bigint as total_sales,
    COALESCE(SUM(o.total_amount), 0)::numeric as total_earnings,
    COUNT(DISTINCT CASE WHEN p.is_sold = false THEN p.id END)::bigint as active_listings,
    COUNT(DISTINCT CASE WHEN p.is_sold = true THEN p.id END)::bigint as sold_listings,
    EXTRACT(DAY FROM (NOW() - u.created_at))::integer as joined_days
  FROM users u
  LEFT JOIN product_reviews pr ON pr.seller_id = u.id
  LEFT JOIN orders o ON o.seller_id = u.id AND o.status = 'delivered'
  LEFT JOIN products p ON p.seller_id = u.id
  WHERE u.id = user_id
  GROUP BY u.id;
END;
$$;

-- Function to get user's saved products
CREATE OR REPLACE FUNCTION get_user_saved_products(user_id uuid)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  title text,
  price decimal,
  category text,
  images text[],
  seller_name text,
  seller_verified boolean,
  saved_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    p.id as product_id,
    p.title,
    p.price,
    p.category,
    p.images,
    u.name as seller_name,
    u.is_verified as seller_verified,
    sp.created_at as saved_at
  FROM saved_products sp
  JOIN products p ON sp.product_id = p.id
  JOIN users u ON p.seller_id = u.id
  WHERE sp.user_id = user_id
  ORDER BY sp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's orders
CREATE OR REPLACE FUNCTION get_user_orders(user_id uuid, role text)
RETURNS TABLE (
  id uuid,
  order_number text,
  product_title text,
  product_image text,
  total_amount decimal,
  status text,
  created_at timestamptz,
  other_party_name text,
  other_party_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    p.title as product_title,
    COALESCE(p.images[1], '') as product_image,
    o.total_amount,
    o.status,
    o.created_at,
    CASE 
      WHEN role = 'buyer' THEN seller.name
      ELSE buyer.name
    END as other_party_name,
    CASE 
      WHEN role = 'buyer' THEN o.seller_id
      ELSE o.buyer_id
    END as other_party_id
  FROM orders o
  JOIN products p ON o.product_id = p.id
  JOIN users buyer ON o.buyer_id = buyer.id
  JOIN users seller ON o.seller_id = seller.id
  WHERE (role = 'buyer' AND o.buyer_id = user_id) OR (role = 'seller' AND o.seller_id = user_id)
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's chats
CREATE OR REPLACE FUNCTION get_user_chats(user_id uuid)
RETURNS TABLE (
  id uuid,
  product_title text,
  product_image text,
  other_party_name text,
  other_party_id uuid,
  other_party_avatar text,
  other_party_verified boolean,
  last_message text,
  last_message_at timestamptz,
  is_unread boolean,
  is_buyer boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    p.title as product_title,
    COALESCE(p.images[1], '') as product_image,
    CASE 
      WHEN c.buyer_id = user_id THEN seller.name
      ELSE buyer.name
    END as other_party_name,
    CASE 
      WHEN c.buyer_id = user_id THEN c.seller_id
      ELSE c.buyer_id
    END as other_party_id,
    CASE 
      WHEN c.buyer_id = user_id THEN seller.avatar_url
      ELSE buyer.avatar_url
    END as other_party_avatar,
    CASE 
      WHEN c.buyer_id = user_id THEN seller.is_verified
      ELSE buyer.is_verified
    END as other_party_verified,
    c.last_message,
    c.last_message_at,
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.chat_id = c.id 
      AND m.is_read = false 
      AND m.sender_id != user_id
    ) as is_unread,
    c.buyer_id = user_id as is_buyer
  FROM chats c
  JOIN products p ON c.product_id = p.id
  JOIN users buyer ON c.buyer_id = buyer.id
  JOIN users seller ON c.seller_id = seller.id
  WHERE c.buyer_id = user_id OR c.seller_id = user_id
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's notifications
CREATE OR REPLACE FUNCTION get_user_notifications(user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  body text,
  type text,
  is_read boolean,
  data jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.body,
    n.type,
    n.is_read,
    n.data,
    n.created_at
  FROM notifications n
  WHERE n.user_id = user_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product details with seller info
CREATE OR REPLACE FUNCTION get_product_details(product_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price decimal,
  category text,
  condition text,
  images text[],
  specifications jsonb,
  seller_id uuid,
  seller_name text,
  seller_avatar text,
  seller_university text,
  seller_verified boolean,
  seller_rating decimal,
  seller_reviews integer,
  is_sold boolean,
  is_featured boolean,
  view_count integer,
  save_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.category,
    p.condition,
    p.images,
    p.specifications,
    p.seller_id,
    u.name as seller_name,
    u.avatar_url as seller_avatar,
    u.university as seller_university,
    u.is_verified as seller_verified,
    u.rating as seller_rating,
    u.total_reviews as seller_reviews,
    p.is_sold,
    p.is_featured,
    p.view_count,
    p.save_count,
    p.created_at
  FROM products p
  JOIN users u ON p.seller_id = u.id
  WHERE p.id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get related products
CREATE OR REPLACE FUNCTION get_related_products(product_id uuid, limit_count integer DEFAULT 6)
RETURNS TABLE (
  id uuid,
  title text,
  price decimal,
  category text,
  images text[],
  seller_id uuid,
  seller_name text,
  seller_verified boolean
) AS $$
DECLARE
  product_category text;
  product_seller_id uuid;
BEGIN
  -- Get the product's category and seller
  SELECT p.category, p.seller_id INTO product_category, product_seller_id
  FROM products p
  WHERE p.id = product_id;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.category,
    p.images,
    p.seller_id,
    u.name as seller_name,
    u.is_verified as seller_verified
  FROM products p
  JOIN users u ON p.seller_id = u.id
  WHERE p.category = product_category
    AND p.id != product_id
    AND p.is_sold = false
    AND p.availability_status = 'available'
  ORDER BY 
    -- Prioritize products from the same seller
    (p.seller_id = product_seller_id) DESC,
    p.is_featured DESC,
    p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product reviews
CREATE OR REPLACE FUNCTION get_product_reviews(product_id uuid)
RETURNS TABLE (
  id uuid,
  rating integer,
  title text,
  comment text,
  images text[],
  reviewer_id uuid,
  reviewer_name text,
  reviewer_avatar text,
  is_verified_purchase boolean,
  helpful_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.rating,
    pr.title,
    pr.comment,
    pr.images,
    pr.reviewer_id,
    u.name as reviewer_name,
    u.avatar_url as reviewer_avatar,
    pr.is_verified_purchase,
    pr.helpful_count,
    pr.created_at
  FROM product_reviews pr
  JOIN users u ON pr.reviewer_id = u.id
  WHERE pr.product_id = product_id
  ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get seller's products
CREATE OR REPLACE FUNCTION get_seller_products(seller_id uuid, limit_count integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  title text,
  price decimal,
  category text,
  images text[],
  is_sold boolean,
  view_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.category,
    p.images,
    p.is_sold,
    p.view_count,
    p.created_at
  FROM products p
  WHERE p.seller_id = seller_id
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's earnings data
CREATE OR REPLACE FUNCTION get_user_earnings(user_id uuid)
RETURNS TABLE (
  total_earnings decimal,
  this_month decimal,
  last_month decimal,
  total_sales integer,
  average_price decimal,
  top_category text
) AS $$
DECLARE
  now_date date := current_date;
  month_start date := date_trunc('month', now_date)::date;
  last_month_start date := date_trunc('month', now_date - interval '1 month')::date;
  last_month_end date := (date_trunc('month', now_date) - interval '1 day')::date;
BEGIN
  RETURN QUERY
  WITH sales AS (
    SELECT 
      p.id,
      p.price,
      p.category,
      o.created_at
    FROM products p
    JOIN orders o ON p.id = o.product_id
    WHERE p.seller_id = user_id
      AND p.is_sold = true
      AND o.status = 'completed'
  ),
  this_month_sales AS (
    SELECT SUM(price) as amount
    FROM sales
    WHERE created_at >= month_start
  ),
  last_month_sales AS (
    SELECT SUM(price) as amount
    FROM sales
    WHERE created_at >= last_month_start AND created_at <= last_month_end
  ),
  category_counts AS (
    SELECT 
      category,
      COUNT(*) as count
    FROM sales
    GROUP BY category
    ORDER BY count DESC
    LIMIT 1
  )
  SELECT
    COALESCE((SELECT SUM(price) FROM sales), 0) as total_earnings,
    COALESCE((SELECT amount FROM this_month_sales), 0) as this_month,
    COALESCE((SELECT amount FROM last_month_sales), 0) as last_month,
    COALESCE((SELECT COUNT(*) FROM sales), 0)::integer as total_sales,
    CASE 
      WHEN (SELECT COUNT(*) FROM sales) > 0 
      THEN COALESCE((SELECT SUM(price) FROM sales) / (SELECT COUNT(*) FROM sales), 0)
      ELSE 0
    END as average_price,
    COALESCE((SELECT category FROM category_counts), '') as top_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(p_chat_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET is_read = true
  WHERE chat_id = p_chat_id
    AND is_read = false
    AND sender_id != p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id uuid)
RETURNS integer AS $$
DECLARE
  count_result integer;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  WHERE m.is_read = false
    AND m.sender_id != user_id
    AND (c.buyer_id = user_id OR c.seller_id = user_id);
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id uuid)
RETURNS integer AS $$
DECLARE
  count_result integer;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM notifications
  WHERE user_id = user_id AND is_read = false;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if product is saved by user
CREATE OR REPLACE FUNCTION is_product_saved(p_product_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_saved boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM saved_products
    WHERE product_id = p_product_id AND user_id = p_user_id
  ) INTO is_saved;
  
  RETURN is_saved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending products
CREATE OR REPLACE FUNCTION get_trending_products(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  price decimal,
  category text,
  images text[],
  seller_id uuid,
  seller_name text,
  seller_verified boolean,
  view_count integer,
  save_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.category,
    p.images,
    p.seller_id,
    u.name as seller_name,
    u.is_verified as seller_verified,
    p.view_count,
    p.save_count
  FROM products p
  JOIN users u ON p.seller_id = u.id
  WHERE p.is_sold = false
    AND p.availability_status = 'available'
  ORDER BY 
    p.view_count DESC,
    p.save_count DESC,
    p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get new arrivals
CREATE OR REPLACE FUNCTION get_new_arrivals(days_ago integer DEFAULT 7, limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  price decimal,
  category text,
  images text[],
  seller_id uuid,
  seller_name text,
  seller_verified boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.category,
    p.images,
    p.seller_id,
    u.name as seller_name,
    u.is_verified as seller_verified,
    p.created_at
  FROM products p
  JOIN users u ON p.seller_id = u.id
  WHERE p.is_sold = false
    AND p.availability_status = 'available'
    AND p.created_at >= (now() - (days_ago || ' days')::interval)
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get flash deals
CREATE OR REPLACE FUNCTION get_flash_deals(max_price decimal DEFAULT 100, limit_count integer DEFAULT 8)
RETURNS TABLE (
  id uuid,
  title text,
  price decimal,
  category text,
  images text[],
  seller_id uuid,
  seller_name text,
  seller_verified boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.category,
    p.images,
    p.seller_id,
    u.name as seller_name,
    u.is_verified as seller_verified
  FROM products p
  JOIN users u ON p.seller_id = u.id
  WHERE p.is_sold = false
    AND p.availability_status = 'available'
    AND p.price <= max_price
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category stats
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (
  category text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    COUNT(*) as count
  FROM products p
  WHERE p.is_sold = false
    AND p.availability_status = 'available'
  GROUP BY p.category
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to upload avatar
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

-- Helper function to upload product images
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

-- Helper function to upload verification image
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

-- ===============================
-- STORAGE BUCKETS
-- ===============================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'User profile pictures', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('products', 'Product images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'Verification documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('chat-media', 'Chat images and media', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Users can view all avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for products bucket
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for documents bucket (verification documents)
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for chat-media bucket
CREATE POLICY "Chat participants can view chat media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-media'
    AND EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media'
    AND EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can delete chat media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-media'
    AND EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ===============================
-- GRANT PERMISSIONS
-- ===============================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure auth schema access for the function
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- ===============================
-- SAMPLE DATA
-- ===============================

-- Sample users (passwords would be managed through auth.users in a real setup)
INSERT INTO users (id, email, name, university, is_verified, avatar_url, rating, total_reviews)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'john@example.com', 'John Smith', 'University of Zimbabwe', true, 'https://randomuser.me/api/portraits/men/1.jpg', 4.8, 24),
  ('00000000-0000-0000-0000-000000000002', 'jane@example.com', 'Jane Doe', 'University of Zimbabwe', true, 'https://randomuser.me/api/portraits/women/2.jpg', 4.9, 18),
  ('00000000-0000-0000-0000-000000000003', 'mike@example.com', 'Mike Johnson', 'Midlands State University', true, 'https://randomuser.me/api/portraits/men/3.jpg', 4.7, 15),
  ('00000000-0000-0000-0000-000000000004', 'sarah@example.com', 'Sarah Chen', 'National University of Science and Technology', false, 'https://randomuser.me/api/portraits/women/4.jpg', 4.5, 8),
  ('00000000-0000-0000-0000-000000000005', 'david@example.com', 'David Wilson', 'Africa University', true, 'https://randomuser.me/api/portraits/men/5.jpg', 4.6, 12)
ON CONFLICT (id) DO NOTHING;

-- Sample products
INSERT INTO products (id, title, description, price, category_id, category, condition, images, specifications, seller_id, view_count, save_count)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'iPhone 13 Pro - Excellent Condition',
    'Selling my iPhone 13 Pro in excellent condition. Only used for 6 months, no scratches or dents. Comes with original charger and box. Battery health at 98%.',
    650.00,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    'Electronics',
    'used',
    ARRAY['https://images.pexels.com/photos/5750001/pexels-photo-5750001.jpeg'],
    '{"brand": "Apple", "model": "iPhone 13 Pro", "storage": "128GB", "color": "Graphite", "screenSize": "6.1 inches", "batteryHealth": "98%"}',
    '00000000-0000-0000-0000-000000000001',
    120,
    15
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Calculus Textbook - 8th Edition',
    'Calculus: Early Transcendentals 8th Edition by James Stewart. In good condition with minimal highlighting. Perfect for Calculus I, II, and III courses.',
    45.00,
    (SELECT id FROM categories WHERE name = 'Books'),
    'Books',
    'used',
    ARRAY['https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg'],
    '{"author": "James Stewart", "edition": "8th", "subject": "Mathematics", "isbn": "978-1285741550", "year": "2015"}',
    '00000000-0000-0000-0000-000000000002',
    85,
    12
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'MacBook Air M1 - Like New',
    'MacBook Air with M1 chip, purchased last year. 8GB RAM, 256GB SSD. Space Gray color. Barely used, in perfect condition. Includes charger and original box.',
    750.00,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    'Electronics',
    'used',
    ARRAY['https://images.pexels.com/photos/7974/pexels-photo.jpg'],
    '{"brand": "Apple", "model": "MacBook Air M1", "ram": "8GB", "storage": "256GB", "processor": "Apple M1", "color": "Space Gray", "year": "2022"}',
    '00000000-0000-0000-0000-000000000003',
    200,
    25
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'Desk Lamp with USB Charging Port',
    'Modern LED desk lamp with adjustable brightness and color temperature. Includes USB charging port for your devices. Perfect for dorm rooms and study areas.',
    25.00,
    (SELECT id FROM categories WHERE name = 'Furniture'),
    'Furniture',
    'new',
    ARRAY['https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg'],
    '{"brand": "TaoTronics", "color": "White", "features": "USB charging, adjustable brightness", "dimensions": "15 x 6 x 18 inches"}',
    '00000000-0000-0000-0000-000000000004',
    65,
    8
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'Nike Air Zoom Pegasus 38 - Size 10',
    'Nike running shoes, only worn a few times. Men\'s size 10. Black and white color. Very comfortable for running or everyday use.',
    60.00,
    (SELECT id FROM categories WHERE name = 'Fashion'),
    'Fashion',
    'used',
    ARRAY['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg'],
    '{"brand": "Nike", "model": "Air Zoom Pegasus 38", "size": "10", "color": "Black/White", "gender": "Men's"}',
    '00000000-0000-0000-0000-000000000005',
    95,
    14
  )
ON CONFLICT (id) DO NOTHING;

-- Sample chats
INSERT INTO chats (id, buyer_id, seller_id, product_id, last_message, last_message_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    'Is this still available?',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000102',
    'Would you accept $40?',
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000103',
    'Can we meet tomorrow at the library?',
    now() - interval '3 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample messages
INSERT INTO messages (id, chat_id, sender_id, content, is_read, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000002',
    'Hi, is this iPhone still available?',
    true,
    now() - interval '2 hours' - interval '10 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    'Yes, it is! Are you interested?',
    true,
    now() - interval '2 hours' - interval '5 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000002',
    'Is this still available?',
    false,
    now() - interval '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample notifications
INSERT INTO notifications (id, user_id, title, body, type, is_read, data, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000001',
    'New Message',
    'You have a new message about "iPhone 13 Pro"',
    'message',
    false,
    '{"chatId": "00000000-0000-0000-0000-000000000201", "productId": "00000000-0000-0000-0000-000000000101"}',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000502',
    '00000000-0000-0000-0000-000000000002',
    'New Message',
    'You have a new message about "Calculus Textbook"',
    'message',
    false,
    '{"chatId": "00000000-0000-0000-0000-000000000202", "productId": "00000000-0000-0000-0000-000000000102"}',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample user preferences
INSERT INTO user_preferences (id, user_id, preferred_categories, notifications_enabled, email_notifications, push_notifications, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000901',
    '00000000-0000-0000-0000-000000000001',
    ARRAY['Electronics', 'Books'],
    true,
    true,
    true,
    now() - interval '30 days'
  ),
  (
    '00000000-0000-0000-0000-000000000902',
    '00000000-0000-0000-0000-000000000002',
    ARRAY['Books', 'Furniture'],
    true,
    true,
    true,
    now() - interval '28 days'
  )
ON CONFLICT (id) DO NOTHING;