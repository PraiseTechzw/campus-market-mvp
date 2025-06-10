import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CATEGORIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const CATEGORY_ICONS: Record<string, string> = {
  'Electronics': 'phone-portrait',
  'Books': 'book',
  'Fashion': 'shirt',
  'Services': 'construct',
  'Furniture': 'bed',
  'Sports': 'football',
  'Beauty': 'flower',
  'Food': 'restaurant',
  'Other': 'ellipsis-horizontal',
};

export default function PreferencesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleContinue = async () => {
    setLoading(true);
    
    try {
      // In a real app, you'd save preferences to the database
      // For now, we'll just store them locally or skip
      
      Toast.show({
        type: 'success',
        text1: 'Preferences Saved',
        text2: 'Your preferences have been set up successfully',
      });

      router.push('/(onboarding)/verification');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error.message || 'Failed to save preferences',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preferences</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '75%' }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              Step 3 of 4
            </Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              What are you interested in?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Select categories to personalize your experience
            </Text>
          </View>

          <Card style={styles.categoriesCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Product Categories
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Choose categories you're interested in buying or selling
            </Text>
            
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category, index) => (
                <MotiView
                  key={category}
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', delay: index * 100 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: selectedCategories.includes(category) 
                          ? colors.primary 
                          : colors.surface,
                        borderColor: selectedCategories.includes(category)
                          ? colors.primary
                          : colors.border,
                      }
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Ionicons 
                      name={CATEGORY_ICONS[category] as any} 
                      size={24} 
                      color={selectedCategories.includes(category) ? '#FFFFFF' : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.categoryText,
                      {
                        color: selectedCategories.includes(category) ? '#FFFFFF' : colors.text
                      }
                    ]}>
                      {category}
                    </Text>
                    {selectedCategories.includes(category) && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          </Card>

          <Card style={styles.notificationsCard}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Notifications
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Stay updated with new products and messages
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  {
                    backgroundColor: notificationsEnabled ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                <View style={[
                  styles.toggleThumb,
                  {
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: notificationsEnabled ? 20 : 2 }],
                  }
                ]} />
              </TouchableOpacity>
            </View>

            {notificationsEnabled && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.notificationOptions}
              >
                <View style={styles.notificationOption}>
                  <Ionicons name="chatbubbles" size={20} color={colors.primary} />
                  <Text style={[styles.notificationOptionText, { color: colors.text }]}>
                    New messages
                  </Text>
                </View>
                <View style={styles.notificationOption}>
                  <Ionicons name="cube" size={20} color={colors.primary} />
                  <Text style={[styles.notificationOptionText, { color: colors.text }]}>
                    New products in your categories
                  </Text>
                </View>
                <View style={styles.notificationOption}>
                  <Ionicons name="heart" size={20} color={colors.primary} />
                  <Text style={[styles.notificationOptionText, { color: colors.text }]}>
                    Price drops on saved items
                  </Text>
                </View>
              </MotiView>
            )}
          </Card>

          <View style={styles.actions}>
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={loading}
              style={styles.continueButton}
            />
            
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => router.push('/(onboarding)/verification')}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                Skip for now
              </Text>
            </TouchableOpacity>
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  backButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  categoriesCard: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '45%',
    position: 'relative',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationsCard: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationOptions: {
    gap: 16,
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    gap: 16,
    marginBottom: 40,
  },
  continueButton: {
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
});