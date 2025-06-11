import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function OrderDetailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchOrder();
    }
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!buyer_id(*),
          seller:users!seller_id(*),
          product:products(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load order details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'confirmed' | 'delivered' | 'cancelled') => {
    if (!order) return;

    // Check if user is authorized to update status
    const isBuyer = user?.id === order.buyer_id;
    const isSeller = user?.id === order.seller_id;

    if (!isBuyer && !isSeller) {
      Toast.show({
        type: 'error',
        text1: 'Unauthorized',
        text2: 'You are not authorized to update this order',
      });
      return;
    }

    // Validate status change
    if (newStatus === 'confirmed' && !isSeller) {
      Toast.show({
        type: 'error',
        text1: 'Unauthorized',
        text2: 'Only the seller can confirm orders',
      });
      return;
    }

    if (newStatus === 'delivered' && !isBuyer) {
      Toast.show({
        type: 'error',
        text1: 'Unauthorized',
        text2: 'Only the buyer can mark orders as delivered',
      });
      return;
    }

    // Confirm cancellation
    if (newStatus === 'cancelled') {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: () => updateOrderStatus(newStatus) },
        ]
      );
      return;
    }

    updateOrderStatus(newStatus);
  };

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
          ...(newStatus === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
        })
        .eq('id', id);

      if (error) throw error;

      // Send message to chat
      const { data: chatData } = await supabase
        .from('chats')
        .select('id')
        .eq('buyer_id', order?.buyer_id)
        .eq('seller_id', order?.seller_id)
        .eq('product_id', order?.product_id)
        .single();

      if (chatData) {
        await supabase
          .from('messages')
          .insert({
            chat_id: chatData.id,
            sender_id: user?.id,
            content: `Order status updated to: ${newStatus.toUpperCase()}`,
            message_type: 'system',
          });
      }

      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: `Order has been ${newStatus}`,
      });

      // Refresh order data
      fetchOrder();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update order status',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleContactUser = async (userId: string) => {
    if (!order) return;

    try {
      // Check if chat already exists
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('buyer_id', order.buyer_id)
        .eq('seller_id', order.seller_id)
        .eq('product_id', order.product_id)
        .single();

      if (chatError && chatError.code !== 'PGRST116') throw chatError;

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
      } else {
        // Create new chat
        const { data: newChat, error } = await supabase
          .from('chats')
          .insert({
            buyer_id: order.buyer_id,
            seller_id: order.seller_id,
            product_id: order.product_id,
          })
          .select('id')
          .single();

        if (error) throw error;
        router.push(`/chat/${newChat.id}`);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to open chat',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.info;
      case 'delivered':
      case 'completed':
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
      case 'completed':
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Order Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            This order may have been removed or doesn't exist
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;
  const otherUser = isBuyer ? order.seller : order.buyer;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {/* Order Status */}
          <Card style={styles.statusCard}>
            <View style={styles.orderNumberContainer}>
              <Text style={[styles.orderNumberLabel, { color: colors.textSecondary }]}>
                Order Number
              </Text>
              <Text style={[styles.orderNumber, { color: colors.text }]}>
                {order.order_number}
              </Text>
            </View>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Ionicons name={getStatusIcon(order.status) as any} size={16} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {order.status.toUpperCase()}
                </Text>
              </View>
              
              <Text style={[styles.statusDate, { color: colors.textSecondary }]}>
                {formatDate(order.created_at)}
              </Text>
            </View>
          </Card>

          {/* Product Info */}
          <Card style={styles.productCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Product Information
            </Text>
            
            <TouchableOpacity
              style={styles.productContainer}
              onPress={() => router.push(`/product/${order.product_id}`)}
            >
              {order.product.images && order.product.images.length > 0 ? (
                <Image 
                  source={{ uri: order.product.images[0] }} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons name="image" size={24} color={colors.textTertiary} />
                </View>
              )}
              
              <View style={styles.productDetails}>
                <Text style={[styles.productTitle, { color: colors.text }]}>
                  {order.product.title}
                </Text>
                <Text style={[styles.productCategory, { color: colors.textSecondary }]}>
                  {order.product.category} • {order.product.condition.charAt(0).toUpperCase() + order.product.condition.slice(1)}
                </Text>
                <Text style={[styles.productPrice, { color: colors.primary }]}>
                  ${order.product.price.toFixed(2)}
                </Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* User Info */}
          <Card style={styles.userCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBuyer ? 'Seller Information' : 'Buyer Information'}
            </Text>
            
            <TouchableOpacity
              style={styles.userContainer}
              onPress={() => router.push(`/seller/${otherUser.id}`)}
            >
              <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                {otherUser.avatar_url ? (
                  <Image source={{ uri: otherUser.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                )}
              </View>
              
              <View style={styles.userDetails}>
                <View style={styles.userHeader}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {otherUser.name}
                  </Text>
                  {otherUser.is_verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {otherUser.university && (
                  <Text style={[styles.userUniversity, { color: colors.textSecondary }]}>
                    {otherUser.university}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: colors.primary }]}
                onPress={() => handleContactUser(otherUser.id)}
              >
                <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Chat</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Card>

          {/* Order Details */}
          <Card style={styles.detailsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Order Details
            </Text>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Payment Method
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Meetup Location
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {order.meetup_location || 'Not specified'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Order Date
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(order.created_at)}
              </Text>
            </View>
            
            {order.status === 'completed' && order.completed_at && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Completed Date
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(order.completed_at)}
                </Text>
              </View>
            )}
            
            {order.status === 'cancelled' && order.cancelled_at && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Cancelled Date
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(order.cancelled_at)}
                </Text>
              </View>
            )}
            
            <View style={[styles.detailItem, styles.totalItem]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total Amount
              </Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                ${order.total_amount.toFixed(2)}
              </Text>
            </View>
          </Card>

          {/* Action Buttons */}
          {order.status === 'pending' && (
            <View style={styles.actionButtons}>
              {isSeller && (
                <Button
                  title="Confirm Order"
                  onPress={() => handleUpdateStatus('confirmed')}
                  loading={updating}
                  style={styles.confirmButton}
                />
              )}
              
              <Button
                title="Cancel Order"
                onPress={() => handleUpdateStatus('cancelled')}
                variant="outline"
                loading={updating}
                style={[styles.cancelButton, { borderColor: colors.error }]}
                textStyle={{ color: colors.error }}
              />
            </View>
          )}

          {order.status === 'confirmed' && isBuyer && (
            <Button
              title="Mark as Delivered"
              onPress={() => handleUpdateStatus('delivered')}
              loading={updating}
              style={styles.deliveredButton}
            />
          )}

          {/* Safety Tips */}
          <Card style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              <Text style={[styles.safetyTitle, { color: colors.text }]}>
                Safety Tips
              </Text>
            </View>
            
            <View style={styles.safetyList}>
              <View style={styles.safetyItem}>
                <View style={[styles.safetyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
                  Always meet in public, well-lit campus areas
                </Text>
              </View>
              
              <View style={styles.safetyItem}>
                <View style={[styles.safetyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
                  Inspect the item before payment
                </Text>
              </View>
              
              <View style={styles.safetyItem}>
                <View style={[styles.safetyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
                  Consider bringing a friend for added security
                </Text>
              </View>
            </View>
          </Card>
        </MotiView>
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 20,
  },
  orderNumberContainer: {
    marginBottom: 16,
  },
  orderNumberLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusDate: {
    fontSize: 14,
  },
  productCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  userCard: {
    marginBottom: 20,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
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
  userUniversity: {
    fontSize: 14,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsCard: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalItem: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  actionButtons: {
    marginBottom: 20,
    gap: 12,
  },
  confirmButton: {
    marginBottom: 0,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  deliveredButton: {
    marginBottom: 20,
  },
  safetyCard: {
    marginBottom: 40,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  safetyList: {
    gap: 12,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  safetyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  safetyText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
  },
});