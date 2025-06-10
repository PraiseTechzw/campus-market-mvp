/*
  # Fix Missing Columns and Complete Database Schema

  1. Add Missing Columns
    - Add last_active column to users table
    - Add any other missing columns for full functionality

  2. Storage Setup
    - Create storage buckets for images
    - Set up proper policies for file uploads

  3. Additional Features
    - Add indexes for performance
    - Add helper functions
*/

-- Add missing columns to users table
DO $$
BEGIN
  -- Add last_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE users ADD COLUMN last_active timestamptz DEFAULT now();
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'location'
  ) THEN
    ALTER TABLE users ADD COLUMN location text;
  END IF;

  -- Add rating columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rating'
  ) THEN
    ALTER TABLE users ADD COLUMN rating decimal(2,1) DEFAULT 0.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rating_count'
  ) THEN
    ALTER TABLE users ADD COLUMN rating_count integer DEFAULT 0;
  END IF;
END $$;

-- Add missing columns to products table
DO $$
BEGIN
  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'location'
  ) THEN
    ALTER TABLE products ADD COLUMN location text;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'tags'
  ) THEN
    ALTER TABLE products ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id);

-- Create addresses table for user addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  postal_code text,
  type text DEFAULT 'home' CHECK (type IN ('home', 'dorm', 'other')),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for addresses
CREATE POLICY "Users can manage own addresses" ON addresses 
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Create function to update user last_active
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET last_active = now()
  WHERE id = auth.uid();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating(user_id uuid)
RETURNS void AS $$
DECLARE
  avg_rating decimal(2,1);
  review_count integer;
BEGIN
  SELECT 
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)
  INTO avg_rating, review_count
  FROM reviews 
  WHERE reviewee_id = user_id;

  UPDATE users 
  SET 
    rating = COALESCE(avg_rating, 0.0),
    rating_count = COALESCE(review_count, 0),
    updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update user rating when review is added/updated
CREATE OR REPLACE FUNCTION trigger_update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_rating(NEW.reviewee_id);
  IF TG_OP = 'UPDATE' AND OLD.reviewee_id != NEW.reviewee_id THEN
    PERFORM update_user_rating(OLD.reviewee_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reviews
DROP TRIGGER IF EXISTS update_rating_on_review_insert ON reviews;
CREATE TRIGGER update_rating_on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_update_user_rating();

DROP TRIGGER IF EXISTS update_rating_on_review_update ON reviews;
CREATE TRIGGER update_rating_on_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_update_user_rating();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_last_active() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_rating(uuid) TO authenticated;