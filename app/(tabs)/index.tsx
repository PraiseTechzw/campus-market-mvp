import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [flashDeals, setFlashDeals] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [universityProducts, setUniversityProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAllData();
      setGreetingBasedOnTime();
      fetchUserPreferences();
    }
  }, [user]);

  const setGreetingBasedOnTime = () => {
    const hour = new Date().getHours();
    let greetingText = "";

    if (hour < 12) {
      greetingText = "Good morning";
    } else if (hour < 18) {
      greetingText = "Good afternoon";
    } else {
      greetingText = "Good evening";
    }

    setGreeting(greetingText);
  };

  const fetchUserPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("preferred_categories")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data && data.preferred_categories) {
        setUserPreferences(data.preferred_categories);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    }
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchProducts(),
        fetchFeaturedProducts(),
        fetchTrendingProducts(),
        fetchFlashDeals(),
        fetchNewArrivals(),
        fetchUniversityProducts(),
        fetchRecommendedProducts(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      Toast.show({
        type: "error",
        text1: "Error loading data",
        text2: "Please pull down to refresh",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const mapProductFromDB = (product: any): Product => ({
    ...product,
    condition: product.condition as "new" | "used",
    specifications: product.specifications as Record<string, any>,
    images: product.images ?? [],
    seller: {
      id: product.seller.id,
      email: product.seller.email,
      name: product.seller.name,
      university: product.seller.university ?? undefined,
      avatar_url: product.seller.avatar_url ?? undefined,
      is_verified: product.seller.is_verified,
      phone: product.seller.phone ?? undefined,
      location: product.seller.location ?? undefined,
      rating: product.seller.rating ?? 0,
      total_reviews: product.seller.total_reviews ?? 0,
      total_sales: product.seller.total_sales ?? 0,
      total_earnings: product.seller.total_earnings ?? 0,
      last_active: product.seller.last_active,
      is_online: product.seller.is_online,
      created_at: product.seller.created_at,
      updated_at: product.seller.updated_at,
      bio: product.seller.bio ?? undefined,
      verification_status: product.seller.verification_status,
    },
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data?.map(mapProductFromDB) || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("is_featured", true)
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeaturedProducts(data?.map(mapProductFromDB) || []);
    } catch (error) {
      console.error("Error fetching featured products:", error);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("is_sold", false)
        .order("view_count", { ascending: false })
        .limit(5);

      if (error) throw error;
      setTrendingProducts(data?.map(mapProductFromDB) || []);
    } catch (error) {
      console.error("Error fetching trending products:", error);
    }
  };

  const fetchFlashDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("is_sold", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setFlashDeals(data?.map(mapProductFromDB) || []);
    } catch (error) {
      console.error("Error fetching flash deals:", error);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("is_sold", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setNewArrivals(data?.map(mapProductFromDB) || []);
    } catch (error) {
      console.error("Error fetching new arrivals:", error);
    }
  };

  const fetchUniversityProducts = async () => {
    if (!user?.university) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("is_sold", false)
        .filter("seller.university", "eq", user.university)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setUniversityProducts(data?.map(mapProductFromDB) || []);
    } catch (error) {
      console.error("Error fetching university products:", error);
    }
  };

  const fetchRecommendedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("is_sold", false)
        .order("view_count", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecommendedProducts(data?.map(mapProductFromDB) || []);
    } catch (error) {
      console.error("Error fetching recommended products:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.headerContent}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {greeting},
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/(tabs)/search")}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  { backgroundColor: colors.error },
                ]}
              >
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHeroBanner = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 800 }}
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
              {user?.university ? ` at ${user.university}` : ""}
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

  const renderUniversityProducts = () =>
    universityProducts.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="school" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {user?.university
                ? `From ${user.university}`
                : "From Your University"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/search",
                params: { university: user?.university },
              })
            }
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={universityProducts}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateX: 50 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", delay: index * 100 }}
            >
              <TouchableOpacity
                style={[
                  styles.universityProductCard,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <View style={styles.universityProductImageContainer}>
                  {item.images && item.images.length > 0 ? (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.universityProductImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.universityProductImagePlaceholder,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="image"
                        size={24}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}
                  <View
                    style={[
                      styles.universityBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="school" size={12} color="#FFFFFF" />
                    <Text style={styles.universityBadgeText}>Campus</Text>
                  </View>
                </View>
                <View style={styles.universityProductInfo}>
                  <Text
                    style={[
                      styles.universityProductTitle,
                      { color: colors.text },
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.universityProductPrice,
                      { color: colors.primary },
                    ]}
                  >
                    ${item.price.toFixed(2)}
                  </Text>
                  <View style={styles.universityProductMeta}>
                    <Text
                      style={[
                        styles.universityProductCategory,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {item.category}
                    </Text>
                    <View style={styles.sellerInfo}>
                      <Text
                        style={[
                          styles.sellerName,
                          { color: colors.textSecondary },
                        ]}
                      >
                        by {item.seller.name}
                      </Text>
                      {item.seller.is_verified && (
                        <View
                          style={[
                            styles.verifiedBadge,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons
                            name="checkmark"
                            size={10}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          )}
          keyExtractor={(item) => `university-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.universityProductsList}
        />
      </View>
    );

  const renderRecommendedProducts = () =>
    recommendedProducts.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="thumbs-up" size={20} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommended For You
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/recommended")}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recommendedProducts}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", delay: index * 100 }}
            >
              <TouchableOpacity
                style={styles.recommendedCard}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <Card style={styles.recommendedCardContent}>
                  {item.images && item.images.length > 0 ? (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.recommendedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.recommendedImagePlaceholder,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="image"
                        size={32}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}

                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.recommendedOverlay}
                  >
                    <View
                      style={[
                        styles.recommendedBadge,
                        { backgroundColor: colors.success },
                      ]}
                    >
                      <Ionicons name="thumbs-up" size={12} color="#FFFFFF" />
                      <Text style={styles.recommendedBadgeText}>For You</Text>
                    </View>

                    <View style={styles.recommendedInfo}>
                      <Text style={styles.recommendedTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.recommendedPrice}>
                        ${item.price.toFixed(2)}
                      </Text>
                    </View>
                  </LinearGradient>
                </Card>
              </TouchableOpacity>
            </MotiView>
          )}
          keyExtractor={(item) => `recommended-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendedList}
        />
      </View>
    );

  const renderFlashDeals = () =>
    flashDeals.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="flash" size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Flash Deals
            </Text>
            <View
              style={[styles.flashBadge, { backgroundColor: colors.error }]}
            >
              <Text style={styles.flashBadgeText}>HOT</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/search",
                params: { category: "Flash Deals" },
              })
            }
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={flashDeals}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateX: 50 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", delay: index * 100 }}
            >
              <TouchableOpacity
                 style={[
                  styles.flashDealCard,
                  { backgroundColor: colors.surface },
                ]}
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
                    <View
                      style={[
                        styles.flashDealImagePlaceholder,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="image"
                        size={24}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}
                  <View
                    style={[
                      styles.discountBadge,
                      { backgroundColor: colors.error },
                    ]}
                  >
                    <Text style={styles.discountText}>
                      -{Math.floor(Math.random() * 30 + 10)}%
                    </Text>
                  </View>
                </View>
                <View style={styles.flashDealInfo}>
                  <Text
                    style={[styles.flashDealTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View style={styles.flashDealPricing}>
                    <Text
                      style={[styles.flashDealPrice, { color: colors.error, }]}
                    >
                      ${item.price.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.flashDealOriginalPrice,
                        { color: colors.textTertiary },
                      ]}
                    >
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
    );

  const renderFeaturedProducts = () =>
    featuredProducts.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="star" size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Featured Products
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/featured")}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={featuredProducts}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", delay: index * 100 }}
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
                    <View
                      style={[
                        styles.featuredImagePlaceholder,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="image"
                        size={32}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}

                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.featuredOverlay}
                  >
                    <View
                      style={[
                        styles.featuredBadge,
                        { backgroundColor: colors.warning },
                      ]}
                    >
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
    );

  const renderNewArrivals = () =>
    newArrivals.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="sparkles" size={20} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              New Arrivals
            </Text>
            <View
              style={[styles.newBadge, { backgroundColor: colors.success }]}
            >
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/new-arrivals")}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.newArrivalsGrid}>
          {newArrivals.map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: index * 100 }}
              style={styles.newArrivalCardContainer}
            >
              <TouchableOpacity
                style={[
                  styles.newArrivalCard,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.newArrivalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.newArrivalImagePlaceholder,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name="image"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </View>
                )}

                <View style={styles.newArrivalInfo}>
                  <Text
                    style={[styles.newArrivalTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.newArrivalPrice, { color: colors.primary }]}
                  >
                    ${item.price.toFixed(2)}
                  </Text>
                  <View style={styles.newArrivalMeta}>
                    <Ionicons name="time" size={12} color={colors.success} />
                    <Text
                      style={[
                        styles.newArrivalTime,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {Math.floor(
                        (Date.now() - new Date(item.created_at).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days ago
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>
    );

  const renderTrendingProducts = () =>
    trendingProducts.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="trending-up" size={20} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Trending Now
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/trending")}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trendingGrid}>
          {trendingProducts.slice(0, 6).map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: index * 100 }}
              style={styles.trendingCardContainer}
            >
              <TouchableOpacity
                style={[
                  styles.trendingCard,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.trendingImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.trendingImagePlaceholder,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name="image"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </View>
                )}

                <View style={styles.trendingInfo}>
                  <Text
                    style={[styles.trendingTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.trendingPrice, { color: colors.primary }]}
                  >
                    ${item.price.toFixed(2)}
                  </Text>
                  <View style={styles.trendingMeta}>
                    <Ionicons
                      name="trending-up"
                      size={12}
                      color={colors.success}
                    />
                    <Text
                      style={[styles.viewCount, { color: colors.textTertiary }]}
                    >
                      {item.view_count} views
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>
    );

  const renderCategoryStack = () => (
    <View style={styles.categoryStackContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryStack}
      >
        {CATEGORIES.map((category, index) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryStackItem,
              {
                backgroundColor:
                  selectedCategory === category
                    ? colors.primary
                    : colors.surface,
                borderWidth: 1,
                borderColor:
                  selectedCategory === category
                    ? colors.primary
                    : colors.border,
              },
            ]}
            onPress={() => {
              setSelectedCategory(
                selectedCategory === category ? null : category
              );
            }}
          >
            <View
              style={[
                styles.categoryStackIcon,
                {
                  backgroundColor:
                    selectedCategory === category ? "#FFFFFF" : colors.primary,
                },
              ]}
            >
              <Ionicons
                name={
                  category === "Electronics"
                    ? "phone-portrait"
                    : category === "Books"
                    ? "book"
                    : category === "Fashion"
                    ? "shirt"
                    : category === "Services"
                    ? "construct"
                    : category === "Furniture"
                    ? "bed"
                    : category === "Sports"
                    ? "football"
                    : category === "Beauty"
                    ? "flower"
                    : category === "Food"
                    ? "restaurant"
                    : "ellipsis-horizontal"
                }
                size={24}
                color={
                  selectedCategory === category ? colors.primary : "#FFFFFF"
                }
              />
            </View>
            <Text
              style={[
                styles.categoryStackText,
                {
                  color:
                    selectedCategory === category
                      ? colors.primary
                      : colors.text,
                },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  if (!user) {
    router.replace("/(auth)");
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
        {renderCategoryStack()}
        {selectedCategory ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="grid" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {selectedCategory}
                </Text>
              </View>
            </View>
            <View style={styles.productsGrid}>
              {filteredProducts.map((item, index) => (
                <MotiView
                  key={item.id}
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", delay: index * 100 }}
                  style={styles.productCardContainer}
                >
                  <TouchableOpacity
                    style={[
                      styles.productCard,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => router.push(`/product/${item.id}`)}
                  >
                    {item.images && item.images.length > 0 ? (
                      <Image
                        source={{ uri: item.images[0] }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.productImagePlaceholder,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="image"
                          size={20}
                          color={colors.textTertiary}
                        />
                      </View>
                    )}

                    <View style={styles.productInfo}>
                      <Text
                        style={[styles.productTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[styles.productPrice, { color: colors.primary }]}
                      >
                        ${item.price.toFixed(2)}
                      </Text>
                      <View style={styles.productMeta}>
                        <Text
                          style={[
                            styles.productLocation,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {item.location}
                        </Text>
                        {item.seller.is_verified && (
                          <View
                            style={[
                              styles.verifiedBadge,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={10}
                              color="#FFFFFF"
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          </View>
        ) : (
          <>
            {renderUniversityProducts()}
            {renderRecommendedProducts()}
            {renderFlashDeals()}
            {renderFeaturedProducts()}
            {renderNewArrivals()}
            {renderTrendingProducts()}
          </>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 20,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 16,
  },
  heroImage: {
    marginLeft: 20,
  },
  floatingCard: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  flashBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  flashBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  flashDealsList: {
    paddingLeft: 20,
  },
  flashDealCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  flashDealImageContainer: {
    position: "relative",
  },
  flashDealImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  flashDealImagePlaceholder: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  flashDealInfo: {
    padding: 12,
  },
  flashDealTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  flashDealPricing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flashDealPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  flashDealOriginalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  universityProductsList: {
    paddingLeft: 20,
  },
  universityProductCard: {
    width: 180,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  universityProductImageContainer: {
    position: "relative",
  },
  universityProductImage: {
    width: "100%",
    height: 120,
  },
  universityProductImagePlaceholder: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  universityBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  universityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  universityProductInfo: {
    padding: 12,
  },
  universityProductTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  universityProductPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  universityProductMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  universityProductCategory: {
    fontSize: 10,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sellerName: {
    fontSize: 10,
  },
  verifiedBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendedList: {
    paddingLeft: 20,
  },
  recommendedCard: {
    width: width * 0.7,
    height: 200,
    marginRight: 16,
  },
  recommendedCardContent: {
    padding: 0,
    overflow: "hidden",
    position: "relative",
  },
  recommendedImage: {
    width: "100%",
    height: "100%",
  },
  recommendedImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  recommendedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    height: "50%",
    justifyContent: "space-between",
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  recommendedInfo: {
    gap: 4,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  recommendedPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bottomSpacing: {
    height: 100,
  },
  categoryStackContainer: {
    marginTop: -20,
    marginBottom: 20,
  },
  categoryStack: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryStackItem: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 12,
  },
  categoryStackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryStackText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  trendingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  trendingCardContainer: {
    width: (width - 64) / 2,
  },
  trendingCard: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendingImage: {
    width: "100%",
    height: 120,
  },
  trendingImagePlaceholder: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  trendingInfo: {
    padding: 12,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  trendingPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  trendingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewCount: {
    fontSize: 10,
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
    overflow: "hidden",
    position: "relative",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    height: "50%",
    justifyContent: "space-between",
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  featuredInfo: {
    gap: 4,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  newArrivalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  newArrivalCardContainer: {
    width: (width - 64) / 2,
  },
  newArrivalCard: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  newArrivalImage: {
    width: "100%",
    height: 120,
  },
  newArrivalImagePlaceholder: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  newArrivalInfo: {
    padding: 12,
  },
  newArrivalTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  newArrivalPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  newArrivalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newArrivalTime: {
    fontSize: 10,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  productCardContainer: {
    width: (width - 64) / 2,
  },
  productCard: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImage: {
    width: "100%",
    height: 120,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productLocation: {
    fontSize: 10,
  },
});
