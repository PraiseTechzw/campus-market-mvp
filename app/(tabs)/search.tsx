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
          seller: {
            ...product.seller,
            rating_count: product.seller.total_reviews || 0,
            university: product.seller.university || undefined,
            avatar_url: product.seller.avatar_url || undefined,
            phone: product.seller.phone || undefined,
            rating: product.seller.rating || 0
          }
        }));
        
        setProducts(typedProducts);
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

              <Text style={[styles.productDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.productMeta}>
                <Text style={[styles.productPrice, { color: colors.primary }]}>
                  ${item.price.toFixed(2)}
                </Text>
                <View style={styles.metaInfo}>
                  <View style={styles.metaItem}>
                    <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                      {item.view_count}
                    </Text>
                  </View>
                  {item.location && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                        {item.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.sellerInfo}>
                <View style={styles.sellerLeft}>
                  <Text style={[styles.sellerName, { color: colors.textSecondary }]}>
                    by {item.seller.name}
                  </Text>
                  {item.seller.is_verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {item.seller.university && (
                  <Text style={[styles.universityText, { color: colors.textTertiary }]}>
                    {item.seller.university}
                  </Text>
                )}
              </View>

              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                    </View>
                  ))}
                  {item.tags.length > 3 && (
                    <Text style={[styles.moreTags, { color: colors.textTertiary }]}>
                      +{item.tags.length - 3} more
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

  const renderSearchChip = (text: string, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.searchChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Text style={[styles.searchChipText, { color: colors.text }]}>{text}</Text>
    </TouchableOpacity>
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
          
          <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search products..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
  searchChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchChipText: {
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  productContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerLeft: {
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
  universityText: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
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