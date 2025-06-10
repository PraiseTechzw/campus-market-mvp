import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Share, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      checkIfSaved();
      incrementViewCount();
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

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

  const fetchRelatedProducts = async () => {
    if (!product) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('category', product.category)
        .eq('is_sold', false)
        .neq('id', product.id)
        .limit(6);

      if (error) throw error;
      setRelatedProducts(data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_products')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      if (!error && data) {
        setIsSaved(true);
      }
    } catch (error) {
      // Product not saved, which is fine
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment_view_count', { product_id: id });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleSaveProduct = async () => {
    if (!user) {
      router.push('/(auth)');
      return;
    }

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_products')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;
        setIsSaved(false);
        Toast.show({
          type: 'success',
          text1: 'Removed from Saved',
          text2: 'Product removed from your saved items',
        });
      } else {
        const { error } = await supabase
          .from('saved_products')
          .insert({
            user_id: user.id,
            product_id: id,
          });

        if (error) throw error;
        setIsSaved(true);
        Toast.show({
          type: 'success',
          text1: 'Saved!',
          text2: 'Product added to your saved items',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save product',
      });
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      router.push('/(auth)');
      return;
    }

    if (!product) return;

    if (user.id === product.seller_id) {
      Toast.show({
        type: 'info',
        text1: 'Your Product',
        text2: 'You cannot contact yourself',
      });
      return;
    }

    try {
      // Check if chat already exists
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', product.seller_id)
        .eq('product_id', product.id)
        .single();

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
        return;
      }

      // Create new chat
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: product.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      router.push(`/chat/${newChat.id}`);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to start conversation',
      });
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push('/(auth)');
      return;
    }

    if (!product) return;

    if (user.id === product.seller_id) {
      Toast.show({
        type: 'info',
        text1: 'Your Product',
        text2: 'You cannot buy your own product',
      });
      return;
    }

    Alert.alert(
      'Buy Now',
      `Are you sure you want to buy "${product.title}" for $${product.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Now', onPress: () => router.push(`/checkout/${product.id}`) },
      ]
    );
  };

  const handleShare = async () => {
    if (!product) return;

    try {
      await Share.share({
        message: `Check out this ${product.title} for $${product.price} on Campus Market!`,
        title: product.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReportProduct = () => {
    Alert.alert(
      'Report Product',
      'Why are you reporting this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => submitReport('inappropriate') },
        { text: 'Fake Product', onPress: () => submitReport('fake') },
        { text: 'Spam', onPress: () => submitReport('spam') },
        { text: 'Other', onPress: () => submitReport('other') },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    try {
      // In a real app, you'd submit this to a reports table
      Toast.show({
        type: 'success',
        text1: 'Report Submitted',
        text2: 'Thank you for helping keep our community safe',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit report',
      });
    }
  };

  const renderImageGallery = () => (
    <View style={styles.imageSection}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(index);
        }}
      >
        {product?.images.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageContainer}
            onPress={() => router.push(`/image-viewer/${product.id}?index=${index}`)}
          >
            <Image
              source={{ uri: image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {product && product.images.length > 1 && (
        <View style={styles.imageIndicators}>
          {product.images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === currentImageIndex ? colors.primary : colors.border,
                }
              ]}
            />
          ))}
        </View>
      )}

      <View style={styles.imageBadges}>
        <View style={[styles.conditionBadge, { 
          backgroundColor: product?.condition === 'new' ? colors.success : colors.warning 
        }]}>
          <Text style={styles.conditionText}>
            {product?.condition.toUpperCase()}
          </Text>
        </View>
        {product?.is_featured && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>

      <View style={styles.imageCounter}>
        <Text style={[styles.imageCounterText, { color: colors.text }]}>
          {currentImageIndex + 1} / {product?.images.length || 0}
        </Text>
      </View>
    </View>
  );

  const renderProductInfo = () => (
    <View style={styles.productInfo}>
      <Card style={styles.infoCard}>
        <View style={styles.productHeader}>
          <View style={styles.productTitleSection}>
            <Text style={[styles.productTitle, { color: colors.text }]}>
              {product?.title}
            </Text>
            <View style={styles.productMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="pricetag" size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {product?.category}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="eye" size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {product?.view_count} views
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {product && new Date(product.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.priceSection}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              ${product?.price.toFixed(2)}
            </Text>
            <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>
              Best Price
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Description
        </Text>
        <Text 
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={showFullDescription ? undefined : 3}
        >
          {product?.description}
        </Text>
        {product && product.description.length > 150 && (
          <TouchableOpacity 
            style={styles.showMoreButton}
            onPress={() => setShowFullDescription(!showFullDescription)}
          >
            <Text style={[styles.showMoreText, { color: colors.primary }]}>
              {showFullDescription ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {product?.specifications && Object.keys(product.specifications).length > 0 && (
        <Card style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Specifications
          </Text>
          <View style={styles.specifications}>
            {Object.entries(product.specifications).map(([key, value]) => (
              <View key={key} style={[styles.specItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.specKey, { color: colors.textSecondary }]}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </Text>
                <Text style={[styles.specValue, { color: colors.text }]}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Seller Information
        </Text>
        <TouchableOpacity 
          style={styles.sellerInfo}
          onPress={() => router.push(`/seller/${product?.seller.id}`)}
        >
          <View style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}>
            {product?.seller.avatar_url ? (
              <Image source={{ uri: product.seller.avatar_url }} style={styles.sellerAvatarImage} />
            ) : (
              <Ionicons name="person" size={24} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.sellerDetails}>
            <View style={styles.sellerHeader}>
              <Text style={[styles.sellerName, { color: colors.text }]}>
                {product?.seller.name}
              </Text>
              {product?.seller.is_verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            {product?.seller.university && (
              <Text style={[styles.sellerUniversity, { color: colors.textSecondary }]}>
                {product.seller.university}
              </Text>
            )}
            <View style={styles.sellerStats}>
              <Text style={[styles.memberSince, { color: colors.textTertiary }]}>
                Member since {new Date(product?.seller.created_at || '').getFullYear()}
              </Text>
              <View style={styles.sellerRating}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                  4.8 (24 reviews)
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </Card>

      {relatedProducts.length > 0 && (
        <Card style={styles.infoCard}>
          <View style={styles.relatedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Related Products
            </Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/(tabs)/search',
              params: { category: product?.category }
            })}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.relatedProducts}>
              {relatedProducts.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.relatedProductCard, { backgroundColor: colors.surface }]}
                  onPress={() => router.push(`/product/${item.id}`)}
                >
                  {item.images && item.images.length > 0 ? (
                    <Image 
                      source={{ uri: item.images[0] }} 
                      style={styles.relatedProductImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.relatedProductImagePlaceholder, { backgroundColor: colors.border }]}>
                      <Ionicons name="image" size={20} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={styles.relatedProductInfo}>
                    <Text style={[styles.relatedProductTitle, { color: colors.text }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={[styles.relatedProductPrice, { color: colors.primary }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>
      )}
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product) {
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

  const isOwnProduct = user?.id === product.seller_id;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShare}
          >
            <Ionicons name="share" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleSaveProduct}
          >
            <Ionicons 
              name={isSaved ? "heart" : "heart-outline"} 
              size={24} 
              color={isSaved ? colors.error : colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleReportProduct}
          >
            <Ionicons name="flag" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderImageGallery()}
        {renderProductInfo()}
      </ScrollView>

      {!isOwnProduct && (
        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={handleContactSeller}
          >
            <Ionicons name="chatbubble" size={20} color={colors.primary} />
            <Text style={[styles.contactButtonText, { color: colors.primary }]}>
              Chat
            </Text>
          </TouchableOpacity>
          <Button
            title="Buy Now"
            onPress={handleBuyNow}
            style={styles.buyButton}
          />
        </View>
      )}
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
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
  },
  imageContainer: {
    width: width,
    height: 300,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageBadges: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-end',
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  productInfo: {
    padding: 20,
    gap: 16,
  },
  infoCard: {
    marginBottom: 0,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitleSection: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 30,
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  showMoreButton: {
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  specifications: {
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  specKey: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImage: {
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
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  sellerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberSince: {
    fontSize: 12,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  relatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  relatedProducts: {
    flexDirection: 'row',
    gap: 12,
  },
  relatedProductCard: {
    width: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  relatedProductImage: {
    width: '100%',
    height: 80,
  },
  relatedProductImagePlaceholder: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedProductInfo: {
    padding: 8,
  },
  relatedProductTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  relatedProductPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flex: 2,
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