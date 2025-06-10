/*
  # Add Messaging and Notifications System

  1. New Features
    - Real-time messaging system
    - Push notifications support
    - Message read status tracking
    - Notification preferences

  2. Changes
    - Add functions for real-time messaging
    - Add notification triggers
    - Add message status tracking
    - Improve chat functionality
*/

-- Function to update chat last_message when a new message is sent
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
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_chat_on_new_message ON messages;
CREATE TRIGGER update_chat_on_new_message 
  AFTER INSERT ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  chat_record record;
  recipient_id uuid;
  product_title text;
  sender_name text;
BEGIN
  -- Get chat details
  SELECT c.*, p.title, u.name INTO chat_record
  FROM chats c
  JOIN products p ON c.product_id = p.id
  JOIN users u ON u.id = NEW.sender_id
  WHERE c.id = NEW.chat_id;
  
  -- Determine recipient
  IF NEW.sender_id = chat_record.buyer_id THEN
    recipient_id := chat_record.seller_id;
  ELSE
    recipient_id := chat_record.buyer_id;
  END IF;
  
  product_title := chat_record.title;
  sender_name := chat_record.name;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    data,
    created_at
  ) VALUES (
    recipient_id,
    'New Message',
    'New message from ' || sender_name || ' about "' || product_title || '"',
    'message',
    jsonb_build_object(
      'chatId', NEW.chat_id,
      'senderId', NEW.sender_id,
      'productId', chat_record.product_id,
      'message', substring(NEW.content, 1, 50) || CASE WHEN length(NEW.content) > 50 THEN '...' ELSE '' END
    ),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE NOTICE 'Error creating message notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message notifications
DROP TRIGGER IF EXISTS create_message_notification_trigger ON messages;
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Function to create order status notification
CREATE OR REPLACE FUNCTION create_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_title text;
  buyer_id uuid;
  seller_id uuid;
  notification_title text;
  notification_body text;
BEGIN
  -- Only proceed if status has changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get order details
  SELECT p.title, o.buyer_id, o.seller_id INTO product_title, buyer_id, seller_id
  FROM orders o
  JOIN products p ON o.product_id = p.id
  WHERE o.id = NEW.id;
  
  -- Set notification content based on status
  CASE NEW.status
    WHEN 'confirmed' THEN
      notification_title := 'Order Confirmed';
      notification_body := 'Your order for "' || product_title || '" has been confirmed by the seller';
      
      -- Notify buyer
      INSERT INTO notifications (
        user_id, title, body, type, data, created_at
      ) VALUES (
        buyer_id,
        notification_title,
        notification_body,
        'order',
        jsonb_build_object('orderId', NEW.id, 'productId', NEW.product_id, 'status', NEW.status),
        now()
      );
      
    WHEN 'delivered' THEN
      -- Notify seller
      INSERT INTO notifications (
        user_id, title, body, type, data, created_at
      ) VALUES (
        seller_id,
        'Order Delivered',
        'Order for "' || product_title || '" has been marked as delivered',
        'order',
        jsonb_build_object('orderId', NEW.id, 'productId', NEW.product_id, 'status', NEW.status),
        now()
      );
      
    WHEN 'cancelled' THEN
      -- Notify both parties
      INSERT INTO notifications (
        user_id, title, body, type, data, created_at
      ) VALUES (
        buyer_id,
        'Order Cancelled',
        'Your order for "' || product_title || '" has been cancelled',
        'order',
        jsonb_build_object('orderId', NEW.id, 'productId', NEW.product_id, 'status', NEW.status),
        now()
      );
      
      INSERT INTO notifications (
        user_id, title, body, type, data, created_at
      ) VALUES (
        seller_id,
        'Order Cancelled',
        'Order for "' || product_title || '" has been cancelled',
        'order',
        jsonb_build_object('orderId', NEW.id, 'productId', NEW.product_id, 'status', NEW.status),
        now()
      );
  END CASE;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE NOTICE 'Error creating order notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status notifications
DROP TRIGGER IF EXISTS create_order_status_notification_trigger ON orders;
CREATE TRIGGER create_order_status_notification_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_status_notification();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_chat_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET is_read = true
  WHERE chat_id = p_chat_id
    AND sender_id != p_user_id
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  count_result integer;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  WHERE m.is_read = false
    AND m.sender_id != p_user_id
    AND (c.buyer_id = p_user_id OR c.seller_id = p_user_id);
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = p_user_id
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's chats with latest message
CREATE OR REPLACE FUNCTION get_user_chats(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  product_title text,
  product_image text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  other_user_is_verified boolean,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint,
  is_buyer boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.product_id,
    p.title as product_title,
    (p.images)[1] as product_image,
    CASE 
      WHEN c.buyer_id = p_user_id THEN c.seller_id 
      ELSE c.buyer_id 
    END as other_user_id,
    u.name as other_user_name,
    u.avatar_url as other_user_avatar,
    u.is_verified as other_user_is_verified,
    c.last_message,
    c.last_message_at,
    COUNT(m.id) FILTER (WHERE m.is_read = false AND m.sender_id != p_user_id) as unread_count,
    c.buyer_id = p_user_id as is_buyer
  FROM chats c
  JOIN products p ON c.product_id = p.id
  JOIN users u ON (
    CASE 
      WHEN c.buyer_id = p_user_id THEN c.seller_id 
      ELSE c.buyer_id 
    END = u.id
  )
  LEFT JOIN messages m ON c.id = m.chat_id AND m.is_read = false AND m.sender_id != p_user_id
  WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id
  GROUP BY c.id, p.title, p.images, other_user_id, u.name, u.avatar_url, u.is_verified, c.last_message, c.last_message_at, is_buyer
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_chat_last_message() TO authenticated;
GRANT EXECUTE ON FUNCTION create_message_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_status_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chats(uuid) TO authenticated;

-- Add real-time subscriptions for messages
BEGIN;
  -- Drop if exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create publication for real-time
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    messages, 
    chats, 
    notifications, 
    orders;
    
  -- Add tables to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE chats;
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
COMMIT;