import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function PaymentMethodsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

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
        <Text style={[styles.title, { color: colors.text }]}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {/* Coming Soon Card */}
          <Card style={styles.comingSoonCard}>
            <View style={styles.comingSoonContent}>
              <View style={[styles.comingSoonIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="card" size={48} color="#FFFFFF" />
              </View>
              
              <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
                Digital Payments Coming Soon
              </Text>
              
              <Text style={[styles.comingSoonSubtitle, { color: colors.textSecondary }]}>
                We're working on integrating secure digital payment methods to make transactions even easier.
              </Text>

              <View style={styles.featuresPreview}>
                <Text style={[styles.featuresTitle, { color: colors.text }]}>
                  What's Coming:
                </Text>
                
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="phone-portrait" size={20} color={colors.success} />
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      EcoCash Integration
                    </Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <Ionicons name="card" size={20} color={colors.info} />
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      PayNow Support
                    </Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      Secure Escrow Service
                    </Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <Ionicons name="receipt" size={20} color={colors.warning} />
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      Transaction History
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Current Payment Method */}
          <Card style={styles.currentMethodCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Current Payment Method
            </Text>
            
            <View style={styles.currentMethod}>
              <View style={[styles.methodIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="people" size={24} color="#FFFFFF" />
              </View>
              
              <View style={styles.methodDetails}>
                <Text style={[styles.methodTitle, { color: colors.text }]}>
                  Meet in Person
                </Text>
                <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>
                  Safe campus meetups for cash transactions
                </Text>
              </View>
              
              <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
          </Card>

          {/* Safety Guidelines */}
          <Card style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              <Text style={[styles.safetyTitle, { color: colors.text }]}>
                Safety Guidelines
              </Text>
            </View>
            
            <View style={styles.safetyList}>
              <View style={styles.safetyItem}>
                <View style={[styles.safetyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
                  Always meet in public, well-lit campus areas
                </Text>
              </View>
              
              <View style={styles.safetyItem}>
                <View style={[styles.safetyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
                  Bring a friend when possible
                </Text>
              </View>
              
              <View style={styles.safetyItem}>
                <View style={[styles.safetyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
                  Inspect items before payment
                </Text>
              </View>
              
              <View style={styles.safetyItem}>
                <View style={[styles.safetyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
                  Trust your instincts - if something feels wrong, walk away
                </Text>
              </View>
            </View>
          </Card>

          {/* Recommended Meeting Spots */}
          <Card style={styles.spotsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommended Meeting Spots
            </Text>
            
            <View style={styles.spotsList}>
              <View style={styles.spotItem}>
                <Ionicons name="library" size={20} color={colors.primary} />
                <Text style={[styles.spotText, { color: colors.text }]}>
                  University Library
                </Text>
              </View>
              
              <View style={styles.spotItem}>
                <Ionicons name="cafe" size={20} color={colors.primary} />
                <Text style={[styles.spotText, { color: colors.text }]}>
                  Student Center Cafeteria
                </Text>
              </View>
              
              <View style={styles.spotItem}>
                <Ionicons name="school" size={20} color={colors.primary} />
                <Text style={[styles.spotText, { color: colors.text }]}>
                  Main Campus Entrance
                </Text>
              </View>
              
              <View style={styles.spotItem}>
                <Ionicons name="business" size={20} color={colors.primary} />
                <Text style={[styles.spotText, { color: colors.text }]}>
                  Administration Building
                </Text>
              </View>
            </View>
          </Card>

          {/* Notification Preferences */}
          <Card style={styles.notificationCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Get Notified
            </Text>
            <Text style={[styles.notificationText, { color: colors.textSecondary }]}>
              We'll notify you when digital payment methods become available.
            </Text>
            
            <Button
              title="Enable Notifications"
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: 'Notifications Enabled',
                  text2: 'You\'ll be notified when payment methods are available',
                });
              }}
              style={styles.notificationButton}
            />
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
  comingSoonCard: {
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 32,
  },
  comingSoonContent: {
    alignItems: 'center',
  },
  comingSoonIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresPreview: {
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  currentMethodCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  currentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodDetails: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  safetyCard: {
    marginBottom: 20,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  safetyList: {
    gap: 12,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  spotsCard: {
    marginBottom: 20,
  },
  spotsList: {
    gap: 16,
  },
  spotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spotText: {
    fontSize: 16,
    fontWeight: '500',
  },
  notificationCard: {
    marginBottom: 40,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  notificationButton: {
    width: '100%',
  },
});