import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys for local storage
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  THEME: 'theme',
  RECENT_SEARCHES: 'recent_searches',
  SAVED_PRODUCTS: 'saved_products',
  NOTIFICATIONS: 'notifications',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PUSH_TOKEN: 'push_token',
  LAST_NOTIFICATION_CHECK: 'last_notification_check',
  UNREAD_MESSAGE_COUNT: 'unread_message_count',
  UNREAD_NOTIFICATION_COUNT: 'unread_notification_count',
};

// Storage utility for caching data
export const storage = {
  async getItem(key: string) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },

  async setItem(key: string, value: any) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },

  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  // Get multiple items at once
  async multiGet(keys: string[]) {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      return pairs.map(([key, value]) => [key, value ? JSON.parse(value) : null]);
    } catch (error) {
      console.error('Error getting multiple items from storage:', error);
      return [];
    }
  },

  // Set multiple items at once
  async multiSet(pairs: [string, any][]) {
    try {
      const formattedPairs = pairs.map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(formattedPairs as [string, string][]);
    } catch (error) {
      console.error('Error setting multiple items in storage:', error);
    }
  },
};