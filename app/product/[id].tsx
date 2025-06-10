import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MessagingService } from "@/lib/messaging";
import { supabase } from "@/lib/supabase";
import { Product, Review } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      checkIfSaved();
      incrementViewCount();
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
      fetchReviews();
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setProduct(data as unknown as Product);
    } catch (error) {
      console.error("Error fetching product:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load product details",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users(*)
        `
        )
        .eq("category", product.category)
        .eq("is_sold", false)
        .neq("id", product.id)
        .limit(6);

      if (error) throw error;
      setRelatedProducts(data as unknown as Product[]);
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const fetchReviews = async () => {
    if (!product) return;

    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(
          `
          *,
          reviewer:users(*)
        `
        )
        .eq("seller_id", product.seller_id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data as unknown as Review[]);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("saved_products")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .single();

      if (!error && data) {
        setIsSaved(true);
      }
    } catch (error) {
      // Product not saved, which is fine
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc("increment_view_count", { product_id: id });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const handleSaveProduct = async () => {
    if (!user) {
      router.push("/(auth)");
      return;
    }

    try {
      if (isSaved) {
        const { error } = await supabase
          .from("saved_products")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id);

        if (error) throw error;
        setIsSaved(false);
        Toast.show({
          type: "success",
          text1: "Removed from Saved",
          text2: "Product removed from your saved items",
        });
      } else {
        const { error } = await supabase.from("saved_products").insert({
          user_id: user.id,
          product_id: id,
        });

        if (error) throw error;
        setIsSaved(true);
        Toast.show({
          type: "success",
          text1: "Saved!",
          text2: "Product added to your saved items",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to save product",
      });
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      router.push("/(auth)");
      return;
    }

    if (!product) return;

    if (user.id === product.seller_id) {
      Toast.show({
        type: "info",
        text1: "Your Product",
        text2: "You cannot contact yourself",
      });
      return;
    }

    setContactLoading(true);

    try {
      // Create or get existing chat
      const { data, error } = await MessagingService.createChat(
        user.id,
        product.seller_id,
        product.id
      );

      if (error) throw new Error(error);

      if (data) {
        router.push(`/chat/${data.id}`);
      } else {
        throw new Error("Failed to create chat");
      }
    } catch (error: any) {
      console.error("Error starting chat:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to start conversation",
      });
    } finally {
      setContactLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push("/(auth)");
      return;
    }

    if (!product) return;

    if (user.id === product.seller_id) {
      Toast.show({
        type: "info",
        text1: "Your Product",
        text2: "You cannot buy your own product",
      });
      return;
    }

    setBuyLoading(true);

    Alert.alert(
      "Buy Now",
      `Are you sure you want to buy "${
        product.title
      }" for $${product.price.toFixed(2)}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setBuyLoading(false),
        },
        {
          text: "Buy Now",
          onPress: () => {
            setBuyLoading(false);
            router.push(`/checkout/${product.id}`);
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!product) return;

    try {
      await Share.share({
        message: `Check out this ${product.title} for $${product.price} on Campus Market!`,
        title: product.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleReportProduct = () => {
    setShowReportSheet(true);
  };

  const handleSubmitReport = async (reason: string, details: string) => {
    if (!user || !product) return;

    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_product_id: product.id,
        type: reason,
        reason: reason,
        description: details || `User reported product as ${reason}`,
      });

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: "Report Submitted",
        text2: "Thank you for helping keep our community safe",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to submit report",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !product) return;

    if (reviewRating < 1 || reviewRating > 5) {
      Toast.show({
        type: "error",
        text1: "Invalid Rating",
        text2: "Please select a rating between 1 and 5",
      });
      return;
    }

    setSubmittingReview(true);

    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: product.id,
        reviewer_id: user.id,
        seller_id: product.seller_id,
        rating: reviewRating,
        comment: reviewComment,
        is_verified_purchase: false, // Would be true if there's a completed order
      });

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: "Review Submitted",
        text2: "Thank you for your feedback!",
      });

      // Reset form and hide it
      setReviewRating(5);
      setReviewComment("");
      setShowReviewForm(false);

      // Refresh reviews
      fetchReviews();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to submit review",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const scrollToReviews = () => {
    // Scroll to reviews section
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: height * 0.8, animated: true });
    }
  };

  const renderImageGallery = () => (
    <View style={styles.imageSection}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(index);
        }}
      >
        {product?.images.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageContainer}
            onPress={() =>
              router.push(`/image-viewer/${product.id}?index=${index}`)
            }
          >
            <Image
              source={{ uri: image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {product && product.images.length > 1 && (
        <View style={styles.imageIndicators}>
          {product.images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === currentImageIndex
                      ? colors.primary
                      : colors.border,
                  width: index === currentImageIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}

      <View style={styles.imageBadges}>
        <View
          style={[
            styles.conditionBadge,
            {
              backgroundColor:
                product?.condition === "new" ? colors.success : colors.warning,
            },
          ]}
        >
          <Text style={styles.conditionText}>
            {product?.condition.toUpperCase()}
          </Text>
        </View>
        {product?.is_featured && (
          <View
            style={[styles.featuredBadge, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>

      <View style={styles.imageCounter}>
        <Text style={[styles.imageCounterText, { color: colors.text }]}>
          {currentImageIndex + 1} / {product?.images.length || 0}
        </Text>
      </View>
    </View>
  );

  const renderProductInfo = () => (
    <View style={styles.productInfo}>
      <Card style={styles.infoCard}>
        <View style={styles.productHeader}>
          <View style={styles.productTitleSection}>
            <Text style={[styles.productTitle, { color: colors.text }]}>
              {product?.title}
            </Text>
            <View style={styles.productMeta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="pricetag"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  {product?.category}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="eye" size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  {product?.view_count} views
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  {product && new Date(product.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.priceSection}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              ${product?.price.toFixed(2)}
            </Text>
            <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>
              {product?.condition === "new" ? "Brand New" : "Used"}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Description
        </Text>
        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={showFullDescription ? undefined : 3}
        >
          {product?.description}
        </Text>
        {product && product.description.length > 150 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowFullDescription(!showFullDescription)}
          >
            <Text style={[styles.showMoreText, { color: colors.primary }]}>
              {showFullDescription ? "Show Less" : "Show More"}
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {product?.specifications &&
        Object.keys(product.specifications).length > 0 && (
          <Card style={styles.infoCard}>
            <View style={styles.specHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Specifications
              </Text>
              {Object.keys(product.specifications).length > 4 && (
                <TouchableOpacity
                  onPress={() => setShowAllSpecs(!showAllSpecs)}
                >
                  <Text style={[styles.showAllText, { color: colors.primary }]}>
                    {showAllSpecs ? "Show Less" : "Show All"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.specifications}>
              {Object.entries(product.specifications)
                .slice(0, showAllSpecs ? undefined : 4)
                .map(([key, value]) => (
                  <View
                    key={key}
                    style={[
                      styles.specItem,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.specKey, { color: colors.textSecondary }]}
                    >
                      {key.charAt(0).toUpperCase() +
                        key.slice(1).replace(/([A-Z])/g, " $1")}
                    </Text>
                    <Text style={[styles.specValue, { color: colors.text }]}>
                      {value}
                    </Text>
                  </View>
                ))}
            </View>
          </Card>
        )}

      <Card style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Seller Information
        </Text>
        <TouchableOpacity
          style={styles.sellerInfo}
          onPress={() => router.push(`/seller/${product?.seller.id}`)}
        >
          <View
            style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}
          >
            {product?.seller.avatar_url ? (
              <Image
                source={{ uri: product.seller.avatar_url }}
                style={styles.sellerAvatarImage}
              />
            ) : (
              <Ionicons name="person" size={24} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.sellerDetails}>
            <View style={styles.sellerHeader}>
              <Text style={[styles.sellerName, { color: colors.text }]}>
                {product?.seller.name}
              </Text>
              {product?.seller.is_verified && (
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            {product?.seller.university && (
              <Text
                style={[
                  styles.sellerUniversity,
                  { color: colors.textSecondary },
                ]}
              >
                {product.seller.university}
              </Text>
            )}
            <View style={styles.sellerStats}>
              <Text
                style={[styles.memberSince, { color: colors.textTertiary }]}
              >
                Member since{" "}
                {new Date(product?.seller.created_at || "").getFullYear()}
              </Text>
              <View style={styles.sellerRating}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text
                  style={[styles.ratingText, { color: colors.textSecondary }]}
                >
                  {reviews.length > 0
                    ? (
                        reviews.reduce((sum, r) => sum + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : "0.0"}{" "}
                  ({reviews.length} reviews)
                </Text>
              </View>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </Card>

      {/* Reviews Section */}
      <Card style={styles.infoCard}>
        <View style={styles.reviewsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reviews
          </Text>
          {reviews.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowAllReviews(!showAllReviews)}
            >
              <Text style={[styles.showAllText, { color: colors.primary }]}>
                {showAllReviews ? "Show Less" : "Show All"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {reviews.length === 0 ? (
          <View style={styles.noReviews}>
            <Ionicons
              name="star-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.noReviewsText, { color: colors.textSecondary }]}
            >
              No reviews yet
            </Text>
            {user && user.id !== product?.seller_id && (
              <TouchableOpacity
                style={[
                  styles.addReviewButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setShowReviewForm(true)}
              >
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.reviewsContainer}>
            {reviews
              .slice(0, showAllReviews ? undefined : 2)
              .map((review, index) => (
                <View
                  key={review.id}
                  style={[
                    styles.reviewItem,
                    index < reviews.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <View
                        style={[
                          styles.reviewerAvatar,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        {review.reviewer.avatar_url ? (
                          <Image
                            source={{ uri: review.reviewer.avatar_url }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.reviewerInitial}>
                            {review.reviewer.name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.reviewerDetails}>
                        <Text
                          style={[styles.reviewerName, { color: colors.text }]}
                        >
                          {review.reviewer.name}
                        </Text>
                        <Text
                          style={[
                            styles.reviewDate,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {new Date(review.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? "star" : "star-outline"}
                          size={16}
                          color={colors.warning}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment && (
                    <Text
                      style={[
                        styles.reviewComment,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {review.comment}
                    </Text>
                  )}
                </View>
              ))}

            {reviews.length > 2 && !showAllReviews && (
              <TouchableOpacity
                style={[
                  styles.viewAllReviewsButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => setShowAllReviews(true)}
              >
                <Text
                  style={[styles.viewAllReviewsText, { color: colors.primary }]}
                >
                  View All {reviews.length} Reviews
                </Text>
              </TouchableOpacity>
            )}

            {user && user.id !== product?.seller_id && (
              <TouchableOpacity
                style={[
                  styles.addReviewButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setShowReviewForm(true)}
              >
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.reviewForm}
          >
            <Text style={[styles.reviewFormTitle, { color: colors.text }]}>
              Write a Review
            </Text>

            <View style={styles.ratingSelector}>
              <Text
                style={[styles.ratingLabel, { color: colors.textSecondary }]}
              >
                Rating:
              </Text>
              <View style={styles.starRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                  >
                    <Ionicons
                      name={star <= reviewRating ? "star" : "star-outline"}
                      size={32}
                      color={colors.warning}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={[
                styles.reviewInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Write your review here..."
              placeholderTextColor={colors.textTertiary}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
            />

            <View style={styles.reviewFormButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowReviewForm(false);
                  setReviewRating(5);
                  setReviewComment("");
                }}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </MotiView>
        )}
      </Card>

      {relatedProducts.length > 0 && (
        <Card style={styles.infoCard}>
          <View style={styles.relatedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Related Products
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/search",
                  params: { category: product?.category },
                })
              }
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.relatedProducts}>
              {relatedProducts.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.relatedProductCard,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => router.push(`/product/${item.id}`)}
                >
                  {item.images && item.images.length > 0 ? (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.relatedProductImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.relatedProductImagePlaceholder,
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
                  <View style={styles.relatedProductInfo}>
                    <Text
                      style={[
                        styles.relatedProductTitle,
                        { color: colors.text },
                      ]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.relatedProductPrice,
                        { color: colors.primary },
                      ]}
                    >
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>
      )}

      {/* Safety Tips */}
      <Card style={styles.safetyCard}>
        <View style={styles.safetyHeader}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <Text style={[styles.safetyTitle, { color: colors.text }]}>
            Safety Tips
          </Text>
        </View>

        <View style={styles.safetyList}>
          <View style={styles.safetyItem}>
            <View
              style={[styles.safetyBullet, { backgroundColor: colors.success }]}
            />
            <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
              Meet in public, well-lit campus areas
            </Text>
          </View>

          <View style={styles.safetyItem}>
            <View
              style={[styles.safetyBullet, { backgroundColor: colors.success }]}
            />
            <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
              Inspect the item before payment
            </Text>
          </View>

          <View style={styles.safetyItem}>
            <View
              style={[styles.safetyBullet, { backgroundColor: colors.success }]}
            />
            <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
              Consider bringing a friend for added security
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Product Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            This product may have been removed or doesn't exist
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  const isOwnProduct = user?.id === product.seller_id;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Ionicons name="share-social" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleSaveProduct}
            >
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={24}
                color={isSaved ? colors.error : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleReportProduct}
            >
              <Ionicons name="flag" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderImageGallery()}
          {renderProductInfo()}
        </ScrollView>

        {!isOwnProduct ? (
          <View
            style={[
              styles.actionBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.contactButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleContactSeller}
              disabled={contactLoading}
            >
              {contactLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name="chatbubble"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.contactButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Chat
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Button
              title="Buy Now"
              onPress={handleBuyNow}
              loading={buyLoading}
              style={styles.buyButton}
            />
          </View>
        ) : (
          <View
            style={[
              styles.actionBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/product/edit/${product.id}`)}
            >
              <Ionicons name="create" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={() => {
                Alert.alert(
                  "Delete Listing",
                  "Are you sure you want to delete this listing?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          const { error } = await supabase
                            .from("products")
                            .delete()
                            .eq("id", product.id);

                          if (error) throw error;

                          Toast.show({
                            type: "success",
                            text1: "Listing Deleted",
                            text2: "Your listing has been deleted successfully",
                          });

                          router.replace("/(tabs)");
                        } catch (error: any) {
                          Toast.show({
                            type: "error",
                            text1: "Error",
                            text2: error.message || "Failed to delete listing",
                          });
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showReportSheet}
          animationType="slide"
          transparent
          onRequestClose={() => setShowReportSheet(false)}
        >
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: "rgba(0, 0, 0, 0.5)" },
            ]}
          >
            <MotiView
              from={{ translateY: 1000 }}
              animate={{ translateY: 0 }}
              exit={{ translateY: 1000 }}
              transition={{ type: "timing", duration: 300 }}
              style={[styles.sheet, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.sheetHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  Report Product
                </Text>
                <TouchableOpacity
                  onPress={() => setShowReportSheet(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sheetContent}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Why are you reporting this product?
                </Text>

                <View style={styles.reasonsList}>
                  {[
                    {
                      id: "inappropriate",
                      label: "Inappropriate Content",
                      icon: "warning",
                    },
                    { id: "fake", label: "Fake Product", icon: "close-circle" },
                    { id: "spam", label: "Spam", icon: "mail" },
                    {
                      id: "other",
                      label: "Other",
                      icon: "ellipsis-horizontal",
                    },
                  ].map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonItem,
                        {
                          backgroundColor:
                            selectedReason === reason.id
                              ? colors.primary + "20"
                              : colors.surface,
                          borderColor:
                            selectedReason === reason.id
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedReason(reason.id)}
                    >
                      <View style={styles.reasonLeft}>
                        <View
                          style={[
                            styles.reasonIcon,
                            { backgroundColor: colors.primary + "20" },
                          ]}
                        >
                          <Ionicons
                            name={reason.icon as any}
                            size={20}
                            color={colors.primary}
                          />
                        </View>
                        <Text
                          style={[styles.reasonLabel, { color: colors.text }]}
                        >
                          {reason.label}
                        </Text>
                      </View>
                      {selectedReason === reason.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedReason && (
                  <View style={styles.detailsContainer}>
                    <Text style={[styles.detailsLabel, { color: colors.text }]}>
                      Additional Details (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.detailsInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="Please provide any additional information that will help us understand the issue..."
                      placeholderTextColor={colors.textTertiary}
                      value={details}
                      onChangeText={setDetails}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                )}
              </ScrollView>

              <View
                style={[styles.sheetFooter, { borderTopColor: colors.border }]}
              >
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowReportSheet(false)}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: selectedReason
                        ? colors.primary
                        : colors.border,
                      opacity: selectedReason ? 1 : 0.5,
                    },
                  ]}
                  onPress={() => handleSubmitReport(selectedReason!, details)}
                  disabled={!selectedReason || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </MotiView>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    zIndex: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,

  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    position: "relative",
  },
  imageContainer: {
    marginTop: 110,
    width: width,
    height: 300,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  imageBadges: {
    position: "absolute",
    top: 16,
    right: 16,
    gap: 8,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-end",
  },
  conditionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: "flex-end",
  },
  featuredText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  productInfo: {
    padding: 20,
    gap: 16,
  },
  infoCard: {
    marginBottom: 0,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productTitleSection: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 30,
  },
  productMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  priceSection: {
    alignItems: "flex-end",
  },
  productPrice: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  showMoreButton: {
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  specHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  specifications: {
    gap: 12,
  },
  specItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  specKey: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  sellerAvatarImage: {
    width: "100%",
    height: "100%",
  },
  sellerDetails: {
    flex: 1,
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerUniversity: {
    fontSize: 14,
    marginBottom: 4,
  },
  sellerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberSince: {
    fontSize: 12,
  },
  sellerRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  noReviews: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noReviewsText: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  addReviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addReviewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  reviewsContainer: {
    gap: 16,
  },
  reviewItem: {
    paddingBottom: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  reviewerInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewAllReviewsButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 8,
  },
  viewAllReviewsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    overflow: "hidden",
  },
  reviewFormTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  ratingSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    marginRight: 12,
  },
  starRating: {
    flexDirection: "row",
    gap: 4,
  },
  reviewInput: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  reviewFormButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  relatedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  relatedProducts: {
    flexDirection: "row",
    gap: 12,
  },
  relatedProductCard: {
    width: 120,
    borderRadius: 8,
    overflow: "hidden",
  },
  relatedProductImage: {
    width: "100%",
    height: 80,
  },
  relatedProductImagePlaceholder: {
    width: "100%",
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  relatedProductInfo: {
    padding: 8,
  },
  relatedProductTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  relatedProductPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  safetyCard: {
    marginBottom: 100,
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  safetyList: {
    gap: 12,
  },
  safetyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  safetyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  safetyText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actionBar: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buyButton: {
    flex: 2,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  sheetContent: {
    padding: 20,
  },
  reasonsList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  detailsContainer: {
    marginTop: 24,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  detailsInput: {
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  sheetFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
});
