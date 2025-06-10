import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
}

export default function DataExportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([
    {
      id: 'profile',
      title: 'Profile Information',
      description: 'Your personal details, university, and verification status',
      icon: 'person',
      selected: true,
    },
    {
      id: 'products',
      title: 'Product Listings',
      description: 'All your product listings, sold and active',
      icon: 'cube',
      selected: true,
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Your chat conversations and message history',
      icon: 'chatbubbles',
      selected: false,
    },
    {
      id: 'orders',
      title: 'Order History',
      description: 'Your buying and selling transaction history',
      icon: 'receipt',
      selected: true,
    },
    {
      id: 'saved',
      title: 'Saved Items',
      description: 'Products you have saved for later',
      icon: 'heart',
      selected: false,
    },
    {
      id: 'preferences',
      title: 'App Preferences',
      description: 'Your notification and privacy settings',
      icon: 'settings',
      selected: false,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const toggleOption = (optionId: string) => {
    setExportOptions(options =>
      options.map(option =>
        option.id === optionId
          ? { ...option, selected: !option.selected }
          : option
      )
    );
  };

  const handleExportData = async () => {
    const selectedOptions = exportOptions.filter(option => option.selected);
    
    if (selectedOptions.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Data Selected',
        text2: 'Please select at least one data type to export',
      });
      return;
    }

    Alert.alert(
      'Export Data',
      `Export ${selectedOptions.length} data type(s)? We'll prepare your data and send you an email when it's ready for download.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export',
          onPress: async () => {
            setLoading(true);
            try {
              // Simulate export process
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              Toast.show({
                type: 'success',
                text1: 'Export Requested',
                text2: 'You will receive an email when your data is ready for download',
              });
              
              router.back();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Export Failed',
                text2: 'Failed to request data export. Please try again.',
              });
            } finally {
              setLoading(false);
            }
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
        <Text style={[styles.title, { color: colors.text }]}>Export Data</Text>
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
          {/* Info Card */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="download" size={24} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Download Your Data
              </Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Export a copy of your Campus Market data. We'll prepare your data and send you a download link via email within 24 hours.
            </Text>
          </Card>

          {/* Export Options */}
          <Card style={styles.optionsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Select Data to Export
            </Text>
            
            <View style={styles.optionsList}>
              {exportOptions.map((option, index) => (
                <MotiView
                  key={option.id}
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', delay: index * 100 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      { borderBottomColor: colors.border }
                    ]}
                    onPress={() => toggleOption(option.id)}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.optionIcon, { backgroundColor: colors.surface }]}>
                        <Ionicons name={option.icon as any} size={20} color={colors.primary} />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={[styles.optionTitle, { color: colors.text }]}>
                          {option.title}
                        </Text>
                        <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[
                      styles.checkbox,
                      { 
                        backgroundColor: option.selected ? colors.primary : 'transparent',
                        borderColor: option.selected ? colors.primary : colors.border,
                      }
                    ]}>
                      {option.selected && (
                        <Ionicons name="checkmark\" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          </Card>

          {/* Format Information */}
          <Card style={styles.formatCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Export Format
            </Text>
            
            <View style={styles.formatInfo}>
              <View style={styles.formatItem}>
                <Ionicons name="document" size={20} color={colors.info} />
                <View style={styles.formatContent}>
                  <Text style={[styles.formatTitle, { color: colors.text }]}>
                    JSON Format
                  </Text>
                  <Text style={[styles.formatDescription, { color: colors.textSecondary }]}>
                    Machine-readable format for developers
                  </Text>
                </View>
              </View>
              
              <View style={styles.formatItem}>
                <Ionicons name="document-text" size={20} color={colors.success} />
                <View style={styles.formatContent}>
                  <Text style={[styles.formatTitle, { color: colors.text }]}>
                    CSV Format
                  </Text>
                  <Text style={[styles.formatDescription, { color: colors.textSecondary }]}>
                    Spreadsheet-compatible format for easy viewing
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Privacy Notice */}
          <Card style={styles.privacyCard}>
            <View style={styles.privacyHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              <Text style={[styles.privacyTitle, { color: colors.text }]}>
                Privacy & Security
              </Text>
            </View>
            
            <View style={styles.privacyList}>
              <View style={styles.privacyItem}>
                <View style={[styles.privacyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                  Your data export will be encrypted and password-protected
                </Text>
              </View>
              
              <View style={styles.privacyItem}>
                <View style={[styles.privacyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                  Download links expire after 7 days for security
                </Text>
              </View>
              
              <View style={styles.privacyItem}>
                <View style={[styles.privacyBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                  We never share your personal data with third parties
                </Text>
              </View>
            </View>
          </Card>

          {/* Export Button */}
          <View style={styles.exportSection}>
            <Button
              title={`Export Selected Data (${exportOptions.filter(o => o.selected).length})`}
              onPress={handleExportData}
              loading={loading}
              disabled={exportOptions.filter(o => o.selected).length === 0}
              style={styles.exportButton}
            />
            
            <Text style={[styles.exportNote, { color: colors.textTertiary }]}>
              You will receive an email at {user.email} when your data is ready for download.
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
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsList: {
    gap: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatCard: {
    marginBottom: 20,
  },
  formatInfo: {
    gap: 16,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formatContent: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  formatDescription: {
    fontSize: 14,
  },
  privacyCard: {
    marginBottom: 32,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  privacyList: {
    gap: 12,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  privacyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  privacyText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  exportSection: {
    marginBottom: 40,
  },
  exportButton: {
    width: '100%',
    marginBottom: 12,
  },
  exportNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});