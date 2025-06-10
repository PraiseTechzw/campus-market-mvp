import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Product, CATEGORIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [flashDeals, setFlashDeals] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchProducts(),
        fetchFeaturedProducts(),
        fetchTrendingProducts(),
        fetchFlashDeals(),
        fetchNewArrivals(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('is_sold', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('is_sold', false)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('is_sold', false)
        .order('view_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrendingProducts(data || []);
    } catch (error) {
      console.error('Error fetching trending products:', error);
    }
  };

  const fetchFlashDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('is_sold', false)
        .lte('price', 100)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setFlashDeals(data || []);
    } catch (error) {
      console.error('Error fetching flash deals:', error);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*)
        `)
        .eq('is_sold', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setNewArrivals(data || []);
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.headerContent}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Good day,
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications" size={24} color={colors.text} />
            <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHeroBanner = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 800 }}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.heroBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Campus Market</Text>
            <Text style={styles.heroSubtitle}>
              Discover amazing deals from fellow students
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{products.length}+</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{trendingProducts.length}</Text>
                <Text style={styles.statLabel}>Trending</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{featuredProducts.length}</Text>
                <Text style={styles.statLabel}>Featured</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroImage}>
            <View style={styles.floatingCard}>
              <Ionicons name="bag-handle" size={32} color={colors.primary} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </MotiView>
  );

  const renderFlashDeals = () => (
    flashDeals.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="flash" size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Flash Deals</Text>
            <View style={[styles.flashBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.flashBadgeText}>HOT</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push({
            pathname: '/(tabs)/search',
            params: { category: 'Flash Deals' }
          })}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={flashDeals}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateX: 50 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', delay: index * 100 }}
            >
              <TouchableOpacity
                style={styles.flashDealCard}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <View style={styles.flashDealImageContainer}>
                  {item.images && item.images.length > 0 ? (
                    <Image 
                      source={{ uri: item.images[0] }} 
                      style={styles.flashDealImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.flashDealImagePlaceholder, { backgroundColor: colors.border }]}>
                      <Ionicons name="image" size={24} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
                    <Text style={styles.discountText}>-{Math.floor(Math.random() * 30 + 10)}%</Text>
                  </View>
                </View>
                <View style={styles.flashDealInfo}>
                  <Text style={[styles.flashDealTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.flashDealPricing}>
                    <Text style={[styles.flashDealPrice, { color: colors.error }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                    <Text style={[styles.flashDealOriginalPrice, { color: colors.textTertiary }]}>
                      ${(item.price * 1.3).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          )}
          keyExtractor={(item) => `flash-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flashDealsList}
        />
      </View>
    )
  );

  const renderCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop by Category</Text>
        <TouchableOpacity onPress={() => router.push('/categories')}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoriesGrid}>
        {CATEGORIES.slice(0, 8).map((category, index) => {
          const categoryIcons: Record<string, string> = {
            'Electronics': 'phone-portrait',
            'Books': 'book',
            'Fashion': 'shirt',
            'Services': 'construct',
            'Furniture': 'bed',
            'Sports': 'football',
            'Beauty': 'flower',
            'Food': 'restaurant',
          };

          const categoryColors = [
            colors.primary, colors.info, colors.success, colors.warning,
            colors.error, '#8B5CF6', '#F59E0B', '#10B981'
          ];

          return (
            <MotiView
              key={category}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: index * 100 }}
            >
              <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push({
                  pathname: '/(tabs)/search',
                  params: { category }
                })}
              >
                <View style={[styles.categoryIcon, { backgroundColor: categoryColors[index] }]}>
                  <Ionicons 
                    name={categoryIcons[category] as any} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={[styles.categoryText, { color: colors.text }]}>{category}</Text>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>
    </View>
  );

  const renderFeaturedProducts = () => (
    featuredProducts.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="star" size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Products</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/featured')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={featuredProducts}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', delay: index * 100 }}
            >
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <Card style={styles.featuredCardContent}>
                  {item.images && item.images.length > 0 ? (
                    <Image 
                      source={{ uri: item.images[0] }} 
                      style={styles.featuredImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.featuredImagePlaceholder, { backgroundColor: colors.border }]}>
                      <Ionicons name="image" size={32} color={colors.textTertiary} />
                    </View>
                  )}
                  
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.featuredOverlay}
                  >
                    <View style={[styles.featuredBadge, { backgroundColor: colors.warning }]}>
                      <Ionicons name="star" size={12} color="#FFFFFF" />
                      <Text style={styles.featuredBadgeText}>Featured</Text>
                    </View>
                    
                    <View style={styles.featuredInfo}>
                      <Text style={styles.featuredTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.featuredPrice}>
                        ${item.price.toFixed(2)}
                      </Text>
                    </View>
                  </LinearGradient>
                </Card>
              </TouchableOpacity>
            </MotiView>
          )}
          keyExtractor={(item) => `featured-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      </View>
    )
  );

  const renderNewArrivals = () => (
    newArrivals.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="sparkles" size={20} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>New Arrivals</Text>
            <View style={[styles.newBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/new-arrivals')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.newArrivalsGrid}>
          {newArrivals.map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: index * 100 }}
              style={styles.newArrivalCardContainer}
            >
              <TouchableOpacity
                style={[styles.newArrivalCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                {item.images && item.images.length > 0 ? (
                  <Image 
                    source={{ uri: item.images[0] }} 
                    style={styles.newArrivalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.newArrivalImagePlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="image" size={20} color={colors.textTertiary} />
                  </View>
                )}
                
                <View style={styles.newArrivalInfo}>
                  <Text style={[styles.newArrivalTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.newArrivalPrice, { color: colors.primary }]}>
                    ${item.price.toFixed(2)}
                  </Text>
                  <View style={styles.newArrivalMeta}>
                    <Ionicons name="time" size={12} color={colors.success} />
                    <Text style={[styles.newArrivalTime, { color: colors.textTertiary }]}>
                      {Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>
    )
  );

  const renderTrendingProducts = () => (
    trendingProducts.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="trending-up" size={20} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Now</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/trending')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.trendingGrid}>
          {trendingProducts.slice(0, 6).map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: index * 100 }}
              style={styles.trendingCardContainer}
            >
              <TouchableOpacity
                style={[styles.trendingCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                {item.images && item.images.length > 0 ? (
                  <Image 
                    source={{ uri: item.images[0] }} 
                    style={styles.trendingImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.trendingImagePlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="image" size={20} color={colors.textTertiary} />
                  </View>
                )}
                
                <View style={styles.trendingInfo}>
                  <Text style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.trendingPrice, { color: colors.primary }]}>
                    ${item.price.toFixed(2)}
                  </Text>
                  <View style={styles.trendingMeta}>
                    <Ionicons name="trending-up" size={12} color={colors.success} />
                    <Text style={[styles.viewCount, { color: colors.textTertiary }]}>
                      {item.view_count} views
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>
    )
  );

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
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
        {renderHeroBanner()}
        {renderFlashDeals()}
        {renderCategories()}
        {renderFeaturedProducts()}
        {renderNewArrivals()}
        {renderTrendingProducts()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  heroBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  heroImage: {
    marginLeft: 20,
  },
  floatingCard: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  flashBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  flashBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  flashDealsList: {
    paddingLeft: 20,
  },
  flashDealCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  flashDealImageContainer: {
    position: 'relative',
  },
  flashDealImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  flashDealImagePlaceholder: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  flashDealInfo: {
    padding: 12,
  },
  flashDealTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  flashDealPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashDealPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  flashDealOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: (width - 76) / 4,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuredList: {
    paddingLeft: 20,
  },
  featuredCard: {
    width: width * 0.7,
    height: 200,
    marginRight: 16,
  },
  featuredCardContent: {
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    height: '50%',
    justifyContent: 'space-between',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredInfo: {
    gap: 4,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  newArrivalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  newArrivalCardContainer: {
    width: (width - 64) / 2,
  },
  newArrivalCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  newArrivalImage: {
    width: '100%',
    height: 120,
  },
  newArrivalImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newArrivalInfo: {
    padding: 12,
  },
  newArrivalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  newArrivalPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  newArrivalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newArrivalTime: {
    fontSize: 10,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  trendingCardContainer: {
    width: (width - 64) / 2,
  },
  trendingCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendingImage: {
    width: '100%',
    height: 120,
  },
  trendingImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingInfo: {
    padding: 12,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCount: {
    fontSize: 10,
  },
  bottomSpacing: {
    height: 100,
  },
});