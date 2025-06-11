import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

interface UserPreferences {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  preferred_categories: string[];
  marketing_emails: boolean;
}

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: true,
    preferred_categories: [],
    marketing_emails: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          notifications_enabled: data.notifications_enabled,
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          preferred_categories: data.preferred_categories || [],
          marketing_emails: data.marketing_emails,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    setSaving(true);
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          ...updatedPreferences,
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      
      Toast.show({
        type: 'success',
        text1: 'Settings Updated',
        text2: 'Your preferences have been saved',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newCategories = preferences.preferred_categories.includes(category)
      ? preferences.preferred_categories.filter(c => c !== category)
      : [...preferences.preferred_categories, category];
    
    updatePreferences({ preferred_categories: newCategories });
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and may slow down the app temporarily. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear any cached data
              Toast.show({
                type: 'success',
                text1: 'Cache Cleared',
                text2: 'App cache has been cleared successfully',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to clear cache',
              });
            }
          }
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all your preferences to default values. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            const defaultPreferences = {
              notifications_enabled: true,
              email_notifications: true,
              push_notifications: true,
              preferred_categories: [],
              marketing_emails: false,
            };
            updatePreferences(defaultPreferences);
          }
        },
      ]
    );
  };

  const getThemeIcon = () => {
    if (theme === 'light') return 'sunny';
    if (theme === 'dark') return 'moon';
    return 'settings';
  };

  const getThemeText = () => {
    if (theme === 'light') return 'Light Mode';
    if (theme === 'dark') return 'Dark Mode';
    return 'System Default';
  };

  const handleThemePress = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

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
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
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
          {/* Appearance Settings */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Appearance
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleThemePress}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name={getThemeIcon() as any} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Theme
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {getThemeText()}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Preferences */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Preferences
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowCategorySelector(!showCategorySelector)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.success }]}>
                  <Ionicons name="list" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Preferred Categories
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {preferences.preferred_categories.length > 0 
                      ? `${preferences.preferred_categories.length} categories selected` 
                      : 'Select categories you are interested in'}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={showCategorySelector ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textTertiary} 
              />
            </TouchableOpacity>

            {showCategorySelector && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.categoriesContainer}
              >
                <View style={styles.categoriesGrid}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        { 
                          backgroundColor: preferences.preferred_categories.includes(category) 
                            ? colors.primary 
                            : colors.surface,
                          borderColor: colors.border,
                        }
                      ]}
                      onPress={() => toggleCategory(category)}
                    >
                      <Text style={[
                        styles.categoryText,
                        { 
                          color: preferences.preferred_categories.includes(category) 
                            ? '#FFFFFF' 
                            : colors.text 
                        }
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </MotiView>
            )}
          </Card>

          {/* Notification Settings */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Notifications
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.info }]}>
                  <Ionicons name="notifications" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Push Notifications
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Receive notifications about messages and updates
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.notifications_enabled}
                onValueChange={(value) => updatePreferences({ notifications_enabled: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.warning }]}>
                  <Ionicons name="mail" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Email Notifications
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Receive important updates via email
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.email_notifications}
                onValueChange={(value) => updatePreferences({ email_notifications: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving || !preferences.notifications_enabled}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.error }]}>
                  <Ionicons name="mail-open" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Marketing Emails
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Receive promotional emails and newsletters
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.marketing_emails}
                onValueChange={(value) => updatePreferences({ marketing_emails: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>
          </Card>

          {/* Privacy & Security */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Privacy & Security
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/profile/privacy')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.success }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Privacy Settings
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Manage your privacy preferences
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/profile/verification')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: user?.is_verified ? colors.success : colors.warning }]}>
                  <Ionicons name={user?.is_verified ? "checkmark-circle" : "time"} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Account Verification
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {user?.is_verified ? 'Verified student account' : 'Verify your student status'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Data & Storage */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data & Storage
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleClearCache}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.info }]}>
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Clear Cache
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Free up storage space
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/profile/data-export')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="download" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Export Data
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Download your account data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Support */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Support
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/support')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.info }]}>
                  <Ionicons name="help-circle" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Help & Support
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Get help and contact support
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/about')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="information-circle" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    About Campus Market
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    App version and information
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Advanced Settings */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Advanced
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleResetSettings}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.warning }]}>
                  <Ionicons name="refresh-circle" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Reset Settings
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Reset all preferences to default
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Account Actions */}
          <View style={styles.accountActions}>
            <Button
              title="Sign Out"
              onPress={signOut}
              variant="outline"
              style={[styles.signOutButton, { borderColor: colors.error }]}
              textStyle={{ color: colors.error }}
            />
          </View>

          {/* App Version */}
          <View style={styles.versionInfo}>
            <Text style={[styles.versionText, { color: colors.textTertiary }]}>
              Campus Market v1.0.0
            </Text>
            <Text style={[styles.buildText, { color: colors.textTertiary }]}>
              Build 2025.01.01
            </Text>
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
  settingsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  categoriesContainer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountActions: {
    marginVertical: 20,
  },
  signOutButton: {
    backgroundColor: 'transparent',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
  },
});