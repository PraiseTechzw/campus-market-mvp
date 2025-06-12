import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { query, category } = useLocalSearchParams<{ query?: string; category?: string }>();
  
  const [searchQuery, setSearchQuery] = useState<string>(query || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'All');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState<string[]>([
    'iPhone', 'MacBook', 'Textbooks', 'Furniture', 'Bicycle', 'Camera', 'Headphones', 'Laptop'
  ]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (query) {
      searchProducts();
    }
  }, [query, category]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery, selectedCategory]);

  const generateSuggestions = async () => {
    if (searchQuery.length < 2) return;

    try {
      const { data, error } = await supabase
        .rpc('search_products', {
          search_query: searchQuery,
          limit_count: 5
        });

      if (error) throw error;

      const titleSuggestions = data?.map((item: any) => item.title) || [];
      const categorySuggestions = CATEGORIES.filter(cat => 
        cat.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSuggestions([...new Set([...titleSuggestions, ...categorySuggestions])]);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const searchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('search_products', {
          search_query: searchQuery.length > 2 ? searchQuery : undefined,
          category_filter: selectedCategory !== 'All' ? selectedCategory : undefined,
          limit_count: 50
        });

      if (error) throw error;

      // Fetch seller information for each product
      const productIds = data?.map((item: any) => item.id) || [];
      if (productIds.length > 0) {
        const { data: productsWithSellers, error: sellersError } = await supabase
          .from('products')
          .select(`
            *,
            seller:users(*)
          `)
          .in('id', productIds)
          .eq('is_sold', false);

        if (sellersError) throw sellersError;
        
        // Convert the data to match the Product type
        const typedProducts = (productsWithSellers || []).map(product => ({
          ...product,
          condition: product.condition as 'new' | 'used',
          images: product.images || [],
          specifications: product.specifications as Record<string, any> || undefined,
          location: product.location || undefined,
          tags: product.tags || [],
          seller: product.seller
            ? {
                ...product.seller,
                rating_count: product.seller.total_reviews || 0,
                university: product.seller.university ?? null,
                avatar_url: product.seller.avatar_url ?? undefined,
                phone: product.seller.phone ?? undefined,
                rating: product.seller.rating || 0
              }
            : undefined,
        }));
        
        setProducts(typedProducts as Product[]);
      } else {
        setProducts([]);
      }

      // Add to recent searches
      if (searchQuery.length > 2 && !recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.length > 2) {
      searchProducts();
      setSuggestions([]);
    }
  };

  const renderSuggestion = (search: string, type: 'recent' | 'popular', onPress: (s: string) => void) => (
    <TouchableOpacity
      key={search}
      onPress={() => onPress(search)}
      className="flex-row items-center p-3 border-b border-gray-100"
    >
      <Ionicons
        name={type === 'recent' ? 'time-outline' : 'trending-up-outline'}
        size={20}
        color={colors.textTertiary}
      />
      <Text className="ml-3" style={{ color: colors.text }}>{search}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item, index }: { item: Product; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', delay: index * 50 }}
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
              <View style={styles.productHeader}>
                <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={[styles.conditionBadge, { backgroundColor: item.condition === 'new' ? colors.success : colors.warning }]}>
                  <Text style={styles.conditionText}>{item.condition}</Text>
                </View>
              </View>

              <Text style={[styles.productPrice, { color: colors.primary }]}>
                ${item.price.toFixed(2)}
              </Text>

              {item.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.locationText, { color: colors.textTertiary }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              )}

              {item.seller && (
                <View style={styles.sellerInfo}>
                  <Text style={[styles.sellerName, { color: colors.textSecondary }]} numberOfLines={1}>
                    by {item.seller.name}
                  </Text>
                  {item.seller.is_verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}> 
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              )}

              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.tagText, { color: colors.textSecondary }]} numberOfLines={1}>{tag}</Text>
                    </View>
                  ))}
                  {item.tags.length > 2 && (
                    <Text style={[styles.moreTags, { color: colors.textTertiary }]}>
                      +{item.tags.length - 2} more
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View
            style={[
              styles.searchInputContainer,
              { 
                backgroundColor: colors.background, 
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              },
              isFocused && { borderColor: colors.primary, shadowOpacity: 0.12 }
            ]}
          >
            <Ionicons name="search" size={20} color={colors.textTertiary} style={{ marginRight: 6 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search products..."
              placeholderTextColor={colors.textTertiary + '99'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: showFilters ? colors.primary : colors.surface }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons 
              name="options" 
              size={20} 
              color={showFilters ? '#FFFFFF' : colors.text} 
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={styles.filtersContainer}
          >
            <Text style={[styles.filterTitle, { color: colors.text }]}>Categories</Text>
            <View style={styles.categoryFilters}>
              {['All', ...CATEGORIES].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    { 
                      color: selectedCategory === category ? '#FFFFFF' : colors.text 
                    }
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </MotiView>
        )}
      </View>

      <View style={styles.content}>
        {suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface }]}>
            <FlatList
              data={suggestions}
              renderItem={({ item }) => renderSuggestion(item, 'popular', handleSuggestionPress)}
              keyExtractor={(item) => item || ''}
              style={styles.suggestionsList}
            />
          </View>
        )}

        {searchQuery.length === 0 && (
          <View style={styles.emptySearchContainer}>
            <View style={styles.searchSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
              <View style={styles.searchChips}>
                {recentSearches.map((search) => renderSuggestion(search, 'recent', handleSuggestionPress))}
              </View>
            </View>

            <View style={styles.searchSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Searches</Text>
              <View style={styles.searchChips}>
                {popularSearches.map((search) => renderSuggestion(search, 'popular', handleSuggestionPress))}
              </View>
            </View>

            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Search for Products
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Find exactly what you're looking for
              </Text>
            </View>
          </View>
        )}

        {searchQuery.length > 0 && searchQuery.length <= 2 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Keep Typing...
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Type at least 3 characters to search
            </Text>
          </View>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : searchQuery.length > 2 && products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Results Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Try adjusting your search terms or filters
            </Text>
          </View>
        ) : products.length > 0 ? (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {products.length} results for "{searchQuery}"
            </Text>
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    // transition is not supported in RN, but left for reference
    // transition: 'border-color 0.2s',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filtersContainer: {
    marginTop: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  suggestionsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  emptySearchContainer: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  productItem: {
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productContent: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    gap: 6,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 12,
    flex: 1,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
  },
  moreTags: {
    fontSize: 12,
  },
});