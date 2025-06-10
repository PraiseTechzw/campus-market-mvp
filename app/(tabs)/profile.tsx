import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
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
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileStats();
    }
  }, [user]);

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
        averageRating: 4.8, // Mock data - would come from reviews table
        totalReviews: 24, // Mock data - would come from reviews table
        joinedDaysAgo,
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileStats();
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
    setNotificationsEnabled(enabled);
    // In a real app, you'd update user preferences in the database
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
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
          icon: 'shield-checkmark',
          title: 'Verification',
          subtitle: user.is_verified ? 'Verified student' : 'Verify your student status',
          onPress: () => router.push('/profile/verification'),
          badge: user.is_verified ? '✓' : undefined,
          badgeColor: user.is_verified ? colors.success : colors.warning,
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
    {
      title: 'Settings',
      items: [
        {
          icon: 'notifications',
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          onPress: () => {},
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          ),
        },
        {
          icon: getThemeIcon(),
          title: 'Theme',
          subtitle: getThemeText(),
          onPress: toggleTheme,
        },
        {
          icon: 'card',
          title: 'Payment Methods',
          subtitle: 'Manage payment options',
          onPress: () => router.push('/profile/payment-methods'),
        },
        {
          icon: 'location',
          title: 'Addresses',
          subtitle: 'Manage delivery addresses',
          onPress: () => router.push('/profile/addresses'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          onPress: () => router.push('/support'),
        },
        {
          icon: 'document-text',
          title: 'Terms & Privacy',
          subtitle: 'Read our terms and privacy policy',
          onPress: () => router.push('/legal'),
        },
        {
          icon: 'information-circle',
          title: 'About',
          subtitle: 'App version and information',
          onPress: () => router.push('/about'),
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
              <View style={styles.userDetails}>
                <View style={styles.userHeader}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {user.name}
                  </Text>
                  {user.is_verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {user.email}
                </Text>
                {user.university && (
                  <Text style={[styles.university, { color: colors.textSecondary }]}>
                    {user.university}
                  </Text>
                )}
                <Text style={[styles.memberSince, { color: colors.textTertiary }]}>
                  Member for {stats.joinedDaysAgo} days
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

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
                {stats.averageRating}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Rating
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
                            <View style={[styles.badge, { backgroundColor: item.badgeColor || colors.primary }]}>
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
                      {item.rightComponent || (
                        <Ionicons name="chevron-forward\" size={20} color={colors.textTertiary} />
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
              style={[styles.signOutButton, { borderColor: colors.error }]}
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
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
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
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  university: {
    fontSize: 14,
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 12,
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