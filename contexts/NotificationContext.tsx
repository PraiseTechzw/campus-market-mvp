import { NotificationService } from '@/lib/notifications';
import { Notification } from '@/types';
import { useRouter } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      const unsubscribe = subscribeToRealTimeNotifications();
      setupPushNotifications();
      
      return () => {
        unsubscribe();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]);

  // Setup push notifications
  const setupPushNotifications = async () => {
    if (Platform.OS === 'web') return;
    
    try {
      // Register for push notifications
      const token = await NotificationService.registerForPushNotifications();
      
      if (token && user) {
        // Save token to database
        await NotificationService.savePushToken(user.id, token);
      }
      
      // Add notification listeners
      const foregroundSubscription = NotificationService.addNotificationListener((notification) => {
        // Handle notification received when app is in foreground
        console.log('Notification received in foreground:', notification);
        // Refresh notifications
        fetchNotifications();
        fetchUnreadCount();
      });
      
      const responseSubscription = NotificationService.addNotificationResponseListener((response) => {
        // Handle notification response when user taps on notification
        console.log('Notification response:', response);
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data.type === 'message' && data.chatId) {
          router.push(`/chat/${data.chatId}`);
        } else if (data.type === 'order' && data.orderId) {
          router.push(`/order/${data.orderId}`);
        } else if (data.type === 'product' && data.productId) {
          router.push(`/product/${data.productId}`);
        } else {
          router.push('/notifications');
        }
      });
      
      return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      };
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  // Subscribe to real-time notifications
  const subscribeToRealTimeNotifications = () => {
    if (!user) return () => {};
    
    const channel = NotificationService.subscribeToNotifications(user.id, (notification) => {
      // Add the new notification to the list
      setNotifications(prev => [notification, ...prev]);
      // Increment unread count
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      channel.unsubscribe();
    };
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await NotificationService.getNotifications(user.id);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await NotificationService.getUnreadCount(user.id);
      if (error) throw error;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const success = await NotificationService.markAllAsRead(user.id);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    await fetchNotifications();
    await fetchUnreadCount();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAllAsRead,
      markAsRead,
      refreshNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}