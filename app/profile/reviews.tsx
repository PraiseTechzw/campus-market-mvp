import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  product_title: string;
  created_at: string;
}

export default function ReviewsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      // Mock data - in a real app, you'd fetch from your reviews table
      const mockReviews: Review[] = [
        {
          id: '1',
          rating: 5,
          comment: 'Great seller! Item was exactly as described and shipped quickly.',
          reviewer_name: 'John Doe',
          product_title: 'iPhone 13 Pro',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          rating: 4,
          comment: 'Good condition, fair price. Would buy again.',
          reviewer_name: 'Jane Smith',
          product_title: 'MacBook Air M1',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          rating: 5,
          comment: 'Excellent communication and fast delivery. Highly recommended!',
          reviewer_name: 'Mike Johnson',
          product_title: 'Calculus Textbook',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setReviews(mockReviews);
      
      // Calculate average rating
      const avg = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length;
      setAverageRating(avg);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color={colors.warning}
      />
    ));
  };

  const renderReviewItem = ({ item, index }: { item: Review; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', delay: index * 100 }}
    >
      <Card style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.reviewerInitial}>
                {item.reviewer_name.charAt(0)}
              </Text>
            </View>
            <View style={styles.reviewerDetails}>
              <Text style={[styles.reviewerName, { color: colors.text }]}>
                {item.reviewer_name}
              </Text>
              <Text style={[styles.productTitle, { color: colors.textSecondary }]}>
                {item.product_title}
              </Text>
            </View>
          </View>
          <View style={styles.reviewMeta}>
            <View style={styles.rating}>
              {renderStars(item.rating)}
            </View>
            <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
          {item.comment}
        </Text>
      </Card>
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
        <Text style={[styles.title, { color: colors.text }]}>Reviews</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Rating Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.ratingDisplay}>
            <Text style={[styles.averageRating, { color: colors.text }]}>
              {averageRating.toFixed(1)}
            </Text>
            <View style={styles.starsContainer}>
              {renderStars(Math.round(averageRating))}
            </View>
            <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.ratingBreakdown}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <View key={star} style={styles.ratingRow}>
                  <Text style={[styles.starLabel, { color: colors.textSecondary }]}>
                    {star}
                  </Text>
                  <Ionicons name="star" size={12} color={colors.warning} />
                  <View style={[styles.ratingBar, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.ratingBarFill, 
                        { backgroundColor: colors.warning, width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.ratingCount, { color: colors.textTertiary }]}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Card>

      <View style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="star" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Reviews Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Reviews from buyers will appear here after completed transactions
            </Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
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
  summaryCard: {
    margin: 20,
  },
  summaryContent: {
    flexDirection: 'row',
    gap: 24,
  },
  ratingDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
  },
  ratingBreakdown: {
    flex: 2,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starLabel: {
    fontSize: 12,
    width: 8,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 12,
    width: 16,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 14,
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
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