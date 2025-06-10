import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingCompleteScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.headerGradient}
      />

      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 800 }}
        style={styles.content}
      >
        <View style={styles.celebrationContainer}>
          <MotiView
            from={{ scale: 0, rotate: '180deg' }}
            animate={{ scale: 1, rotate: '0deg' }}
            transition={{ type: 'spring', delay: 300, damping: 15 }}
          >
            <View style={[styles.celebrationIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={64} color="#FFFFFF" />
            </View>
          </MotiView>
          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 600 }}
          >
            <Text style={[styles.title, { color: colors.text }]}>
              You're All Set!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Welcome to Campus Market. Start exploring and connecting with fellow students.
            </Text>
          </MotiView>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 800 }}
          style={styles.featuresContainer}
        >
          <Card style={styles.featuresCard}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              What's Next?
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="search" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    Explore Products
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    Browse products from students at your university
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    List Your Items
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    Start selling items you no longer need
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    Connect & Chat
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    Message buyers and sellers directly
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 1000 }}
          style={styles.actions}
        >
          <Button
            title="Start Exploring"
            onPress={handleGetStarted}
            style={styles.getStartedButton}
          />
        </MotiView>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    height: 200,
  },
  content: {
    flex: 1,
    marginTop: -100,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  celebrationIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featuresCard: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresList: {
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
  },
  getStartedButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});