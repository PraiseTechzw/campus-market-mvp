import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to upload image to storage
export const uploadImage = async (
  bucket: string,
  path: string,
  file: Blob | File,
  fileOptions?: { contentType?: string }
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, fileOptions);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

// Helper function to delete image from storage
export const deleteImage = async (bucket: string, path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Helper function to get user's saved products
export const getUserSavedProducts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => item.product);
  } catch (error) {
    console.error('Error getting saved products:', error);
    return [];
  }
};

// Helper function to get user's orders
export const getUserOrders = async (userId: string, role: 'buyer' | 'seller') => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:users!buyer_id(*),
        seller:users!seller_id(*),
        product:products(*)
      `)
      .eq(role === 'buyer' ? 'buyer_id' : 'seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user orders:', error);
    return [];
  }
};

// Helper function to get user's chats
export const getUserChats = async (userId: string) => {
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
    return data;
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
};

// Helper function to get product details
export const getProductDetails = async (productId: string) => {
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
    return data;
  } catch (error) {
    console.error('Error getting product details:', error);
    return null;
  }
};

// Helper function to get related products
export const getRelatedProducts = async (productId: string, limit = 6) => {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('category')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users(*)
      `)
      .eq('category', product.category)
      .eq('is_sold', false)
      .neq('id', productId)
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting related products:', error);
    return [];
  }
};

// Helper function to search products
export const searchProducts = async (
  query?: string,
  category?: string,
  minPrice?: number,
  maxPrice?: number,
  condition?: string,
  sortBy = 'relevance',
  limit = 20
) => {
  try {
    let queryBuilder = supabase
      .from('products')
      .select(`
        *,
        seller:users(*)
      `)
      .eq('is_sold', false);

    if (query) {
      queryBuilder = queryBuilder.ilike('title', `%${query}%`);
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    if (condition) {
      queryBuilder = queryBuilder.eq('condition', condition);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        queryBuilder = queryBuilder.order('price', { ascending: true });
        break;
      case 'price_desc':
        queryBuilder = queryBuilder.order('price', { ascending: false });
        break;
      case 'newest':
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
        break;
      case 'popular':
        queryBuilder = queryBuilder.order('view_count', { ascending: false });
        break;
      default:
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    queryBuilder = queryBuilder.limit(limit);

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

// Helper function to increment product view count
export const incrementViewCount = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ view_count: supabase.rpc('increment', { row_id: productId, table_name: 'products', column_name: 'view_count' }) })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return false;
  }
};

// Helper function to check if product is saved
export const isProductSaved = async (productId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_products')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking if product is saved:', error);
    return false;
  }
};

// Helper function to get trending products
export const getTrendingProducts = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users(*)
      `)
      .eq('is_sold', false)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting trending products:', error);
    return [];
  }
};

// Helper function to get new arrivals
export const getNewArrivals = async (daysAgo = 7, limit = 10) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users(*)
      `)
      .eq('is_sold', false)
      .gte('created_at', date.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting new arrivals:', error);
    return [];
  }
};

// Helper function to get flash deals
export const getFlashDeals = async (maxPrice = 100, limit = 8) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users(*)
      `)
      .eq('is_sold', false)
      .lte('price', maxPrice)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting flash deals:', error);
    return [];
  }
};

// Helper function to get category stats
export const getCategoryStats = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category, count(*)')
      .eq('is_sold', false)
      .group('category');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting category stats:', error);
    return [];
  }
};

// Helper function to get user earnings
export const getUserEarnings = async (userId: string) => {
  try {
    const { data: soldProducts, error } = await supabase
      .from('products')
      .select('price, created_at, category')
      .eq('seller_id', userId)
      .eq('is_sold', true);

    if (error) throw error;

    const totalEarnings = soldProducts.reduce((sum, product) => sum + Number(product.price), 0);
    
    // Calculate this month and last month earnings
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthProducts = soldProducts.filter(p => new Date(p.created_at) >= thisMonthStart);
    const lastMonthProducts = soldProducts.filter(p => {
      const date = new Date(p.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const thisMonth = thisMonthProducts.reduce((sum, p) => sum + Number(p.price), 0);
    const lastMonth = lastMonthProducts.reduce((sum, p) => sum + Number(p.price), 0);

    // Calculate top category
    const categoryCount: Record<string, number> = {};
    soldProducts.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    
    const topCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, Object.keys(categoryCount)[0] || '');

    return {
      totalEarnings,
      thisMonth,
      lastMonth,
      totalSales: soldProducts.length,
      averagePrice: soldProducts.length > 0 ? totalEarnings / soldProducts.length : 0,
      topCategory,
    };
  } catch (error) {
    console.error('Error getting user earnings:', error);
    return null;
  }
};

// Helper function to mark messages as read
export const markMessagesRead = async (chatId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
};

// Helper function to get unread message count
export const getUnreadMessageCount = async (userId: string) => {
  try {
    const { data, error, count } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('is_read', false)
      .neq('sender_id', userId)
      .in('chat_id', 
        supabase
          .from('chats')
          .select('id')
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      );

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
};

// Helper function to get unread notification count
export const getUnreadNotificationCount = async (userId: string) => {
  try {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};

// Helper function to mark all notifications as read
export const markAllNotificationsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};