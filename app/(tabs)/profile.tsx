import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

interface ProfileStats {
  totalProducts: number;
  soldProducts: number;
  savedProducts: number;
  totalOrders: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  joinedDaysAgo: number;
  unreadMessages: number;
  unreadNotifications: number;
}

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
  rightComponent?: React.ReactNode;
}

interface VerificationStatus {
  is_verified: boolean;
  profile_complete: boolean;
}

export default function ProfileScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { user, signOut, updateProfile } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<ProfileStats>({
    totalProducts: 0,
    soldProducts: 0,
    savedProducts: 0,
    totalOrders: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    joinedDaysAgo: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    is_verified: false,
    profile_complete: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfileStats();
      fetchVerificationStatus();
      fetchUserPreferences();
    }
  }, [user]);

  const fetchVerificationStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_verified')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setVerificationStatus({
          is_verified: data.is_verified || false,
          profile_complete: true // This will be updated when we add the profile_complete column
        });
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const fetchUserPreferences = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notifications_enabled')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setNotificationsEnabled(data.notifications_enabled);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const fetchProfileStats = async () => {
    if (!user) return;

    try {
      // Fetch user's products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, is_sold, price')
        .eq('seller_id', user.id);

      if (productsError) throw productsError;

      // Fetch saved products
      const { data: savedProducts, error: savedError } = await supabase
        .from('saved_products')
        .select('id')
        .eq('user_id', user.id);

      if (savedError) throw savedError;

      // Fetch orders (both buying and selling)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (ordersError) throw ordersError;

      // Fetch reviews and rating
      const { data: reviews, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('seller_id', user.id);

      if (reviewsError) throw reviewsError;

      // Calculate average rating and total reviews
      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

      // Fetch unread message count
      const { data: unreadMessages, error: messagesError } = await supabase.rpc(
        'get_unread_message_count',
        { user_id: user.id }
      );
      
      if (messagesError) throw messagesError;

      // Fetch unread notification count
      const { data: unreadNotifications, error: notificationsError } = await supabase.rpc(
        'get_unread_notification_count',
        { user_id: user.id }
      );
      
      if (notificationsError) throw notificationsError;

      // Calculate stats
      const totalProducts = products?.length || 0;
      const soldProducts = products?.filter(p => p.is_sold).length || 0;
      const totalEarnings = products?.filter(p => p.is_sold).reduce((sum, p) => sum + Number(p.price), 0) || 0;
      const joinedDaysAgo = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

      setStats({
        totalProducts,
        soldProducts,
        savedProducts: savedProducts?.length || 0,
        totalOrders: orders?.length || 0,
        totalEarnings,
        averageRating,
        totalReviews,
        joinedDaysAgo,
        unreadMessages: unreadMessages || 0,
        unreadNotifications: unreadNotifications || 0,
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileStats();
    fetchVerificationStatus();
    fetchUserPreferences();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (!user?.id) return;
    
    setNotificationsEnabled(enabled);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notifications_enabled: enabled,
          push_notifications: enabled,
        });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Settings Updated',
        text2: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const getThemeIcon = () => {
    if (theme === 'light') return 'sunny';
    if (theme === 'dark') return 'moon';
    return 'settings';
  };

  const getThemeText = () => {
    if (theme === 'light') return 'Light Mode';
    if (theme === 'dark') return 'Dark Mode';
    return 'System';
  };

  const getVerificationStatusText = () => {
    if (verificationStatus.is_verified) {
      return 'Verified student';
    }
    
    if (!verificationStatus.is_verified) {
      return 'Verification pending';
    }
    
    return 'Verify your student status';
  };

  const getVerificationIcon = () => {
    if (verificationStatus.is_verified) {
      return 'checkmark-circle';
    }
    
    if (!verificationStatus.is_verified) {
      return 'time';
    }
    
    return 'shield-checkmark';
  };

  const getVerificationColor = () => {
    if (verificationStatus.is_verified) {
      return colors.success;
    }
    
    if (!verificationStatus.is_verified) {
      return colors.warning;
    }
    
    return colors.warning;
  };

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'create',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          onPress: () => router.push('/profile/edit'),
        },
        {
          icon: getVerificationIcon(),
          title: 'Verification',
          subtitle: getVerificationStatusText(),
          onPress: () => router.push('/profile/verification'),
          badge: verificationStatus.is_verified ? '✓' : undefined,
          badgeColor: getVerificationColor(),
        },
        {
          icon: 'lock-closed',
          title: 'Privacy & Security',
          subtitle: 'Manage your privacy settings',
          onPress: () => router.push('/profile/privacy'),
        },
      ],
    },
    {
      title: 'Activity',
      items: [
        {
          icon: 'cube',
          title: 'My Listings',
          subtitle: `${stats.totalProducts} products (${stats.soldProducts} sold)`,
          onPress: () => router.push('/profile/listings'),
          badge: stats.totalProducts > 0 ? stats.totalProducts.toString() : undefined,
        },
        {
          icon: 'heart',
          title: 'Saved Items',
          subtitle: `${stats.savedProducts} saved products`,
          onPress: () => router.push('/profile/saved'),
          badge: stats.savedProducts > 0 ? stats.savedProducts.toString() : undefined,
        },
        {
          icon: 'receipt',
          title: 'Orders',
          subtitle: `${stats.totalOrders} total orders`,
          onPress: () => router.push('/profile/orders'),
          badge: stats.totalOrders > 0 ? stats.totalOrders.toString() : undefined,
        },
        {
          icon: 'star',
          title: 'Reviews',
          subtitle: `${stats.averageRating} rating (${stats.totalReviews} reviews)`,
          onPress: () => router.push('/profile/reviews'),
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/profile/settings')}
        >
          <Ionicons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
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
          {/* User Info Card */}
          <Card style={styles.userCard}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => router.push('/profile/edit')}
            >
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                      <Ionicons name="person" size={32} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="create" size={12} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.verificationStatus}>
                  {verificationStatus.is_verified ? (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.warning }]}>
                      <Ionicons name="time" size={12} color="#FFFFFF" />
                      <Text style={styles.verifiedText}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user.name}
                </Text>
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="mail" size={16} color={colors.textTertiary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>

                  {user.university && (
                    <View style={styles.infoItem}>
                      <Ionicons name="school" size={16} color={colors.textTertiary} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {user.university}
                      </Text>
                    </View>
                  )}

                  {user.phone && (
                    <View style={styles.infoItem}>
                      <Ionicons name="call" size={16} color={colors.textTertiary} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {user.phone}
                      </Text>
                    </View>
                  )}

                  <View style={styles.infoItem}>
                    <Ionicons name="time" size={16} color={colors.textTertiary} />
                    <Text style={[styles.infoText, { color: colors.textTertiary }]}>
                      {stats.joinedDaysAgo} days
                    </Text>
                  </View>
                </View>

                {user.bio && (
                  <View style={styles.bioSection}>
                    <Ionicons name="document-text" size={16} color={colors.textTertiary} />
                    <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
                      {user.bio}
                    </Text>
                  </View>
                )}
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Verification Alert */}
          {!verificationStatus.is_verified && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <Card style={{ ...styles.verificationCard, borderColor: getVerificationColor() }}>
                <View style={styles.verificationContent}>
                  <View style={[styles.verificationIcon, { backgroundColor: getVerificationColor() }]}>
                    <Ionicons name={getVerificationIcon() as any} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.verificationInfo}>
                    <Text style={[styles.verificationTitle, { color: colors.text }]}>
                      {!verificationStatus.is_verified 
                        ? 'Verification Required' 
                        : 'Complete Your Verification'}
                    </Text>
                    <Text style={[styles.verificationText, { color: colors.textSecondary }]}>
                      {!verificationStatus.is_verified 
                        ? 'Please verify your student status to access all features' 
                        : 'Verify your student status to build trust with other users'}
                    </Text>
                  </View>
                </View>
                <Button
                  title={!verificationStatus.is_verified ? "Verify Student Status" : "Complete Verification"}
                  onPress={() => router.push('/profile/verification')}
                  style={{ ...styles.verificationButton, backgroundColor: getVerificationColor() }}
                />
              </Card>
            </MotiView>
          )}

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="cube" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.totalProducts}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Products
              </Text>
            </Card>
            
            <Card style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.soldProducts}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sold
              </Text>
            </Card>
            
            <Card style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
                <Ionicons name="star" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Rating ({stats.totalReviews})
              </Text>
            </Card>
          </View>

          {/* Earnings Card */}
          <Card style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <View style={[styles.earningsIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="cash" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.earningsInfo}>
                <Text style={[styles.earningsTitle, { color: colors.text }]}>
                  Total Earnings
                </Text>
                <Text style={[styles.earningsAmount, { color: colors.success }]}>
                  ${stats.totalEarnings.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.earningsButton, { backgroundColor: colors.success }]}
                onPress={() => router.push('/profile/earnings')}
              >
                <Text style={styles.earningsButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
              <Card>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.title}
                    style={[
                      styles.menuItem,
                      itemIndex < section.items.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
                        <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
                      </View>
                      <View style={styles.menuItemContent}>
                        <View style={styles.menuItemHeader}>
                          <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                            {item.title}
                          </Text>
                          {item.badge && (
                            <View style={[styles.badge, { backgroundColor: (item as MenuItem).badgeColor || colors.primary }]}>
                              <Text style={styles.badgeText}>{item.badge}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.menuItemRight}>
                      {(item as MenuItem).rightComponent || (
                        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          ))}

          {/* Sign Out Button */}
          <View style={styles.signOutSection}>
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              style={{ ...styles.signOutButton, borderColor: colors.error }}
              textStyle={{ color: colors.error }}
            />
          </View>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    marginBottom: 20,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarSection: {
    marginRight: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verificationStatus: {
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
    paddingRight: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: '45%',
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  bioSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  verificationCard: {
    marginBottom: 20,
    borderLeftWidth: 4,
    paddingVertical: 12,
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  verificationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  verificationButton: {
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
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
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  earningsCard: {
    marginBottom: 24,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  earningsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  earningsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuItemSubtitle: {
    fontSize: 12,
  },
  menuItemRight: {
    marginLeft: 12,
  },
  signOutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  signOutButton: {
    backgroundColor: 'transparent',
  },
});