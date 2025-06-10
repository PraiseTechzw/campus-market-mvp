import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
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

export default function MyListingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, activeTab]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id)
        .eq('is_sold', activeTab === 'sold')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteProduct(productId)
        },
      ]
    );
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== productId));
      
      Toast.show({
        type: 'success',
        text1: 'Product Deleted',
        text2: 'Your product has been deleted successfully',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: error.message || 'Failed to delete product',
      });
    }
  };

  const toggleSoldStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_sold: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, is_sold: !currentStatus }
            : product
        )
      );
      
      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: `Product marked as ${!currentStatus ? 'sold' : 'available'}`,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update product status',
      });
    }
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
              <View style={styles.productStats}>
                <View style={styles.statItem}>
                  <Ionicons name="eye" size={14} color={colors.textTertiary} />
                  <Text style={[styles.statText, { color: colors.textTertiary }]}>
                    {item.view_count} views
                  </Text>
                </View>
                <Text style={[styles.productDate, { color: colors.textTertiary }]}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.productActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/product/edit/${item.id}`)}
              >
                <Ionicons name="create" size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => toggleSoldStatus(item.id, item.is_sold)}
              >
                <Ionicons 
                  name={item.is_sold ? "refresh" : "checkmark"} 
                  size={20} 
                  color={item.is_sold ? colors.warning : colors.success} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => handleDeleteProduct(item.id)}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
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
        <Text style={[styles.title, { color: colors.text }]}>My Listings</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'active' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'active' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            Active ({products.filter(p => !p.is_sold).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sold' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('sold')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'sold' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            Sold ({products.filter(p => p.is_sold).length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Products Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {activeTab === 'active' 
                ? 'Start selling by creating your first product listing'
                : 'Products you\'ve sold will appear here'
              }
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/create')}
              >
                <Text style={styles.createButtonText}>Create Listing</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={products}
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
  addButton: {
    padding: 8,
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
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  productDate: {
    fontSize: 12,
  },
  productActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});