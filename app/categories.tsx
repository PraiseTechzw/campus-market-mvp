import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface CategoryStats {
  category: string;
  count: number;
}

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  const fetchCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_sold', false);

      if (error) throw error;

      const stats = CATEGORIES.map(category => ({
        category,
        count: data?.filter(item => item.category === category).length || 0
      }));

      setCategoryStats(stats);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategoryStats();
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Electronics': 'phone-portrait',
      'Books': 'book',
      'Fashion': 'shirt',
      'Services': 'construct',
      'Furniture': 'bed',
      'Sports': 'football',
      'Beauty': 'flower',
      'Food': 'restaurant',
      'Other': 'ellipsis-horizontal',
    };
    return icons[category] || 'cube';
  };

  const getCategoryColor = (index: number) => {
    const colors_list = [
      colors.primary, colors.info, colors.success, colors.warning,
      colors.error, '#8B5CF6', '#F59E0B', '#10B981', '#6B7280'
    ];
    return colors_list[index % colors_list.length];
  };

  const renderCategoryItem = ({ item, index }: { item: CategoryStats; index: number }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', delay: index * 100 }}
    >
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/(tabs)/search',
          params: { category: item.category }
        })}
        activeOpacity={0.8}
      >
        <Card style={styles.categoryCard}>
          <View style={styles.categoryContent}>
            <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(index) }]}>
              <Ionicons 
                name={getCategoryIcon(item.category) as any} 
                size={32} 
                color="#FFFFFF" 
              />
            </View>
            
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {item.category}
              </Text>
              <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                {item.count} product{item.count !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={categoryStats}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.category}
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
  categoryCard: {
    marginBottom: 16,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
  },
});