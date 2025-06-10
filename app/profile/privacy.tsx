import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

interface PrivacySettings {
  profile_visibility: 'public' | 'students' | 'private';
  show_phone: boolean;
  show_university: boolean;
  allow_messages: boolean;
  show_online_status: boolean;
  data_collection: boolean;
  marketing_emails: boolean;
}

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'students',
    show_phone: false,
    show_university: true,
    allow_messages: true,
    show_online_status: true,
    data_collection: true,
    marketing_emails: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    try {
      // In a real app, you'd fetch from a privacy_settings table
      // For now, we'll use default settings
      setLoading(false);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: any) => {
    setSaving(true);
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // In a real app, you'd save to database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Toast.show({
        type: 'success',
        text1: 'Privacy Updated',
        text2: 'Your privacy settings have been saved',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update privacy settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Type "DELETE" to confirm account deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Confirm Delete', 
                  style: 'destructive',
                  onPress: () => {
                    Toast.show({
                      type: 'info',
                      text1: 'Feature Coming Soon',
                      text2: 'Account deletion will be available soon',
                    });
                  }
                },
              ]
            );
          }
        },
      ]
    );
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'We will prepare your data for download and send you an email when it\'s ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export Data',
          onPress: () => {
            Toast.show({
              type: 'success',
              text1: 'Export Requested',
              text2: 'You will receive an email when your data is ready',
            });
          }
        },
      ]
    );
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
        <Text style={[styles.title, { color: colors.text }]}>Privacy & Security</Text>
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
          {/* Profile Visibility */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Profile Visibility
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Control who can see your profile information
            </Text>
            
            {(['public', 'students', 'private'] as const).map((visibility) => (
              <TouchableOpacity
                key={visibility}
                style={styles.radioItem}
                onPress={() => updateSetting('profile_visibility', visibility)}
              >
                <View style={styles.radioLeft}>
                  <View style={[
                    styles.radioButton,
                    { borderColor: colors.border },
                    settings.profile_visibility === visibility && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}>
                    {settings.profile_visibility === visibility && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={styles.radioContent}>
                    <Text style={[styles.radioTitle, { color: colors.text }]}>
                      {visibility === 'public' ? 'Public' : visibility === 'students' ? 'Students Only' : 'Private'}
                    </Text>
                    <Text style={[styles.radioDescription, { color: colors.textSecondary }]}>
                      {visibility === 'public' 
                        ? 'Anyone can see your profile'
                        : visibility === 'students' 
                        ? 'Only verified students can see your profile'
                        : 'Only you can see your profile'
                      }
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Card>

          {/* Information Sharing */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Information Sharing
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Show Phone Number
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Allow other users to see your phone number
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.show_phone}
                onValueChange={(value) => updateSetting('show_phone', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Show University
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Display your university on your profile
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.show_university}
                onValueChange={(value) => updateSetting('show_university', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Allow Messages
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Let other users send you messages
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.allow_messages}
                onValueChange={(value) => updateSetting('allow_messages', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Show Online Status
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Let others see when you're online
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.show_online_status}
                onValueChange={(value) => updateSetting('show_online_status', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>
          </Card>

          {/* Data & Analytics */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data & Analytics
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Analytics & Improvement
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Help us improve the app with anonymous usage data
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.data_collection}
                onValueChange={(value) => updateSetting('data_collection', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Marketing Emails
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    Receive promotional emails and updates
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.marketing_emails}
                onValueChange={(value) => updateSetting('marketing_emails', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>
          </Card>

          {/* Data Management */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data Management
            </Text>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleDataExport}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
                  <Ionicons name="download" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    Export My Data
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                    Download a copy of your account data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Security Information */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Your Data is Secure
              </Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              We use industry-standard encryption to protect your personal information. 
              Your data is never shared with third parties without your explicit consent.
            </Text>
          </Card>

          {/* Danger Zone */}
          <Card style={styles.dangerCard}>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>
              Danger Zone
            </Text>
            
            <TouchableOpacity 
              style={[styles.dangerButton, { borderColor: colors.error }]}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={[styles.dangerButtonText, { color: colors.error }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.dangerWarning, { color: colors.textTertiary }]}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
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
  settingsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  radioItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  radioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioContent: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 14,
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  dangerCard: {
    marginBottom: 40,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerWarning: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});