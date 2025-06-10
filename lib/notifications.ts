import { CACHE_KEYS, storage } from '@/lib/storage';
import { Notification } from '@/types';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notifications for handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  // Get notifications for a user
  static async getNotifications(userId: string): Promise<{ data?: Notification[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Update last check time
      await storage.setItem(CACHE_KEYS.LAST_NOTIFICATION_CHECK, new Date().toISOString());
      
      return { data };
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return { error: error.message };
    }
  }

  // Mark a notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        user_id: userId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<{ count: number; error?: string }> {
    try {
      // Try to get from cache first
      const cachedCount = await storage.getItem(CACHE_KEYS.UNREAD_NOTIFICATION_COUNT);
      
      // Fetch from server
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        user_id: userId
      });

      if (error) throw error;
      
      // Update cache
      await storage.setItem(CACHE_KEYS.UNREAD_NOTIFICATION_COUNT, data || 0);
      
      return { count: data || 0 };
    } catch (error: any) {
      console.error('Error getting unread notification count:', error);
      // Return cached count if available, otherwise 0
      const cachedCount = await storage.getItem(CACHE_KEYS.UNREAD_NOTIFICATION_COUNT);
      return { count: cachedCount || 0, error: error.message };
    }
  }

  // Subscribe to new notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
          
          // Update unread count in cache
          NotificationService.getUnreadCount(userId);
        }
      )
      .subscribe();
  }

  // Register for push notifications
  static async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      return null;
    }
    
    if (!Device.isDevice) {
      console.log('Push notifications are not available in the simulator');
      return null;
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get push token
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Save token to local storage
      await storage.setItem(CACHE_KEYS.PUSH_TOKEN, token);
      
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Save push token to database
  static async savePushToken(userId: string, token: string): Promise<boolean> {
    try {
      // First check if token exists for this user
      const { data: existingToken } = await supabase
        .from('user_push_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('token', token)
        .single();

      if (existingToken) {
        // Update existing token
        const { error } = await supabase
          .from('user_push_tokens')
          .update({
            is_active: true,
            last_used: new Date().toISOString()
          })
          .eq('id', existingToken.id);

        if (error) throw error;
      } else {
        // Insert new token
        const { error } = await supabase
          .from('user_push_tokens')
          .insert({
            user_id: userId,
            token,
            device_type: Platform.OS,
            is_active: true,
            last_used: new Date().toISOString()
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  }

  // Send local notification
  static async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('Local notifications not supported on web');
      return;
    }
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: null, // Immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Add notification received listener
  static addNotificationListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  // Add notification response listener
  static addNotificationResponseListener(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }
}