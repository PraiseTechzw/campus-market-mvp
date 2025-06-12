import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MessagingService } from '@/lib/messaging';
import { NotificationService } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0
  });
  const messageSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const notificationSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  const fetchUnreadCounts = async () => {
    if (!user) return;
    
    try {
      const [messageCount, notificationCount] = await Promise.all([
        MessagingService.getUnreadMessageCount(user.id),
        NotificationService.getUnreadCount(user.id)
      ]);
      
      setUnreadCounts({
        messages: messageCount.count || 0,
        notifications: notificationCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user?.id || ''}`,
      }, () => {
        fetchUnreadCounts();
      })
      .subscribe();

    return channel;
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id || ''}`,
      }, () => {
        fetchUnreadCounts();
      })
      .subscribe();

    return channel;
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
      
      // Only subscribe if we don't have active subscriptions
      if (!messageSubscriptionRef.current) {
        messageSubscriptionRef.current = subscribeToMessages();
      }
      if (!notificationSubscriptionRef.current) {
        notificationSubscriptionRef.current = subscribeToNotifications();
      }

      return () => {
        if (messageSubscriptionRef.current) {
          messageSubscriptionRef.current.unsubscribe();
          messageSubscriptionRef.current = null;
        }
        if (notificationSubscriptionRef.current) {
          notificationSubscriptionRef.current.unsubscribe();
          notificationSubscriptionRef.current = null;
        }
      };
    }
  }, [user]);

  const renderTabBarIcon = (name: keyof typeof Ionicons.glyphMap, focused: boolean, badgeCount?: number) => (
    <MotiView
      animate={{
        scale: focused ? 1.05 : 1,
        translateY: focused ? -2 : 0,
      }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 150,
      }}
      style={styles.iconContainer}
    >
      <MotiView
        animate={{
          backgroundColor: focused 
            ? Platform.OS === 'ios' 
              ? colors.primary + '20' 
              : colors.primary + '15'
            : 'transparent',
        }}
        transition={{
          type: 'timing',
          duration: 200,
        }}
        style={[
          styles.iconBackground,
          Platform.OS === 'android' && focused && {
            elevation: 2,
            shadowColor: colors.primary,
          }
        ]}
      >
        <Ionicons 
          name={name} 
          size={Platform.OS === 'ios' ? 24 : 26} 
          color={focused ? colors.primary : colors.textTertiary} 
        />
      </MotiView>
      
      {badgeCount && badgeCount > 0 && (
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: 'spring',
            damping: 12,
            stiffness: 200,
          }}
          style={[
            styles.badge, 
            { 
              backgroundColor: colors.error,
              ...Platform.select({
                android: {
                  elevation: 4,
                  shadowColor: colors.error,
                },
                ios: {
                  shadowColor: colors.error,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                }
              })
            }
          ]}
        >
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount.toString()}
          </Text>
        </MotiView>
      )}
    </MotiView>
  );

  const TabBarBackground = () => {
    if (Platform.OS === 'ios') {
      return (
        <BlurView
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          intensity={85}
          style={StyleSheet.absoluteFill}
        />
      );
    }
    
    return (
      <LinearGradient
        colors={[
          colors.surface + 'F5',
          colors.surface + 'FF',
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    );
  };

  const tabBarHeight = Platform.OS === 'ios' ? 60 : 75;
  
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 80 + insets.bottom : 60,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" size={size} color={color} />
          ),
          tabBarBadge: unreadCounts.messages > 0 ? unreadCounts.messages : undefined,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
          tabBarBadge: unreadCounts.notifications > 0 ? unreadCounts.notifications : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: Platform.OS === 'ios' ? 40 : 44,
    height: Platform.OS === 'ios' ? 40 : 44,
  },
  iconBackground: {
    width: Platform.OS === 'ios' ? 36 : 40,
    height: Platform.OS === 'ios' ? 36 : 40,
    borderRadius: Platform.OS === 'ios' ? 18 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -2 : -4,
    right: Platform.OS === 'ios' ? -2 : -4,
    minWidth: Platform.OS === 'ios' ? 18 : 20,
    height: Platform.OS === 'ios' ? 18 : 20,
    borderRadius: Platform.OS === 'ios' ? 9 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: Platform.OS === 'ios' ? 1.5 : 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'ios' ? 10 : 11,
    fontWeight: Platform.OS === 'ios' ? '700' : '600',
    lineHeight: Platform.OS === 'ios' ? 12 : 14,
  },
});