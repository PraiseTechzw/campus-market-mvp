/*
  # Fix IMMUTABLE Function Error in Migration

  1. Issues Fixed
    - Fix "functions in index expression must be marked IMMUTABLE" error
    - Create proper IMMUTABLE functions for text search indexing
    - Update full-text search indexes to use IMMUTABLE functions

  2. Changes
    - Create IMMUTABLE text concatenation function
    - Replace direct concatenation in index expressions with IMMUTABLE function
    - Update search_products function to use the IMMUTABLE function
*/

-- Create an IMMUTABLE function for text concatenation in search indexes
CREATE OR REPLACE FUNCTION immutable_concat_ws(text, VARIADIC text[])
RETURNS text AS $$
BEGIN
  RETURN concat_ws($1, VARIADIC $2);
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

-- Create an IMMUTABLE function for coalescing text values
CREATE OR REPLACE FUNCTION immutable_coalesce(text, text)
RETURNS text AS $$
BEGIN
  RETURN COALESCE($1, $2);
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

-- Drop existing problematic index
DROP INDEX IF EXISTS idx_products_search;

-- Create new index using IMMUTABLE functions
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', 
    immutable_concat_ws(' ', 
      title, 
      description, 
      category, 
      immutable_coalesce(array_to_string(tags, ' '), ''),
      immutable_coalesce((specifications->>'brand')::text, ''),
      immutable_coalesce((specifications->>'model')::text, '')
    )
  )
);

-- Update search_products function to use IMMUTABLE functions
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
          immutable_concat_ws(' ', 
            p.title, 
            p.description, 
            p.category, 
            immutable_coalesce(array_to_string(p.tags, ' '), ''),
            immutable_coalesce((p.specifications->>'brand')::text, ''),
            immutable_coalesce((p.specifications->>'model')::text, '')
          )
        ),
        plainto_tsquery('english', search_query)
      )
    END as rank
  FROM products p
  WHERE 
    p.is_sold = false
    AND (p.availability_status = 'available' OR p.availability_status IS NULL)
    AND (
      search_query IS NULL OR
      to_tsvector('english', 
        immutable_concat_ws(' ', 
          p.title, 
          p.description, 
          p.category, 
          immutable_coalesce(array_to_string(p.tags, ' '), ''),
          immutable_coalesce((p.specifications->>'brand')::text, ''),
          immutable_coalesce((p.specifications->>'model')::text, '')
        )
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

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION immutable_concat_ws(text, VARIADIC text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION immutable_coalesce(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products(text, text, decimal, decimal, text, text, integer) TO authenticated;