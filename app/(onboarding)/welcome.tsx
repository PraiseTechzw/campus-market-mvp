import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeOnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const features = [
    {
      icon: 'storefront',
      title: 'Buy & Sell',
      description: 'Trade with fellow students safely and easily',
      color: '#34D399',
    },
    {
      icon: 'chatbubbles',
      title: 'Chat Directly',
      description: 'Message sellers and buyers instantly',
      color: '#60A5FA',
    },
    {
      icon: 'shield-checkmark',
      title: 'Verified Users',
      description: 'Student ID verification for trust and safety',
      color: '#F59E0B',
    },
  ];

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        {Array.from({ length: 15 }).map((_, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{
              type: 'timing',
              delay: index * 150,
              duration: 1200,
            }}
            style={[
              styles.patternDot,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              },
            ]}
          />
        ))}
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.content}
      >
        <View style={styles.header}>
          <MotiView
            from={{ scale: 0, rotate: '180deg' }}
            animate={{ scale: 1, rotate: '0deg' }}
            transition={{ type: 'spring', delay: 300, damping: 15 }}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Ionicons name="bag-handle" size={80} color="#FFFFFF" />
              </View>
              <View style={styles.logoGlow} />
            </View>
          </MotiView>
          
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 600, duration: 800 }}
          >
            <Text style={styles.title}>Welcome to{'\n'}Campus Market</Text>
            <Text style={styles.subtitle}>
              Your campus marketplace for buying and selling with fellow students
            </Text>
          </MotiView>
        </View>

        <View style={styles.features}>
          {features.map((feature, index) => (
            <MotiView
              key={feature.title}
              from={{ opacity: 0, translateX: -50 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', delay: 800 + index * 200 }}
              style={styles.feature}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={32} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </MotiView>
          ))}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 1400 }}
          style={styles.actions}
        >
          <Button
            title="Let's Get Started"
            onPress={() => router.push('/(onboarding)/profile-setup')}
            style={[styles.primaryButton, { backgroundColor: '#FFFFFF' }]}
            textStyle={{ color: colors.primary, fontWeight: '700' }}
          />
          
          <Button
            title="Skip for Now"
            onPress={() => router.replace('/(tabs)')}
            variant="outline"
            style={[styles.skipButton, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}
            textStyle={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' }}
          />
        </MotiView>
      </MotiView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: height * 0.12,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  features: {
    gap: 24,
    paddingHorizontal: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  actions: {
    gap: 16,
    paddingHorizontal: 8,
  },
  primaryButton: {
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
  },
});