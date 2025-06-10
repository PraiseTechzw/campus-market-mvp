import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import Toast from 'react-native-toast-message';

export default function SavedProductsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedProducts();
    }
  }, [user]);

  const fetchSavedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_products')
        .select(`
          *,
          product:products(
            *,
            seller:users(*)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedProducts(data?.map(item => item.product) || []);
    } catch (error) {
      console.error('Error fetching saved products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const removeSavedProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('saved_products')
        .delete()
        .eq('user_id', user?.id)
        .eq('product_id', productId);

      if (error) throw error;

      setSavedProducts(prev => prev.filter(product => product.id !== productId));
      
      Toast.show({
        type: 'success',
        text1: 'Removed',
        text2: 'Product removed from saved items',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to remove product',
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedProducts();
  };

  const renderProductItem = ({ item, index }: { item: Product; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', delay: index * 100 }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/product/${item.id}`)}
        activeOpacity={0.8}
      >
        <Card style={styles.productItem}>
          <View style={styles.productContent}>
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
            
            <View style={styles.productDetails}>
              <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.productDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.productMeta}>
                <Text style={[styles.productPrice, { color: colors.primary }]}>
                  ${item.price.toFixed(2)}
                </Text>
                <Text style={[styles.productCategory, { color: colors.textTertiary }]}>
                  {item.category}
                </Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={[styles.sellerName, { color: colors.textSecondary }]}>
                  by {item.seller.name}
                </Text>
                {item.seller.is_verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeSavedProduct(item.id)}
            >
              <Ionicons name="heart" size={24} color={colors.error} />
            </TouchableOpacity>
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
        <Text style={[styles.title, { color: colors.text }]}>Saved Products</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : savedProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Saved Products
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Products you save will appear here for easy access
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedProducts}
            renderItem={renderProductItem}
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
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  productItem: {
    marginBottom: 16,
  },
  productContent: {
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
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  productCategory: {
    fontSize: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 12,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    padding: 8,
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