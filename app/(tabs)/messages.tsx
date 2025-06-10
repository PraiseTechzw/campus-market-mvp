import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Chat } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          buyer:users!buyer_id(*),
          seller:users!seller_id(*),
          product:products(*)
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
          <Card style={styles.chatItem}>
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
                  <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
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
        <TouchableOpacity style={styles.searchButton}>
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