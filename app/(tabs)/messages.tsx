import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MessagingService } from '@/lib/messaging';
import { Chat } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const subscription = useRef<{ unsubscribe: () => void } | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (user) {
      fetchChats();
      subscribeToChats();
      
      // Listen for app state changes to refresh chats when app comes to foreground
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        subscription.remove();
        if (subscription.current) {
          subscription.current.unsubscribe();
        }
      };
    }
  }, [user]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      fetchChats();
    }
    appState.current = nextAppState;
  };

  const fetchChats = async () => {
    try {
      const { data, error } = await MessagingService.getChats(user?.id || '');
      if (error) throw new Error(error);
      setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const subscribeToChats = () => {
    if (!user) return;
    
    subscription.current = MessagingService.subscribeToChats(user.id, (updatedChat) => {
      setChats(prevChats => {
        // Find if chat already exists in the list
        const chatIndex = prevChats.findIndex(chat => chat.id === updatedChat.id);
        
        if (chatIndex >= 0) {
          // Update existing chat
          const newChats = [...prevChats];
          newChats[chatIndex] = {
            ...newChats[chatIndex],
            last_message: updatedChat.last_message,
            last_message_at: updatedChat.last_message_at,
            last_message_sender_id: updatedChat.last_message_sender_id,
          };
          
          // Sort chats by last message time
          return newChats.sort((a, b) => {
            const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
            const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
            return bTime - aTime;
          });
        } else {
          // Fetch the full chat details and add to list
          MessagingService.getChatById(updatedChat.id).then(({ data }) => {
            if (data) {
              setChats(prev => [data, ...prev]);
            }
          });
          return prevChats;
        }
      });
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderChatItem = ({ item, index }: { item: Chat; index: number }) => {
    const otherUser = item.buyer_id === user?.id ? item.seller : item.buyer;
    const isCurrentUserBuyer = item.buyer_id === user?.id;
    const isUnread = item.last_message_sender_id !== user?.id && !item.is_read;

    return (
      <MotiView
        from={{ opacity: 0, translateX: -50 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', delay: index * 100 }}
      >
        <TouchableOpacity
          onPress={() => router.push(`/chat/${item.id}`)}
          activeOpacity={0.8}
        >
          <Card style={[
            styles.chatItem,
            isUnread && { backgroundColor: colors.primaryLight + '10' }
          ]}>
            <View style={styles.chatContent}>
              <View style={styles.productInfo}>
                {item.product.images && item.product.images.length > 0 ? (
                  <Image 
                    source={{ uri: item.product.images[0] }} 
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
                    <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
                      No Image
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.chatDetails}>
                <View style={styles.chatHeader}>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {otherUser.name}
                    </Text>
                    {otherUser.is_verified && (
                      <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.verifiedText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.time, { color: colors.textTertiary }]}>
                    {item.last_message_at ? formatTime(item.last_message_at) : formatTime(item.created_at)}
                  </Text>
                </View>

                <Text style={[styles.productTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.product.title}
                </Text>

                {item.last_message && (
                  <Text 
                    style={[
                      styles.lastMessage, 
                      { 
                        color: isUnread ? colors.text : colors.textSecondary,
                        fontWeight: isUnread ? '600' : '400'
                      }
                    ]} 
                    numberOfLines={1}
                  >
                    {item.last_message}
                  </Text>
                )}

                <View style={styles.chatMeta}>
                  <Text style={[styles.roleLabel, { color: colors.textTertiary }]}>
                    {isCurrentUserBuyer ? 'Buying' : 'Selling'}
                  </Text>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>
                    ${item.product.price.toFixed(2)}
                  </Text>
                </View>
              </View>
              
              {isUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </Card>
        </TouchableOpacity>
      </MotiView>
    );
  };

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Ionicons name="search" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Messages Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start conversations by contacting sellers or buyers
            </Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            renderItem={renderChatItem}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  chatItem: {
    marginBottom: 16,
  },
  chatContent: {
    flexDirection: 'row',
    position: 'relative',
  },
  productInfo: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
  },
  chatDetails: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  chatMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 12,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 8,
    right: 8,
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