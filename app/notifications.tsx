import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return 'chatbubble';
      case 'order':
        return 'receipt';
      case 'product':
        return 'cube';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return colors.info;
      case 'order':
        return colors.success;
      case 'product':
        return colors.primary;
      case 'system':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', delay: index * 100 }}
    >
      <TouchableOpacity
        onPress={() => {
          if (!item.is_read) {
            markAsRead(item.id);
          }
          // Handle navigation based on notification type
          if (item.type === 'message' && item.data?.chatId) {
            router.push(`/chat/${item.data.chatId}`);
          } else if (item.type === 'product' && item.data?.productId) {
            router.push(`/product/${item.data.productId}`);
          }
        }}
        activeOpacity={0.8}
      >
        <Card style={[
          styles.notificationItem,
          !item.is_read && { backgroundColor: colors.primaryLight + '10' }
        ]}>
          <View style={styles.notificationContent}>
            <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.type) }]}>
              <Ionicons 
                name={getNotificationIcon(item.type) as any} 
                size={20} 
                color="#FFFFFF" 
              />
            </View>
            
            <View style={styles.notificationDetails}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
                {item.body}
              </Text>
              <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
            
            {!item.is_read && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    </MotiView>
  );

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={[styles.unreadHeader, { backgroundColor: colors.primaryLight + '20' }]}>
          <Text style={[styles.unreadText, { color: colors.primary }]}>
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Notifications
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You'll see notifications about messages, orders, and updates here
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unreadHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  notificationItem: {
    marginBottom: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 8,
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