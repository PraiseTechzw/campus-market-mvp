import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
      const unsubscribeMessages = subscribeToMessages();
      const unsubscribeNotifications = subscribeToNotifications();
      
      return () => {
        unsubscribeMessages();
        unsubscribeNotifications();
      };
    }
  }, [user]);

  const fetchUnreadCounts = async () => {
    try {
      const { data: messageCount, error: messageError } = await supabase.rpc(
        'get_unread_message_count',
        { user_id: user?.id || '' }
      );
      
      if (!messageError) {
        setUnreadMessages(messageCount || 0);
      }

      const { data: notificationCount, error: notificationError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id || '')
        .eq('is_read', false);
      
      if (!notificationError) {
        setUnreadNotifications(notificationCount?.length || 0);
      }
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

    return () => {
      supabase.removeChannel(channel);
    };
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

    return () => {
      supabase.removeChannel(channel);
    };
  };

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
         
        headerShown: false,
        tabBarStyle: {

          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface + 'F8',
          borderTopColor: Platform.OS === 'ios' ? colors.border + '40' : colors.border,
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
          height: tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          paddingHorizontal: 8,
          position: 'absolute',
          elevation: Platform.OS === 'android' ? 8 : 0,
          shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
          width: width,
          left: 0,
          right: 0,
        },
        tabBarBackground: TabBarBackground,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'ios' ? 11 : 12,
          fontWeight: Platform.OS === 'ios' ? '600' : '500',
          marginTop: Platform.OS === 'ios' ? 4 : 6,
          letterSpacing: 0.1,
        },
        tabBarItemStyle: {
          paddingVertical: Platform.OS === 'ios' ? 8 : 6,
          paddingHorizontal: 4,
          borderRadius: 12,
          marginHorizontal: 2,
        },
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => renderTabBarIcon('home', focused),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => renderTabBarIcon('search', focused),
          tabBarAccessibilityLabel: 'Search tab',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Sell',
          tabBarIcon: ({ focused }) => renderTabBarIcon('add-circle', focused),
          tabBarAccessibilityLabel: 'Create listing tab',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => renderTabBarIcon('chatbubbles', focused, unreadMessages),
          tabBarAccessibilityLabel: `Messages tab${unreadMessages > 0 ? `, ${unreadMessages} unread` : ''}`,
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages.toString()) : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => renderTabBarIcon('person', focused),
          tabBarAccessibilityLabel: 'Profile tab',
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