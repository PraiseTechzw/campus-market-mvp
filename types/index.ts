export interface User {
  id: string;
  email: string;
  name: string;
  university?: string;
  avatar_url?: string;
  is_verified: boolean;
  phone?: string;
  location?: string;
  rating: number;
  rating_count: number;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'used';
  images: string[];
  specifications?: Record<string, any>;
  seller_id: string;
  seller: User;
  is_sold: boolean;
  is_featured: boolean;
  view_count: number;
  location?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  buyer: User;
  seller: User;
  product: Product;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image';
  is_read: boolean;
  created_at: string;
  sender: User;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'campus_meetup';
  total_amount: number;
  delivery_address?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
  buyer: User;
  seller: User;
  product: Product;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'message' | 'order' | 'product' | 'system';
  is_read: boolean;
  data?: any;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  product_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  reviewer: User;
  product?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postal_code?: string;
  type: 'home' | 'dorm' | 'other';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES = [
  'Electronics',
  'Books',
  'Fashion',
  'Services',
  'Furniture',
  'Sports',
  'Beauty',
  'Food',
  'Other'
] as const;

export type Category = typeof CATEGORIES[number];

export const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay when you receive the item' },
  { id: 'campus_meetup', name: 'Campus Meetup', description: 'Meet on campus for exchange' },
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number]['id'];