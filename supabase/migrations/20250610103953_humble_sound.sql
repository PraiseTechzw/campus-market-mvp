/*
  # Messaging and Notifications System

  1. New Tables
    - `user_push_tokens` - Store user push notification tokens
    - `message_reactions` - Store reactions to messages
    - `chat_participants` - Track chat participants and their status

  2. New Functions
    - `get_unread_messages_by_chat` - Get unread messages for a specific chat
    - `get_chat_participants` - Get participants for a specific chat
    - `add_message_reaction` - Add a reaction to a message
    - `remove_message_reaction` - Remove a reaction from a message
    - `send_push_notification` - Send a push notification to a user

  3. New Triggers
    - `on_new_message_notification` - Create notification when a new message is received
    - `on_new_order_notification` - Create notification when a new order is created
    - `on_order_status_change_notification` - Create notification when an order status changes
*/

-- Create user_push_tokens table
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  device_type text NOT NULL,
  is_active boolean DEFAULT true,
  last_used timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reaction text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  last_read_at timestamptz,
  is_muted boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Add unread_count column to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT true;

-- Create function to get unread messages by chat
CREATE OR REPLACE FUNCTION get_unread_messages_by_chat(p_chat_id uuid, p_user_id uuid)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  sender_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.created_at,
    u.name as sender_name
  FROM messages m
  JOIN users u ON m.sender_id = u.id
  WHERE 
    m.chat_id = p_chat_id
    AND m.sender_id != p_user_id
    AND m.is_read = false
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get chat participants
CREATE OR REPLACE FUNCTION get_chat_participants(p_chat_id uuid)
RETURNS TABLE (
  user_id uuid,
  name text,
  avatar_url text,
  is_verified boolean,
  last_read_at timestamptz,
  is_muted boolean,
  is_archived boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.name,
    u.avatar_url,
    u.is_verified,
    cp.last_read_at,
    cp.is_muted,
    cp.is_archived
  FROM chat_participants cp
  JOIN users u ON cp.user_id = u.id
  WHERE cp.chat_id = p_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add message reaction
CREATE OR REPLACE FUNCTION add_message_reaction(p_message_id uuid, p_user_id uuid, p_reaction text)
RETURNS uuid AS $$
DECLARE
  reaction_id uuid;
BEGIN
  INSERT INTO message_reactions (message_id, user_id, reaction)
  VALUES (p_message_id, p_user_id, p_reaction)
  ON CONFLICT (message_id, user_id, reaction) DO NOTHING
  RETURNING id INTO reaction_id;
  
  RETURN reaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove message reaction
CREATE OR REPLACE FUNCTION remove_message_reaction(p_message_id uuid, p_user_id uuid, p_reaction text)
RETURNS boolean AS $$
DECLARE
  rows_deleted integer;
BEGIN
  DELETE FROM message_reactions
  WHERE message_id = p_message_id
    AND user_id = p_user_id
    AND reaction = p_reaction
  RETURNING 1 INTO rows_deleted;
  
  RETURN rows_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send push notification
CREATE OR REPLACE FUNCTION send_push_notification(p_user_id uuid, p_title text, p_body text, p_data jsonb)
RETURNS boolean AS $$
BEGIN
  -- In a real implementation, this would call an external service like Expo Push API
  -- For now, we'll just log the notification
  RAISE NOTICE 'Sending push notification to %: %', p_user_id, p_title;
  
  -- Return true to indicate success
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update unread count in chats
CREATE OR REPLACE FUNCTION update_chat_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update unread count and is_read flag in the chat
  UPDATE chats
  SET 
    unread_count = (
      SELECT COUNT(*)
      FROM messages
      WHERE chat_id = NEW.chat_id
        AND sender_id != NEW.sender_id
        AND is_read = false
    ),
    is_read = NEW.sender_id = chats.buyer_id, -- Mark as unread if sender is not the buyer
    updated_at = now()
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating unread count
CREATE TRIGGER update_chat_unread_count_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_unread_count();

-- Create function to create message notification
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
  JOIN users u ON NEW.sender_id = u.id
  WHERE c.id = NEW.chat_id;
  
  -- Determine recipient
  IF NEW.sender_id = chat_record.buyer_id THEN
    recipient_id := chat_record.seller_id;
  ELSE
    recipient_id := chat_record.buyer_id;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    data,
    is_read
  ) VALUES (
    recipient_id,
    'New Message',
    chat_record.name || ': ' || NEW.content,
    'message',
    jsonb_build_object(
      'chatId', NEW.chat_id,
      'senderId', NEW.sender_id,
      'productId', chat_record.product_id
    ),
    false
  );
  
  -- Send push notification
  PERFORM send_push_notification(
    recipient_id,
    'New Message',
    chat_record.name || ': ' || NEW.content,
    jsonb_build_object(
      'type', 'message',
      'chatId', NEW.chat_id,
      'senderId', NEW.sender_id,
      'productId', chat_record.product_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message notifications
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Create function to create order notification
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_title text;
  buyer_name text;
  seller_name text;
BEGIN
  -- Get product and user details
  SELECT p.title, b.name, s.name INTO product_title, buyer_name, seller_name
  FROM products p
  JOIN users b ON NEW.buyer_id = b.id
  JOIN users s ON NEW.seller_id = s.id
  WHERE p.id = NEW.product_id;
  
  -- Create notification for seller
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    data,
    is_read
  ) VALUES (
    NEW.seller_id,
    'New Order',
    buyer_name || ' placed an order for "' || product_title || '"',
    'order',
    jsonb_build_object(
      'orderId', NEW.id,
      'productId', NEW.product_id,
      'buyerId', NEW.buyer_id
    ),
    false
  );
  
  -- Create notification for buyer
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    data,
    is_read
  ) VALUES (
    NEW.buyer_id,
    'Order Placed',
    'Your order for "' || product_title || '" has been placed',
    'order',
    jsonb_build_object(
      'orderId', NEW.id,
      'productId', NEW.product_id,
      'sellerId', NEW.seller_id
    ),
    false
  );
  
  -- Send push notifications
  PERFORM send_push_notification(
    NEW.seller_id,
    'New Order',
    buyer_name || ' placed an order for "' || product_title || '"',
    jsonb_build_object(
      'type', 'order',
      'orderId', NEW.id,
      'productId', NEW.product_id,
      'buyerId', NEW.buyer_id
    )
  );
  
  PERFORM send_push_notification(
    NEW.buyer_id,
    'Order Placed',
    'Your order for "' || product_title || '" has been placed',
    jsonb_build_object(
      'type', 'order',
      'orderId', NEW.id,
      'productId', NEW.product_id,
      'sellerId', NEW.seller_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order notifications
CREATE TRIGGER create_order_notification_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_notification();

-- Create function to create order status change notification
CREATE OR REPLACE FUNCTION create_order_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_title text;
  recipient_id uuid;
  notification_title text;
  notification_body text;
BEGIN
  -- Only proceed if status has changed
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  
  -- Get product title
  SELECT title INTO product_title
  FROM products
  WHERE id = NEW.product_id;
  
  -- Determine recipient and notification content based on status change
  CASE NEW.status
    WHEN 'confirmed' THEN
      recipient_id := NEW.buyer_id;
      notification_title := 'Order Confirmed';
      notification_body := 'Your order for "' || product_title || '" has been confirmed by the seller';
    WHEN 'delivered' THEN
      recipient_id := NEW.seller_id;
      notification_title := 'Order Delivered';
      notification_body := 'The buyer has marked the order for "' || product_title || '" as delivered';
    WHEN 'cancelled' THEN
      IF NEW.buyer_id = OLD.buyer_id THEN
        -- Buyer cancelled
        recipient_id := NEW.seller_id;
        notification_title := 'Order Cancelled';
        notification_body := 'The buyer has cancelled the order for "' || product_title || '"';
      ELSE
        -- Seller cancelled
        recipient_id := NEW.buyer_id;
        notification_title := 'Order Cancelled';
        notification_body := 'The seller has cancelled the order for "' || product_title || '"';
      END IF;
    ELSE
      -- No notification for other status changes
      RETURN NEW;
  END CASE;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    data,
    is_read
  ) VALUES (
    recipient_id,
    notification_title,
    notification_body,
    'order',
    jsonb_build_object(
      'orderId', NEW.id,
      'productId', NEW.product_id,
      'status', NEW.status
    ),
    false
  );
  
  -- Send push notification
  PERFORM send_push_notification(
    recipient_id,
    notification_title,
    notification_body,
    jsonb_build_object(
      'type', 'order',
      'orderId', NEW.id,
      'productId', NEW.product_id,
      'status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status change notifications
CREATE TRIGGER create_order_status_change_notification_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_status_change_notification();

-- Create function to create product notification
CREATE OR REPLACE FUNCTION create_product_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_name text;
  user_record record;
BEGIN
  -- Get seller name
  SELECT name INTO seller_name
  FROM users
  WHERE id = NEW.seller_id;
  
  -- Create notifications for users with matching preferred categories
  FOR user_record IN
    SELECT u.id
    FROM users u
    JOIN user_preferences up ON u.id = up.user_id
    WHERE 
      u.id != NEW.seller_id
      AND up.notifications_enabled = true
      AND (
        up.preferred_categories IS NULL
        OR up.preferred_categories = '{}'
        OR NEW.category = ANY(up.preferred_categories)
      )
    LIMIT 100
  LOOP
    -- Create notification
    INSERT INTO notifications (
      user_id,
      title,
      body,
      type,
      data,
      is_read
    ) VALUES (
      user_record.id,
      'New Product',
      seller_name || ' listed "' || NEW.title || '" for $' || NEW.price,
      'product',
      jsonb_build_object(
        'productId', NEW.id,
        'sellerId', NEW.seller_id,
        'category', NEW.category
      ),
      false
    );
    
    -- Send push notification
    PERFORM send_push_notification(
      user_record.id,
      'New Product',
      seller_name || ' listed "' || NEW.title || '" for $' || NEW.price,
      jsonb_build_object(
        'type', 'product',
        'productId', NEW.id,
        'sellerId', NEW.seller_id,
        'category', NEW.category
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product notifications
CREATE TRIGGER create_product_notification_trigger
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_product_notification();

-- Create function to update chat participants
CREATE OR REPLACE FUNCTION update_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert buyer as participant if not exists
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES (NEW.id, NEW.buyer_id)
  ON CONFLICT (chat_id, user_id) DO NOTHING;
  
  -- Insert seller as participant if not exists
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES (NEW.id, NEW.seller_id)
  ON CONFLICT (chat_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating chat participants
CREATE TRIGGER update_chat_participants_trigger
  AFTER INSERT ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_participants();

-- Create function to update last read timestamp
CREATE OR REPLACE FUNCTION update_last_read_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_read_at for the user in chat_participants
  UPDATE chat_participants
  SET 
    last_read_at = now(),
    updated_at = now()
  WHERE 
    chat_id = NEW.chat_id
    AND user_id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating last read timestamp
CREATE TRIGGER update_last_read_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_read_timestamp();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_token ON user_push_tokens(token);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_last_read_at ON chat_participants(last_read_at);

-- Enable Row Level Security
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for user_push_tokens
CREATE POLICY "Users can manage their own push tokens" ON user_push_tokens
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for message_reactions
CREATE POLICY "Users can read all message reactions" ON message_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own message reactions" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for chat_participants
CREATE POLICY "Users can read their own chat participants" ON chat_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat participants" ON chat_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure auth schema access for the function
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;