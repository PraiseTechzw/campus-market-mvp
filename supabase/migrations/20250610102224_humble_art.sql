/*
  # Campus Market Database Schema - Fixed Migration

  This migration fixes the IMMUTABLE function issues in the previous migrations
  and provides a complete schema for the Campus Market application.
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

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
  rating decimal(3,2) DEFAULT 0.0,
  total_reviews integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_earnings decimal(10,2) DEFAULT 0.0,
  last_active timestamptz DEFAULT now(),
  is_online boolean DEFAULT false,
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
  category text NOT NULL,
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

-- Create user_addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'other' CHECK (type IN ('dorm', 'home', 'work', 'other')),
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

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

-- User addresses policies
CREATE POLICY "Users can manage own addresses" ON user_addresses FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_sold ON products(is_sold);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability_status);

CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_products_user_id ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_product_id ON saved_products(product_id);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_seller_id ON product_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_reviewer_id ON product_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(is_default);

-- Create full-text search index for products using immutable functions
CREATE OR REPLACE FUNCTION products_search_vector(title text, description text, category text, tags text[], specs jsonb)
RETURNS tsvector
LANGUAGE sql IMMUTABLE AS $$
  SELECT to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(category, '') || ' ' || 
    coalesce(array_to_string(tags, ' '), '') || ' ' ||
    coalesce((specs->>'brand')::text, '') || ' ' ||
    coalesce((specs->>'model')::text, '')
  );
$$;

-- Create the index using the immutable function
CREATE INDEX IF NOT EXISTS idx_products_search ON products 
  USING gin(products_search_vector(title, description, category, tags, specifications));

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

-- Function to increment save count
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

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'CM-' || to_char(now(), 'YYYYMMDD') || '-' || 
                      lpad(nextval('order_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Create function for advanced product search
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
        products_search_vector(p.title, p.description, p.category, p.tags, p.specifications),
        plainto_tsquery('english', search_query)
      )
    END as rank
  FROM products p
  WHERE 
    p.is_sold = false
    AND p.availability_status = 'available'
    AND (
      search_query IS NULL OR
      products_search_vector(p.title, p.description, p.category, p.tags, p.specifications) @@ 
      plainto_tsquery('english', search_query)
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

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'User profile pictures', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('products', 'Product images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('verification', 'Student ID verification images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Public can view avatars" ON storage.objects
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
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Users can upload their product images" ON storage.objects
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

-- Storage policies for verification bucket
CREATE POLICY "Users can view their own verification images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their verification images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure auth schema access for the function
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;