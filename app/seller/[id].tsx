import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Product, Review, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function SellerProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [seller, setSeller] = useState<User | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalEarnings: 0,
    activeListings: 0,
    soldListings: 0,
    responseRate: 0,
    avgResponseTime: 0,
    rating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSellerData();
    }
  }, [id]);

  const fetchSellerData = async () => {
    try {
      console.log('Fetching seller data for ID:', id);
      
      // Fetch seller profile with phone and bio
      const { data: sellerData, error: sellerError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, university, bio, phone, created_at, is_verified')
        .eq('id', id)
        .single();

      if (sellerError) {
        console.error('Error fetching seller:', sellerError);
        throw sellerError;
      }
      console.log('Seller data:', sellerData);
      setSeller(sellerData as User);

      // Fetch seller's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', id)
        .eq('is_sold', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
      }
      console.log('Products data:', productsData);
      setSellerProducts((productsData || []) as Product[]);

      // Fetch seller's reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select(`
          *,
          reviewer:users!product_reviews_reviewer_id_fkey(*)
        `)
        .eq('seller_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        throw reviewsError;
      }
      console.log('Reviews data:', reviewsData);
      setReviews((reviewsData || []) as Review[]);

      // Fetch seller's stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_profile', { user_id: id });

      if (statsError) {
        console.error('Error fetching stats:', statsError);
        throw statsError;
      }
      console.log('Stats data:', statsData);
      
      if (statsData && Array.isArray(statsData) && statsData.length > 0) {
        const stats = statsData[0];
        setStats({
          totalSales: Number(stats.total_sales) || 0,
          totalEarnings: Number(stats.total_earnings) || 0,
          activeListings: Number(stats.active_listings) || 0,
          soldListings: Number(stats.sold_listings) || 0,
          responseRate: 95, // This would come from a separate query
          avgResponseTime: 2, // This would come from a separate query
          rating: Number(stats.rating) || 0,
          totalReviews: Number(stats.total_reviews) || 0,
        });
      }
    } catch (error) {
      console.error('Error in fetchSellerData:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load seller data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSellerData();
  };

  const renderProductItem = ({ item, index }: { item: Product; index: number }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', delay: index * 100 }}
    >
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image 
              source={{ uri: item.images[0] }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="image" size={24} color={colors.textTertiary} />
            </View>
          )}
          {item.is_featured && (
            <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="star" size={12} color="#FFFFFF" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <View style={styles.productMeta}>
            <View style={styles.productPriceContainer}>
              <Text style={[styles.productPrice, { color: colors.primary }]}>
                ${item.price.toFixed(2)}
              </Text>
            </View>
            
            {item.condition && (
              <View style={[styles.conditionBadge, { backgroundColor: colors.border + '20' }]}>
                <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                  {item.condition}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.productFooter}>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color={colors.textTertiary} />
              <Text style={[styles.locationText, { color: colors.textTertiary }]} numberOfLines={1}>
                {item.location || 'No location'}
              </Text>
            </View>
            
            <Text style={[styles.timeAgo, { color: colors.textTertiary }]}>
              {item.created_at ? formatTimeAgo(new Date(item.created_at)) : 'Just now'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!seller) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Seller Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            This seller profile may have been removed
          </Text>
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
        <Text style={[styles.title, { color: colors.text }]}>Seller Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >

        {/* Seller Info */}
        <Card style={styles.sellerCard}>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              {seller?.avatar_url ? (
                <Image 
                  source={{ uri: seller.avatar_url }} 
                  style={styles.avatarImage}
                  onError={(e) => console.error('Error loading avatar:', e.nativeEvent.error)}
                />
              ) : (
                <Ionicons name="person" size={32} color="#FFFFFF"yyoijhgbfvd />
              )}
            </View>
            <View style={styles.sellerDetails}>
              <View style={styles.sellerHeader}>
                <Text style={[styles.sellerName, { color: colors.text }]}>
                  {seller?.name || 'Unknown Seller'}
                </Text>
                {seller?.is_verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              {seller?.university && (
                <Text style={[styles.sellerUniversity, { color: colors.textSecondary }]}>
                  {seller.university}
                </Text>
              )}
              {seller?.bio && (
                <Text style={[styles.sellerBio, { color: colors.textSecondary }]}>
                  {seller.bio}
                </Text>
              )}
              <View style={styles.sellerStats}>
                <Text style={[styles.memberSince, { color: colors.textTertiary }]}>
                  Member since {seller?.created_at ? new Date(seller.created_at).getFullYear() : 'N/A'}
                </Text>
                <View style={styles.rating}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                    {stats.rating || 0} ({stats.totalReviews || 0} reviews)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Contact Button - Always visible */}
        {user?.id !== seller?.id && (
          <View style={styles.contactButton}>
            <Button
              title="Contact Seller"
              onPress={() => setShowContactSheet(true)}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {/* Products */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Products ({sellerProducts.length})
            </Text>
          </View>
          
          {sellerProducts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No products available
              </Text>
            </Card>
          ) : (
            <FlatList
              data={sellerProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Contact Sheet */}
        <BottomSheet
          visible={showContactSheet}
          onClose={() => setShowContactSheet(false)}
          title="Contact Seller"
        >
          <View style={styles.contactOptions}>
            {seller?.phone && (
              <>
                <TouchableOpacity
                  style={[styles.contactOption, { backgroundColor: colors.primary }]}
                  onPress={() => Linking.openURL(`tel:${seller.phone}`)}
                >
                  <Ionicons name="call" size={24} color="#FFFFFF" />
                  <Text style={styles.contactOptionText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactOption, { backgroundColor: '#25D366' }]}
                  onPress={() => {
                    const message = `Hi, I'm interested in your products on Campus Marketplace. Can we talk about it?`;
                    const whatsappUrl = `whatsapp://send?phone=${seller.phone}&text=${encodeURIComponent(message)}`;
                    Linking.openURL(whatsappUrl);
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
                  <Text style={styles.contactOptionText}>WhatsApp</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={[styles.contactOption, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowContactSheet(false);
                router.push('/(tabs)/messages');
              }}
            >
              <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
              <Text style={styles.contactOptionText}>Message</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </ScrollView>
    </View>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
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
  sellerCard: {
    marginBottom: 24,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    fontWeight: '700',
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerUniversity: {
    fontSize: 14,
    marginBottom: 8,
  },
  sellerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberSince: {
    fontSize: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  productsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  productCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  timeAgo: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  contactSection: {
    marginBottom: 40,
  },
  contactButton: {
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  },
  reviewCard: {
    marginBottom: 12,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  debugCard: {
    marginBottom: 16,
    padding: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
  },
  sellerBio: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 20,
  },
  contactOptions: {
    padding: 16,
    gap: 12,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  contactOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});