import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Product, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'ecocash' | 'paynow'>('cash');
  const [meetupLocation, setMeetupLocation] = useState('University Library, Main Entrance');

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
      setSeller(data.seller);
    } catch (error) {
      console.error('Error fetching product:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load product details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !product || !seller) return;

    if (user.id === seller.id) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Action',
        text2: 'You cannot buy your own product',
      });
      return;
    }

    setProcessingOrder(true);
    
    try {
      // Create order
      const { data, error } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: seller.id,
          product_id: product.id,
          payment_method: selectedPaymentMethod,
          total_amount: product.price,
          delivery_method: 'meetup',
          meetup_location: meetupLocation,
        })
        .select()
        .single();

      if (error) throw error;

      // Create chat if it doesn't exist
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', seller.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (chatError) throw chatError;

      let chatId;
      
      if (!chatData) {
        const { data: newChat, error: newChatError } = await supabase
          .from('chats')
          .insert({
            buyer_id: user.id,
            seller_id: seller.id,
            product_id: product.id,
          })
          .select('id')
          .single();

        if (newChatError) throw newChatError;
        chatId = newChat.id;
      } else {
        chatId = chatData.id;
      }

      // Send message in chat
      await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: `I've placed an order for this item. Order #${data.order_number}`,
          message_type: 'system',
        });

      Toast.show({
        type: 'success',
        text1: 'Order Placed!',
        text2: 'Your order has been successfully placed',
      });

      router.replace(`/order/${data.id}`);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: error.message || 'Failed to place order',
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product || !seller) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Product Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            This product may have been removed or doesn't exist
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Checkout</Text>
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
          {/* Product Summary */}
          <Card style={styles.productCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Order Summary
            </Text>
            
            <View style={styles.productSummary}>
              {product.images && product.images.length > 0 ? (
                <Image 
                  source={{ uri: product.images[0] }} 
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
                  {product.title}
                </Text>
                <Text style={[styles.productCategory, { color: colors.textSecondary }]}>
                  {product.category} • {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
                </Text>
                <Text style={[styles.productPrice, { color: colors.primary }]}>
                  ${product.price.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Seller Info */}
          <Card style={styles.sellerCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Seller Information
            </Text>
            
            <View style={styles.sellerInfo}>
              <View style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}>
                {seller.avatar_url ? (
                  <Image source={{ uri: seller.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.sellerDetails}>
                <View style={styles.sellerHeader}>
                  <Text style={[styles.sellerName, { color: colors.text }]}>
                    {seller.name}
                  </Text>
                  {seller.is_verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {seller.university && (
                  <Text style={[styles.sellerUniversity, { color: colors.textSecondary }]}>
                    {seller.university}
                  </Text>
                )}
                <View style={styles.sellerRating}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                    {seller.rating || 0} ({seller.total_reviews || 0} reviews)
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Payment Method */}
          <Card style={styles.paymentCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Payment Method
            </Text>
            
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  { 
                    borderColor: selectedPaymentMethod === 'cash' ? colors.primary : colors.border,
                    backgroundColor: selectedPaymentMethod === 'cash' ? colors.primaryLight + '20' : colors.surface,
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('cash')}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={[styles.paymentIcon, { backgroundColor: colors.success }]}>
                    <Ionicons name="cash" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={[styles.paymentTitle, { color: colors.text }]}>
                      Cash
                    </Text>
                    <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>
                      Pay with cash at meetup
                    </Text>
                  </View>
                </View>
                {selectedPaymentMethod === 'cash' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  { 
                    borderColor: selectedPaymentMethod === 'ecocash' ? colors.primary : colors.border,
                    backgroundColor: selectedPaymentMethod === 'ecocash' ? colors.primaryLight + '20' : colors.surface,
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('ecocash')}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={[styles.paymentIcon, { backgroundColor: colors.info }]}>
                    <Ionicons name="phone-portrait" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={[styles.paymentTitle, { color: colors.text }]}>
                      EcoCash
                    </Text>
                    <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>
                      Pay with EcoCash mobile money
                    </Text>
                  </View>
                </View>
                {selectedPaymentMethod === 'ecocash' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  { 
                    borderColor: selectedPaymentMethod === 'paynow' ? colors.primary : colors.border,
                    backgroundColor: selectedPaymentMethod === 'paynow' ? colors.primaryLight + '20' : colors.surface,
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('paynow')}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={[styles.paymentIcon, { backgroundColor: colors.warning }]}>
                    <Ionicons name="card" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={[styles.paymentTitle, { color: colors.text }]}>
                      PayNow
                    </Text>
                    <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>
                      Pay with bank transfer
                    </Text>
                  </View>
                </View>
                {selectedPaymentMethod === 'paynow' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Card>

          {/* Meetup Location */}
          <Card style={styles.meetupCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Meetup Location
            </Text>
            
            <View style={styles.meetupOptions}>
              <TouchableOpacity
                style={[
                  styles.meetupOption,
                  { 
                    borderColor: meetupLocation === 'University Library, Main Entrance' ? colors.primary : colors.border,
                    backgroundColor: meetupLocation === 'University Library, Main Entrance' ? colors.primaryLight + '20' : colors.surface,
                  }
                ]}
                onPress={() => setMeetupLocation('University Library, Main Entrance')}
              >
                <View style={styles.meetupOptionContent}>
                  <View style={[styles.meetupIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="library" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.meetupDetails}>
                    <Text style={[styles.meetupTitle, { color: colors.text }]}>
                      University Library
                    </Text>
                    <Text style={[styles.meetupDescription, { color: colors.textSecondary }]}>
                      Main Entrance
                    </Text>
                  </View>
                </View>
                {meetupLocation === 'University Library, Main Entrance' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.meetupOption,
                  { 
                    borderColor: meetupLocation === 'Student Center Cafeteria' ? colors.primary : colors.border,
                    backgroundColor: meetupLocation === 'Student Center Cafeteria' ? colors.primaryLight + '20' : colors.surface,
                  }
                ]}
                onPress={() => setMeetupLocation('Student Center Cafeteria')}
              >
                <View style={styles.meetupOptionContent}>
                  <View style={[styles.meetupIcon, { backgroundColor: colors.info }]}>
                    <Ionicons name="cafe" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.meetupDetails}>
                    <Text style={[styles.meetupTitle, { color: colors.text }]}>
                      Student Center
                    </Text>
                    <Text style={[styles.meetupDescription, { color: colors.textSecondary }]}>
                      Cafeteria Area
                    </Text>
                  </View>
                </View>
                {meetupLocation === 'Student Center Cafeteria' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.meetupOption,
                  { 
                    borderColor: meetupLocation === 'Main Campus Entrance' ? colors.primary : colors.border,
                    backgroundColor: meetupLocation === 'Main Campus Entrance' ? colors.primaryLight + '20' : colors.surface,
                  }
                ]}
                onPress={() => setMeetupLocation('Main Campus Entrance')}
              >
                <View style={styles.meetupOptionContent}>
                  <View style={[styles.meetupIcon, { backgroundColor: colors.warning }]}>
                    <Ionicons name="school" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.meetupDetails}>
                    <Text style={[styles.meetupTitle, { color: colors.text }]}>
                      Main Campus
                    </Text>
                    <Text style={[styles.meetupDescription, { color: colors.textSecondary }]}>
                      Main Entrance Gate
                    </Text>
                  </View>
                </View>
                {meetupLocation === 'Main Campus Entrance' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Card>

          {/* Order Summary */}
          <Card style={styles.summaryCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Order Total
            </Text>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Item Price
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ${product.price.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Platform Fee
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                $0.00
              </Text>
            </View>
            
            <View style={[styles.summaryItem, styles.totalItem]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                ${product.price.toFixed(2)}
              </Text>
            </View>
          </Card>

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

          {/* Place Order Button */}
          <Button
            title="Place Order"
            onPress={handlePlaceOrder}
            loading={processingOrder}
            style={styles.placeOrderButton}
          />
          
          <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
            By placing this order, you agree to our Terms of Service and Privacy Policy
          </Text>
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
  productCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  productSummary: {
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
  sellerCard: {
    marginBottom: 20,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
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
  sellerDetails: {
    flex: 1,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sellerName: {
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
  sellerUniversity: {
    fontSize: 14,
    marginBottom: 4,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
  },
  paymentCard: {
    marginBottom: 20,
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
  },
  meetupCard: {
    marginBottom: 20,
  },
  meetupOptions: {
    gap: 12,
  },
  meetupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  meetupOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  meetupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  meetupDetails: {
    flex: 1,
  },
  meetupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meetupDescription: {
    fontSize: 14,
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
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
  safetyCard: {
    marginBottom: 24,
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
  placeOrderButton: {
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
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