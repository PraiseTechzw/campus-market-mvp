import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys for local storage
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  THEME: 'theme',
  RECENT_SEARCHES: 'recent_searches',
  SAVED_PRODUCTS: 'saved_products',
  NOTIFICATIONS: 'notifications',
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

// Storage utility for caching data
export const storage = {
  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },

  async removeItem(key) {
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
  async multiGet(keys) {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      return pairs.map(([key, value]) => [key, value ? JSON.parse(value) : null]);
    } catch (error) {
      console.error('Error getting multiple items from storage:', error);
      return [];
    }
  },

  // Set multiple items at once
  async multiSet(pairs) {
    try {
      const formattedPairs = pairs.map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(formattedPairs);
    } catch (error) {
      console.error('Error setting multiple items in storage:', error);
    }
  },
};