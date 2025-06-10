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
      .rpc('get_user_profile', { user_id: userId });

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
      .rpc('get_user_saved_products', { user_id: userId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting saved products:', error);
    return [];
  }
};

// Helper function to get user's orders
export const getUserOrders = async (userId: string, role: 'buyer' | 'seller') => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_orders', { user_id: userId, role });

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
      .rpc('get_user_chats', { user_id: userId });

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
      .rpc('get_product_details', { product_id: productId });

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
    const { data, error } = await supabase
      .rpc('get_related_products', { product_id: productId, limit_count: limit });

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
    const { data, error } = await supabase
      .rpc('search_products', {
        search_query: query || null,
        category_filter: category || null,
        min_price: minPrice || null,
        max_price: maxPrice || null,
        condition_filter: condition || null,
        sort_by: sortBy,
        limit_count: limit
      });

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
    const { error } = await supabase
      .rpc('increment_view_count', { product_id: productId });

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
      .rpc('is_product_saved', { p_product_id: productId, p_user_id: userId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking if product is saved:', error);
    return false;
  }
};

// Helper function to get trending products
export const getTrendingProducts = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .rpc('get_trending_products', { limit_count: limit });

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
    const { data, error } = await supabase
      .rpc('get_new_arrivals', { days_ago: daysAgo, limit_count: limit });

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
      .rpc('get_flash_deals', { max_price: maxPrice, limit_count: limit });

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
      .rpc('get_category_stats');

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
    const { data, error } = await supabase
      .rpc('get_user_earnings', { user_id: userId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user earnings:', error);
    return null;
  }
};

// Helper function to mark messages as read
export const markMessagesRead = async (chatId: string, userId: string) => {
  try {
    const { error } = await supabase
      .rpc('mark_messages_read', { p_chat_id: chatId, p_user_id: userId });

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
    const { data, error } = await supabase
      .rpc('get_unread_message_count', { user_id: userId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
};

// Helper function to get unread notification count
export const getUnreadNotificationCount = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', { user_id: userId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};

// Helper function to mark all notifications as read
export const markAllNotificationsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .rpc('mark_all_notifications_read', { user_id: userId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};