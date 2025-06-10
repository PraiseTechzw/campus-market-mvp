import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function RecommendedProductsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  useEffect(() => {
    if (userPreferences.length > 0) {
      fetchRecommendedProducts();
    } else {
      setLoading(false);
    }
  }, [userPreferences]);

  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferred_categories')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.preferred_categories && data.preferred_categories.length > 0) {
        setUserPreferences(data.preferred_categories);
      } else {
        // If no preferences, use a default set of categories
        setUserPreferences(['Electronics', 'Books', 'Fashion']);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      // Default fallback
      setUserPreferences(['Electronics', 'Books', 'Fashion']);
    }
  };

  const fetchRecommendedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('is_sold', false)
        .in('category', userPreferences)
        .neq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendedProducts(data || []);
    } catch (error) {
      console.error('Error fetching recommended products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendedProducts();
  };

  const renderProductItem = ({ item, index }: { item: Product; index: number }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', delay: index * 100 }}
    >
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
        activeOpacity={0.8}
      >
        <Card style={styles.productCardContent}>
          {item.images && item.images.length > 0 ? (
            <Image 
              source={{ uri: item.images[0] }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="image" size={32} color={colors.textTertiary} />
            </View>
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.productOverlay}
          >
            <View style={[styles.recommendedBadge, { backgroundColor: colors.success }]}>
              <Ionicons name="thumbs-up" size={12} color="#FFFFFF" />
              <Text style={styles.recommendedBadgeText}>For You</Text>
            </View>
            
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.productPrice}>
                ${item.price.toFixed(2)}
              </Text>
              <View style={styles.productMeta}>
                <Text style={styles.productCategory}>
                  {item.category}
                </Text>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>
                    by {item.seller.name}
                  </Text>
                  {item.seller.is_verified && (
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>
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
        <Text style={[styles.title, { color: colors.text }]}>Recommended For You</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : recommendedProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="thumbs-up" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Recommendations Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Set your preferences in profile settings to get personalized recommendations
            </Text>
            <TouchableOpacity
              style={[styles.preferencesButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/profile/settings')}
            >
              <Text style={styles.preferencesButtonText}>Set Preferences</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={recommendedProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
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
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: (width - 60) / 2,
    height: 220,
  },
  productCardContent: {
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
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
  productOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    height: '60%',
    justifyContent: 'space-between',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productInfo: {
    gap: 4,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productMeta: {
    gap: 2,
  },
  productCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 24,
  },
  preferencesButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  preferencesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});