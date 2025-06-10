import { supabase } from './supabase';
import { User, Product, Chat, Message, Order, Review, Address } from '@/types';

export class DatabaseService {
  // User operations
  static async getUserProfile(userId: string): Promise<{ data?: User; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Product operations
  static async getProducts(filters?: {
    category?: string;
    search?: string;
    sellerId?: string;
    limit?: number;
  }): Promise<{ data?: Product[]; error?: string }> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query =  query.eq('category', filters.category);
      }

      if (filters?.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }

      if (filters?.search) {
        query = query.textSearch('title', filters.search, {
          type: 'websearch',
          config: 'english'
        });
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async getProductById(productId: string): Promise<{ data?: Product; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async createProduct(product: Omit<Product, 'id' | 'seller' | 'created_at' | 'updated_at' | 'view_count'>): Promise<{ data?: Product; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async updateProduct(productId: string, updates: Partial<Product>): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async deleteProduct(productId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async incrementViewCount(productId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.rpc('increment_view_count', { product_id: productId });
      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Chat operations
  static async getChats(userId: string): Promise<{ data?: Chat[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          buyer:users!buyer_id(*),
          seller:users!seller_id(*),
          product:products(*)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async getChatById(chatId: string): Promise<{ data?: Chat; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          buyer:users!buyer_id(*),
          seller:users!seller_id(*),
          product:products(*)
        `)
        .eq('id', chatId)
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async createChat(chat: { buyer_id: string; seller_id: string; product_id: string }): Promise<{ data?: Chat; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert(chat)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Message operations
  static async getMessages(chatId: string): Promise<{ data?: Message[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async sendMessage(message: { chat_id: string; sender_id: string; content: string; message_type?: 'text' | 'image' }): Promise<{ data?: Message; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...message,
          message_type: message.message_type || 'text'
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Order operations
  static async getOrders(userId: string, type: 'buying' | 'selling'): Promise<{ data?: Order[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!buyer_id(*),
          seller:users!seller_id(*),
          product:products(*)
        `)
        .eq(type === 'buying' ? 'buyer_id' : 'seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async createOrder(order: Omit<Order, 'id' | 'buyer' | 'seller' | 'product' | 'created_at' | 'updated_at'>): Promise<{ data?: Order; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Review operations
  static async getReviews(userId: string): Promise<{ data?: Review[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviewer_id(*),
          product:products(*)
        `)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async createReview(review: Omit<Review, 'id' | 'reviewer' | 'created_at' | 'updated_at'>): Promise<{ data?: Review; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Address operations
  static async getAddresses(userId: string): Promise<{ data?: Address[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async createAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: Address; error?: string }> {
    try {
      // If this is the default address, unset any existing default
      if (address.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', address.user_id)
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert(address)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async updateAddress(addressId: string, updates: Partial<Address>): Promise<{ error?: string }> {
    try {
      // If setting as default, unset any existing default
      if (updates.is_default) {
        const { data } = await supabase
          .from('addresses')
          .select('user_id')
          .eq('id', addressId)
          .single();

        if (data) {
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', data.user_id)
            .eq('is_default', true);
        }
      }

      const { error } = await supabase
        .from('addresses')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', addressId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async deleteAddress(addressId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Saved products operations
  static async getSavedProducts(userId: string): Promise<{ data?: Product[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('saved_products')
        .select(`
          *,
          product:products(
            *,
            seller:users(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data?.map(item => item.product) };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async saveProduct(userId: string, productId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('saved_products')
        .insert({
          user_id: userId,
          product_id: productId
        });

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async unsaveProduct(userId: string, productId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('saved_products')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async isProductSaved(userId: string, productId: string): Promise<{ isSaved: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('saved_products')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { isSaved: !!data };
    } catch (error: any) {
      return { isSaved: false, error: error.message };
    }
  }
}