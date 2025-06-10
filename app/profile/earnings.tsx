import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  totalSales: number;
  averagePrice: number;
  topCategory: string;
}

interface SaleTransaction {
  id: string;
  product_title: string;
  amount: number;
  date: string;
  buyer_name: string;
  category: string;
}

export default function EarningsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    totalSales: 0,
    averagePrice: 0,
    topCategory: '',
  });
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'year'>('all');

  useEffect(() => {
    if (user) {
      fetchEarningsData();
    }
  }, [user, timeFilter]);

  const fetchEarningsData = async () => {
    try {
      // Fetch sold products
      const { data: soldProducts, error } = await supabase
        .from('products')
        .select('id, title, price, category, created_at')
        .eq('seller_id', user?.id)
        .eq('is_sold', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const products = soldProducts || [];
      const totalEarnings = products.reduce((sum, product) => sum + Number(product.price), 0);
      
      // Calculate this month and last month earnings
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthProducts = products.filter(p => new Date(p.created_at) >= thisMonthStart);
      const lastMonthProducts = products.filter(p => {
        const date = new Date(p.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });

      const thisMonth = thisMonthProducts.reduce((sum, p) => sum + Number(p.price), 0);
      const lastMonth = lastMonthProducts.reduce((sum, p) => sum + Number(p.price), 0);

      // Calculate top category
      const categoryCount: Record<string, number> = {};
      products.forEach(p => {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      });
      const topCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b, ''
      );

      setEarnings({
        totalEarnings,
        thisMonth,
        lastMonth,
        totalSales: products.length,
        averagePrice: products.length > 0 ? totalEarnings / products.length : 0,
        topCategory,
      });

      // Mock transaction data with real product info
      const mockTransactions: SaleTransaction[] = products.slice(0, 10).map((product, index) => ({
        id: product.id,
        product_title: product.title,
        amount: Number(product.price),
        date: product.created_at,
        buyer_name: `Student ${index + 1}`,
        category: product.category,
      }));

      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarningsData();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getGrowthPercentage = () => {
    if (earnings.lastMonth === 0) return earnings.thisMonth > 0 ? 100 : 0;
    return ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100;
  };

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
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
        <Text style={[styles.title, { color: colors.text }]}>Earnings</Text>
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
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {/* Total Earnings Card */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.totalEarningsCard}
          >
            <View style={styles.totalEarningsContent}>
              <View style={styles.totalEarningsHeader}>
                <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
                <View style={styles.earningsIcon}>
                  <Ionicons name="cash" size={24} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.totalEarningsAmount}>
                {formatCurrency(earnings.totalEarnings)}
              </Text>
              <View style={styles.earningsGrowth}>
                <Ionicons 
                  name={getGrowthPercentage() >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color="#FFFFFF" 
                />
                <Text style={styles.growthText}>
                  {Math.abs(getGrowthPercentage()).toFixed(1)}% from last month
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(earnings.thisMonth)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                This Month
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.info }]}>
                <Ionicons name="bag" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {earnings.totalSales}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Sales
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
                <Ionicons name="trending-up" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(earnings.averagePrice)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg. Price
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="star" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
                {earnings.topCategory || 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Top Category
              </Text>
            </Card>
          </View>

          {/* Time Filter */}
          <Card style={styles.filterCard}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>
              View Transactions
            </Text>
            <View style={styles.filterButtons}>
              {(['all', 'month', 'year'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: timeFilter === filter ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setTimeFilter(filter)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: timeFilter === filter ? '#FFFFFF' : colors.text }
                  ]}>
                    {filter === 'all' ? 'All Time' : filter === 'month' ? 'This Month' : 'This Year'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Recent Transactions */}
          <Card style={styles.transactionsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Sales
            </Text>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Ionicons name="receipt" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Sales Yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Your sales transactions will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.map((transaction, index) => (
                  <MotiView
                    key={transaction.id}
                    from={{ opacity: 0, translateX: -50 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', delay: index * 100 }}
                  >
                    <View style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: colors.success }]}>
                          <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.transactionDetails}>
                          <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1}>
                            {transaction.product_title}
                          </Text>
                          <Text style={[styles.transactionMeta, { color: colors.textSecondary }]}>
                            Sold to {transaction.buyer_name} • {formatDate(transaction.date)}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.transactionAmount, { color: colors.success }]}>
                        +{formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  </MotiView>
                ))}
              </View>
            )}
          </Card>

          {/* Earnings Tips */}
          <Card style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color={colors.warning} />
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Boost Your Earnings
              </Text>
            </View>
            
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Take high-quality photos of your products
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Write detailed, honest descriptions
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Price competitively by checking similar items
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Respond quickly to messages from buyers
                </Text>
              </View>
            </View>
          </Card>
        </MotiView>
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
  totalEarningsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  totalEarningsContent: {
    alignItems: 'center',
  },
  totalEarningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  totalEarningsLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  earningsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalEarningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  earningsGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  filterCard: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionMeta: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipsCard: {
    marginBottom: 40,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});