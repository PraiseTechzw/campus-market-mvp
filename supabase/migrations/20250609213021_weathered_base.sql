/*
  # Campus Market Helper Functions

  1. User Management Functions
    - User profile management
    - Verification status updates
    - User statistics tracking

  2. Product Management Functions
    - Product search and filtering
    - View count tracking
    - Product status management

  3. Chat and Messaging Functions
    - Message handling
    - Chat status updates
    - Notification creation

  4. Order Management Functions
    - Order processing
    - Status updates
    - Payment handling
*/

-- Function to get user profile with stats
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  university text,
  avatar_url text,
  is_verified boolean,
  rating decimal,
  total_reviews integer,
  total_sales integer,
  total_earnings decimal,
  active_listings integer,
  sold_listings integer,
  joined_days integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.university,
    u.avatar_url,
    u.is_verified,
    u.rating,
    u.total_reviews,
    u.total_sales,
    u.total_earnings,
    (SELECT COUNT(*) FROM products WHERE seller_id = u.id AND is_sold = false)::integer as active_listings,
    (SELECT COUNT(*) FROM products WHERE seller_id = u.id AND is_sold = true)::integer as sold_listings,
    EXTRACT(DAY FROM (now() - u.created_at))::integer as joined_days
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_saved_products(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_orders(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_related_products(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_reviews(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_seller_products(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_earnings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_product_saved(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_products(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_new_arrivals(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_flash_deals(decimal, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products(text, text, decimal, decimal, text, text, integer) TO authenticated;