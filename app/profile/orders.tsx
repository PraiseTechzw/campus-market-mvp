import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!buyer_id(*),
          seller:users!seller_id(*),
          product:products(*)
        `)
        .eq(activeTab === 'buying' ? 'buyer_id' : 'seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.info;
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'confirmed':
        return 'checkmark-circle';
      case 'delivered':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderOrderItem = ({ item, index }: { item: Order; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', delay: index * 100 }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/order/${item.id}`)}
        activeOpacity={0.8}
      >
        <Card style={styles.orderItem}>
          <View style={styles.orderContent}>
            {item.product.images && item.product.images.length > 0 ? (
              <Image 
                source={{ uri: item.product.images[0] }} 
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="image" size={24} color={colors.textTertiary} />
              </View>
            )}
            
            <View style={styles.orderDetails}>
              <View style={styles.orderHeader}>
                <Text style={[styles.orderTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.product.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Ionicons 
                    name={getStatusIcon(item.status) as any} 
                    size={12} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.statusText}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.orderPrice, { color: colors.primary }]}>
                ${item.total_amount.toFixed(2)}
              </Text>
              
              <View style={styles.orderMeta}>
                <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                  {formatDate(item.created_at)}
                </Text>
                <Text style={[styles.orderUser, { color: colors.textSecondary }]}>
                  {activeTab === 'buying' ? `Seller: ${item.seller.name}` : `Buyer: ${item.buyer.name}`}
                </Text>
              </View>
              
              <Text style={[styles.paymentMethod, { color: colors.textTertiary }]}>
                Payment: {item.payment_method.toUpperCase()}
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </TouchableOpacity>
    </MotiView>
  );

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Orders</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'buying' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('buying')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'buying' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            Buying
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'selling' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('selling')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'selling' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            Selling
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Orders Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {activeTab === 'buying' 
                ? 'Orders you place will appear here'
                : 'Orders for your products will appear here'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
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
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  orderItem: {
    marginBottom: 16,
  },
  orderContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  orderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  orderUser: {
    fontSize: 12,
  },
  paymentMethod: {
    fontSize: 12,
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