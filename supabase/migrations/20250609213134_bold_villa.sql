/*
  # Campus Market Seed Data

  This file contains SQL statements to populate the database with initial data
  for testing and development purposes.

  1. Sample Users
  2. Sample Products
  3. Sample Chats and Messages
  4. Sample Orders
  5. Sample Notifications
*/

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
  ),
  (
    '00000000-0000-0000-0000-000000000106',
    'Computer Science Fundamentals Textbook',
    'Introduction to Computer Science textbook. Covers programming basics, algorithms, data structures, and more. Great for first-year CS students.',
    35.00,
    (SELECT id FROM categories WHERE name = 'Books'),
    'Books',
    'used',
    ARRAY['https://images.pexels.com/photos/256431/pexels-photo-256431.jpeg'],
    '{"author": "Robert Sedgewick", "subject": "Computer Science", "edition": "3rd", "year": "2018"}',
    '00000000-0000-0000-0000-000000000001',
    72,
    9
  ),
  (
    '00000000-0000-0000-0000-000000000107',
    'Wireless Bluetooth Headphones',
    'Sony WH-1000XM4 wireless noise-cancelling headphones. Great sound quality and battery life. Includes carrying case and charging cable.',
    180.00,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    'Electronics',
    'used',
    ARRAY['https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg'],
    '{"brand": "Sony", "model": "WH-1000XM4", "color": "Black", "batteryLife": "30 hours", "noiseCancel": true}',
    '00000000-0000-0000-0000-000000000002',
    110,
    18
  ),
  (
    '00000000-0000-0000-0000-000000000108',
    'Dorm Room Mini Fridge',
    'Compact mini fridge perfect for dorm rooms. 3.2 cubic feet capacity. Energy efficient. Used for one semester only.',
    85.00,
    (SELECT id FROM categories WHERE name = 'Furniture'),
    'Furniture',
    'used',
    ARRAY['https://images.pexels.com/photos/5824883/pexels-photo-5824883.jpeg'],
    '{"brand": "Insignia", "capacity": "3.2 cu ft", "color": "Black", "dimensions": "20 x 18 x 32 inches"}',
    '00000000-0000-0000-0000-000000000003',
    88,
    11
  ),
  (
    '00000000-0000-0000-0000-000000000109',
    'Graphing Calculator - TI-84 Plus',
    'Texas Instruments TI-84 Plus graphing calculator. Essential for calculus and statistics classes. Works perfectly.',
    70.00,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    'Electronics',
    'used',
    ARRAY['https://images.pexels.com/photos/5775/calculator-scientific.jpg'],
    '{"brand": "Texas Instruments", "model": "TI-84 Plus", "batteryType": "AAA", "color": "Black"}',
    '00000000-0000-0000-0000-000000000004',
    65,
    20
  ),
  (
    '00000000-0000-0000-0000-000000000110',
    'Basketball - Spalding NBA Official',
    'Official NBA basketball by Spalding. Used but in good condition. Great for pickup games on campus.',
    25.00,
    (SELECT id FROM categories WHERE name = 'Sports'),
    'Sports',
    'used',
    ARRAY['https://images.pexels.com/photos/945471/pexels-photo-945471.jpeg'],
    '{"brand": "Spalding", "type": "Basketball", "size": "29.5 inches", "material": "Composite leather"}',
    '00000000-0000-0000-0000-000000000005',
    42,
    6
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
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000003',
    'Hello, I\'m interested in your calculus textbook.',
    true,
    now() - interval '1 day' - interval '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000002',
    'Hi there! It\'s still available.',
    true,
    now() - interval '1 day' - interval '1 hour'
  ),
  (
    '00000000-0000-0000-0000-000000000306',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000003',
    'Would you accept $40?',
    false,
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000307',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    'Hi, I\'m interested in your MacBook. Is it still available?',
    true,
    now() - interval '3 hours' - interval '30 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000308',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000003',
    'Yes, it is! When would you like to meet?',
    true,
    now() - interval '3 hours' - interval '20 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000309',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    'Can we meet tomorrow at the library?',
    false,
    now() - interval '3 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample orders
INSERT INTO orders (id, order_number, buyer_id, seller_id, product_id, status, payment_method, total_amount, delivery_method, meetup_location, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000401',
    'CM-20250101-0001',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    'completed',
    'cash',
    650.00,
    'meetup',
    'University Library, Main Entrance',
    now() - interval '15 days'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    'CM-20250115-0002',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000102',
    'completed',
    'cash',
    45.00,
    'meetup',
    'Student Center Cafeteria',
    now() - interval '10 days'
  ),
  (
    '00000000-0000-0000-0000-000000000403',
    'CM-20250120-0003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000103',
    'pending',
    'cash',
    750.00,
    'meetup',
    'Engineering Building, Room 101',
    now() - interval '2 days'
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
  ),
  (
    '00000000-0000-0000-0000-000000000503',
    '00000000-0000-0000-0000-000000000003',
    'New Message',
    'You have a new message about "MacBook Air M1"',
    'message',
    false,
    '{"chatId": "00000000-0000-0000-0000-000000000203", "productId": "00000000-0000-0000-0000-000000000103"}',
    now() - interval '3 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000504',
    '00000000-0000-0000-0000-000000000001',
    'Order Update',
    'Your order has been confirmed',
    'order',
    true,
    '{"orderId": "00000000-0000-0000-0000-000000000403", "productId": "00000000-0000-0000-0000-000000000103"}',
    now() - interval '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000505',
    '00000000-0000-0000-0000-000000000001',
    'Welcome to Campus Market',
    'Thank you for joining Campus Market! Start by listing your first product or browsing what\'s available.',
    'system',
    true,
    '{}',
    now() - interval '30 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample saved products
INSERT INTO saved_products (id, user_id, product_id, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000103',
    now() - interval '5 days'
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000101',
    now() - interval '7 days'
  ),
  (
    '00000000-0000-0000-0000-000000000603',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000102',
    now() - interval '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample product reviews
INSERT INTO product_reviews (id, product_id, reviewer_id, seller_id, rating, title, comment, is_verified_purchase, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000701',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    5,
    'Great iPhone!',
    'The iPhone was in excellent condition as described. Fast shipping and great communication from the seller.',
    true,
    now() - interval '14 days'
  ),
  (
    '00000000-0000-0000-0000-000000000702',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    4,
    'Good textbook',
    'The textbook was in good condition with minimal highlighting. Saved me a lot of money compared to the bookstore!',
    true,
    now() - interval '9 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample user addresses
INSERT INTO user_addresses (id, user_id, name, type, address_line_1, city, is_default, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000801',
    '00000000-0000-0000-0000-000000000001',
    'My Dorm',
    'dorm',
    'Room 203, Block A, Student Residence',
    'Harare',
    true,
    now() - interval '25 days'
  ),
  (
    '00000000-0000-0000-0000-000000000802',
    '00000000-0000-0000-0000-000000000002',
    'Campus Apartment',
    'home',
    'Apartment 15, 123 College Street',
    'Harare',
    true,
    now() - interval '20 days'
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
  ),
  (
    '00000000-0000-0000-0000-000000000903',
    '00000000-0000-0000-0000-000000000003',
    ARRAY['Electronics', 'Sports'],
    true,
    true,
    true,
    now() - interval '25 days'
  ),
  (
    '00000000-0000-0000-0000-000000000904',
    '00000000-0000-0000-0000-000000000004',
    ARRAY['Fashion', 'Beauty'],
    true,
    true,
    true,
    now() - interval '22 days'
  ),
  (
    '00000000-0000-0000-0000-000000000905',
    '00000000-0000-0000-0000-000000000005',
    ARRAY['Sports', 'Food'],
    true,
    true,
    true,
    now() - interval '20 days'
  )
ON CONFLICT (id) DO NOTHING;