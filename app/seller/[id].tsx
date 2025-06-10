import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { User, Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

export default function SellerProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [seller, setSeller] = useState<User | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSellerData();
    }
  }, [id]);

  const fetchSellerData = async () => {
    try {
      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (sellerError) throw sellerError;
      setSeller(sellerData);

      // Fetch seller's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', id)
        .eq('is_sold', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (productsError) throw productsError;
      setSellerProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching seller data:', error);
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
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        {item.images && item.images.length > 0 ? (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
            <Ionicons name="image" size={20} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            ${item.price.toFixed(2)}
          </Text>
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
            <View style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}>
              {seller.avatar_url ? (
                <Image source={{ uri: seller.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={32} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.sellerDetails}>
              <View style={styles.sellerHeader}>
                <Text style={[styles.sellerName, { color: colors.text }]}>
                  {seller.name}
                </Text>
                {seller.is_verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              {seller.university && (
                <Text style={[styles.sellerUniversity, { color: colors.textSecondary }]}>
                  {seller.university}
                </Text>
              )}
              <View style={styles.sellerStats}>
                <Text style={[styles.memberSince, { color: colors.textTertiary }]}>
                  Member since {new Date(seller.created_at).getFullYear()}
                </Text>
                <View style={styles.rating}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                    4.8 (24 reviews)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

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

        {/* Contact Button */}
        {user?.id !== seller.id && (
          <View style={styles.contactSection}>
            <Button
              title="Contact Seller"
              onPress={() => {
                // Navigate to messages or create chat
                router.push('/(tabs)/messages');
              }}
              style={styles.contactButton}
            />
          </View>
        )}
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
  },
  productCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
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
    width: '100%',
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
});