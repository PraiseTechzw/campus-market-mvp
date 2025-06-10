import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Notification } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, loading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      refreshNotifications();
    }
    appState.current = nextAppState;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.data?.type === 'message' && notification.data?.chatId) {
      router.push(`/chat/${notification.data.chatId}`);
    } else if (notification.data?.type === 'order' && notification.data?.orderId) {
      router.push(`/order/${notification.data.orderId}`);
    } else if (notification.data?.type === 'product' && notification.data?.productId) {
      router.push(`/product/${notification.data.productId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return 'chatbubble-outline';
      case 'order':
        return 'cart-outline';
      case 'product':
        return 'cube-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotification = ({ item: notification }: { item: Notification }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing' }}
    >
      <TouchableOpacity
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <Card style={{
          ...styles.notificationCard,
          backgroundColor: notification.is_read ? colors.surface : colors.background
        }}>
          <View style={styles.notificationContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons 
                name={getNotificationIcon(notification.type)} 
                size={24} 
                color={colors.primary} 
              />
            </View>
            
            <View style={styles.notificationDetails}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                {notification.title}
              </Text>
              <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
                {notification.body}
              </Text>
              <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </Text>
            </View>
            
            {!notification.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    </MotiView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Notifications
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>
        {notifications.length > 0 && (
          <TouchableOpacity 
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});