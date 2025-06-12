import { Database } from '@/types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Initialize Supabase client
console.log('🔍 DEBUG: Initializing Supabase client');
console.log('📝 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('📝 Supabase Anon Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseAnonKey?.length
  });
  throw new Error('Missing Supabase URL or Anon Key');
}

// Create the Supabase client with more detailed configuration
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
      storageKey: 'supabase.auth.token',
      debug: false, // Enable debug mode for auth
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'campus-market',
      },
    },
  }
);

// Add a listener for auth state changes to debug session persistence
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔑 DEBUG: Supabase Auth State Change Event:', event);
  console.log('📝 DEBUG: Supabase Auth State Change Session:', session ? 'Active' : 'No Session');
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    // Re-check session status after a known event
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('❌ DEBUG: Error getting session after auth state change:', error);
      } else {
        console.log('✅ DEBUG: Session status (after event):', data.session ? 'Active' : 'No session');
      }
    });
  }
});

// Test the connection and log the configuration
console.log('🔍 DEBUG: Supabase Configuration:', {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  anonKeyPrefix: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...',
});

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ DEBUG: Failed to get initial session:', error);
  } else {
    console.log('✅ DEBUG: Successfully connected to Supabase');
    console.log('📝 Session status:', data.session ? 'Active' : 'No session');
  }
});

console.log('✅ DEBUG: Supabase client initialized successfully');

// Helper functions with proper type checking
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
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<Database['public']['Tables']['users']['Update']>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

export const getSavedProducts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_products')
      .select('*, product:products(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching saved products:', error);
    return [];
  }
};

export const saveProduct = async (userId: string, productId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_products')
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving product:', error);
    return null;
  }
};

export const unsaveProduct = async (userId: string, productId: string) => {
  try {
    const { error } = await supabase
      .from('saved_products')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unsaving product:', error);
    return false;
  }
};

export const getOrders = async (userId: string, role: 'buyer' | 'seller') => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_orders', { user_id: userId, role });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getProductDetails = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_product_details', { product_id: productId });
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
};

export const updateProductStatus = async (productId: string, isSold: boolean) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ is_sold: isSold })
      .eq('id', productId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product status:', error);
    return null;
  }
};

export const searchProducts = async (params: {
  searchQuery?: string
  categoryFilter?: string
  minPrice?: number
  maxPrice?: number
  conditionFilter?: string
  sortBy?: string
  limitCount?: number
}) => {
  try {
    const { data, error } = await supabase
      .rpc('search_products', {
        search_query: params.searchQuery,
        category_filter: params.categoryFilter,
        min_price: params.minPrice,
        max_price: params.maxPrice,
        condition_filter: params.conditionFilter,
        sort_by: params.sortBy,
        limit_count: params.limitCount
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

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
    console.error('Error fetching saved products:', error);
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
    console.error('Error fetching orders:', error);
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

// Helper function to increment product view count
export const incrementViewCount = async (productId: string) => {
  try {
    // Fetch the current view count
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('view_count')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentProduct) throw new Error('Product not found');

    const newViewCount = (currentProduct.view_count || 0) + 1;

    // Update the view count
    const { error: updateError } = await supabase
      .from('products')
      .update({ view_count: newViewCount })
      .eq('id', productId);

    if (updateError) throw updateError;
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
      .rpc('get_category_stats'); // Call the RPC function

    if (error) throw error;
    return data; // This will return an array of { category: string, count: number }
  } catch (error) {
    console.error('Error fetching category stats:', error);
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
    // First get the chat IDs
    const { data: chatIds, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (chatError) throw chatError;

    // Then get the unread count
    const { data, error, count } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('is_read', false)
      .neq('sender_id', userId)
      .in('chat_id', chatIds?.map(chat => chat.id) || []);

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
      .eq('recipient_id', userId); // This should update all notifications for the user

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};