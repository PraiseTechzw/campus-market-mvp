/*
  # Enhanced Campus Market Features

  1. New Features
    - Add specifications field to products table
    - Add view count tracking function
    - Add featured products support
    - Add saved products functionality
    - Add product search optimization

  2. Functions
    - Increment view count function
    - Search optimization functions

  3. Indexes
    - Full-text search indexes
    - Performance optimization indexes
*/

-- Add specifications column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'specifications'
  ) THEN
    ALTER TABLE products ADD COLUMN specifications jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create saved_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS on saved_products
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_products
CREATE POLICY "Users can manage own saved products" ON saved_products 
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_specifications ON products USING gin(specifications);
CREATE INDEX IF NOT EXISTS idx_saved_products_user_id ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_product_id ON saved_products(product_id);

-- Update full-text search index
DROP INDEX IF EXISTS idx_products_search;
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', 
    title || ' ' || 
    description || ' ' || 
    category || ' ' || 
    COALESCE((specifications->>'brand'), '') || ' ' ||
    COALESCE((specifications->>'model'), '')
  )
);

-- Create function for advanced product search
CREATE OR REPLACE FUNCTION search_products(
  search_query text,
  category_filter text DEFAULT NULL,
  min_price decimal DEFAULT NULL,
  max_price decimal DEFAULT NULL,
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
    ts_rank(
      to_tsvector('english', 
        p.title || ' ' || 
        p.description || ' ' || 
        p.category || ' ' || 
        COALESCE((p.specifications->>'brand'), '') || ' ' ||
        COALESCE((p.specifications->>'model'), '')
      ),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM products p
  WHERE 
    p.is_sold = false
    AND (
      search_query IS NULL OR
      to_tsvector('english', 
        p.title || ' ' || 
        p.description || ' ' || 
        p.category || ' ' || 
        COALESCE((p.specifications->>'brand'), '') || ' ' ||
        COALESCE((p.specifications->>'model'), '')
      ) @@ plainto_tsquery('english', search_query)
    )
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
  ORDER BY 
    p.is_featured DESC,
    rank DESC,
    p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products(text, text, decimal, decimal, integer) TO authenticated;