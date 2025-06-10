import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { MotiText, MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index ?? 0);
    }
  }).current;
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  useEffect(() => {
    if (!loading && user) {
      if (!user.university) {
        router.replace('/(onboarding)/welcome');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading]);

  useEffect(() => {
    // Continuous pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.loadingContainer}
        >
          <Animated.View 
            style={[
              styles.loadingLogo,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a24']}
              style={styles.logoGradient}
            >
              <Ionicons name="bag-handle" size={48} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
            style={styles.loadingText}
          >
            Campus Market
          </MotiText>
          <MotiView
            from={{ width: 0 }}
            animate={{ width: 200 }}
            transition={{ delay: 600, duration: 1000 }}
            style={styles.loadingBar}
          />
        </MotiView>
      </LinearGradient>
    );
  }

  const features = [
    { 
      icon: 'people', 
      title: 'Student Community', 
      desc: 'Connect with verified students from your campus safely and securely',
      color: '#ff6b6b'
    },
    { 
      icon: 'chatbubbles', 
      title: 'Instant Messaging', 
      desc: 'Chat with buyers and sellers in real-time with built-in notifications',
      color: '#4ecdc4'
    },
    { 
      icon: 'shield-checkmark', 
      title: 'Verified & Secure', 
      desc: 'Student ID verification ensures trust and safety in every transaction',
      color: '#45b7d1'
    },
  ];

  const pages = [
    // Welcome Page
    {
      id: 'welcome',
      render: () => (
        <View style={styles.pageContainer}>
          <Animated.View 
            style={[
              styles.logoContainer,
              { 
                transform: [
                  { scale: pulseAnim },
                  { translateY: floatAnim }
                ] 
              }
            ]}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a24']}
              style={styles.logoGradient}
            >
              <Ionicons name="bag-handle" size={isSmallScreen ? 60 : 80} color="#FFFFFF" />
            </LinearGradient>
            
            {/* Ripple effect */}
            <MotiView
              from={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ 
                type: 'timing', 
                duration: 2000, 
                loop: true,
                delay: 1000 
              }}
              style={styles.ripple}
            />
          </Animated.View>

          <MotiText
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 400, type: 'spring' }}
            style={styles.title}
          >
            Campus Market
          </MotiText>
          
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 600 }}
            style={styles.subtitle}
          >
            Your trusted marketplace for buying and selling with fellow students
          </MotiText>

          {/* Stats */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 800 }}
            style={styles.statsContainer}
          >
            <View style={styles.stat}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Universities</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>99%</Text>
              <Text style={styles.statLabel}>Safe Trades</Text>
            </View>
          </MotiView>
        </View>
      )
    },
    
    // Feature 1
    {
      id: 'feature1',
      render: () => (
        <View style={styles.pageContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.featurePageContent}
          >
            <View style={[styles.featureIconLarge, { backgroundColor: features[0].color }]}>
              <Ionicons name={features[0].icon as any} size={60} color="#FFFFFF" />
            </View>
            
            <Text style={styles.featurePageTitle}>{features[0].title}</Text>
            <Text style={styles.featurePageDesc}>{features[0].desc}</Text>
            
            <MotiView
              from={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              style={styles.featureIllustration}
            >
              <View style={styles.illustrationContainer}>
                <View style={styles.userCircle}>
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.connectionLine} />
                <View style={styles.userCircle}>
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.connectionLine} />
                <View style={styles.userCircle}>
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
              </View>
            </MotiView>
          </MotiView>
        </View>
      )
    },
    
    // Feature 2
    {
      id: 'feature2',
      render: () => (
        <View style={styles.pageContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.featurePageContent}
          >
            <View style={[styles.featureIconLarge, { backgroundColor: features[1].color }]}>
              <Ionicons name={features[1].icon as any} size={60} color="#FFFFFF" />
            </View>
            
            <Text style={styles.featurePageTitle}>{features[1].title}</Text>
            <Text style={styles.featurePageDesc}>{features[1].desc}</Text>
            
            <MotiView
              from={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              style={styles.featureIllustration}
            >
              <View style={styles.chatIllustration}>
                <View style={styles.chatBubble}>
                  <Text style={styles.chatText}>Hi! Is this still available?</Text>
                </View>
                <View style={[styles.chatBubble, styles.chatBubbleRight]}>
                  <Text style={styles.chatText}>Yes! When can you meet?</Text>
                </View>
              </View>
            </MotiView>
          </MotiView>
        </View>
      )
    },
    
    // Feature 3
    {
      id: 'feature3',
      render: () => (
        <View style={styles.pageContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.featurePageContent}
          >
            <View style={[styles.featureIconLarge, { backgroundColor: features[2].color }]}>
              <Ionicons name={features[2].icon as any} size={60} color="#FFFFFF" />
            </View>
            
            <Text style={styles.featurePageTitle}>{features[2].title}</Text>
            <Text style={styles.featurePageDesc}>{features[2].desc}</Text>
            
            <MotiView
              from={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              style={styles.featureIllustration}
            >
              <View style={styles.securityIllustration}>
                <View style={styles.idCard}>
                  <Ionicons name="school" size={24} color="#FFFFFF" />
                  <Text style={styles.idText}>Student ID</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={40} color="#4ecdc4" />
                </View>
              </View>
            </MotiView>
          </MotiView>
        </View>
      )
    },
    
    // Get Started
    {
      id: 'getStarted',
      render: () => (
        <View style={styles.pageContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.getStartedContent}
          >
            <Ionicons name="rocket" size={80} color="#FFFFFF" />
            
            <Text style={styles.getStartedTitle}>Ready to get started?</Text>
            <Text style={styles.getStartedDesc}>
              Join thousands of students already trading safely on Campus Market
            </Text>
            
            <View style={styles.buttonContainer}>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#ff6b6b', '#ee5a24']}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
              
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Already have an account?</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </MotiView>
        </View>
      )
    },
  ];

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
      flatListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      flatListRef.current?.scrollToIndex({ index: currentPage - 1, animated: true });
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd, colors.accent]}
      locations={[0, 0.6, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Floating background elements */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 1000 }}
        style={styles.backgroundElements}
      >
        {[...Array(6)].map((_, i) => (
          <MotiView
            key={i}
            from={{ scale: 0, rotate: '0deg' }}
            animate={{ scale: 1, rotate: '360deg' }}
            transition={{ 
              type: 'timing', 
              duration: 20000 + i * 5000, 
              delay: i * 1000,
              loop: true 
            }}
            style={[
              styles.floatingElement,
              {
                top: Math.random() * height * 0.8,
                left: Math.random() * width * 0.8,
              }
            ]}
          />
        ))}
      </MotiView>

      <FlatList
        ref={flatListRef}
        data={pages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => item.render()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEnabled={false}
      />

      {/* Navigation Controls */}
      <View style={styles.navigationControls}>
        {currentPage > 0 && (
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: colors.glassMorphism }]} 
            onPress={goToPrevPage}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        
        <View style={styles.progressIndicators}>
          {pages.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.progressDot,
                currentPage === index && [styles.activeProgressDot, { backgroundColor: colors.text }]
              ]}
              onPress={() => {
                setCurrentPage(index);
                flatListRef.current?.scrollToIndex({ index, animated: true });
              }}
            />
          ))}
        </View>
        
        {currentPage < pages.length - 1 && (
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: colors.glassMorphism }]} 
            onPress={goToNextPage}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {currentPage < pages.length - 1 && (
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => {
            setCurrentPage(pages.length - 1);
            flatListRef.current?.scrollToIndex({ index: pages.length - 1, animated: true });
          }}
        >
          <Text style={[styles.skipText, { color: colors.text }]}>Skip</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  loadingBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  pageContainer: {
    width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  ripple: {
    position: 'absolute',
    top: -25,
    left: -25,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: isSmallScreen ? 28 : 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
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
  navigationControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeProgressDot: {
    width: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  featurePageContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  featureIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  featurePageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  featurePageDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featureIllustration: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  illustrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  chatIllustration: {
    width: '100%',
  },
  chatBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  chatBubbleRight: {
    backgroundColor: 'rgba(255, 107, 107, 0.6)',
    alignSelf: 'flex-end',
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  securityIllustration: {
    alignItems: 'center',
    position: 'relative',
  },
  idCard: {
    width: 150,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  idText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  getStartedContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  getStartedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 32,
    marginBottom: 16,
    textAlign: 'center',
  },
  getStartedDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 16,
    width: 280,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
});