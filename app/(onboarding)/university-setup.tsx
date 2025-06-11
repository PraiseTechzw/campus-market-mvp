import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const POPULAR_UNIVERSITIES = [
  'University of Zimbabwe',
  'Midlands State University',
  'National University of Science and Technology',
  'Africa University',
  'Chinhoyi University of Technology',
  'Great Zimbabwe University',
  'Bindura University of Science Education',
  'Zimbabwe Open University',
  'Lupane State University',
  'Harare Institute of Technology',
];

export default function UniversitySetupScreen() {
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  
  const [university, setUniversity] = useState(user?.university || '');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredUniversities = POPULAR_UNIVERSITIES.filter(uni =>
    uni.toLowerCase().includes(university.toLowerCase())
  );

  const handleUniversitySelect = (selectedUniversity: string) => {
    setUniversity(selectedUniversity);
    setShowSuggestions(false);
  };

  const handleContinue = async () => {
    if (!university.trim()) {
      Toast.show({
        type: 'error',
        text1: 'University Required',
        text2: 'Please select or enter your university',
      });
      return;
    }

    setLoading(true);
    
    try {
      const updates = {
        university: university.trim(),
        // In a real app, you might store student ID for verification
      };

      console.log('🔍 DEBUG: University setup updates:', updates);

      const { error } = await updateProfile(updates);
      
      if (error) {
        console.error('❌ DEBUG: University setup error:', error);
        throw new Error(error);
      }

      console.log('✅ DEBUG: University setup successful');

      Toast.show({
        type: 'success',
        text1: 'University Added',
        text2: 'Your university information has been saved',
      });

      router.push('/(onboarding)/preferences');
    } catch (error: any) {
      console.error('❌ DEBUG: University setup error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update university information',
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
          <Text style={styles.headerTitle}>University</Text>
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
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '50%' }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              Step 2 of 4
            </Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              Which university do you attend?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              This helps us connect you with students from your campus
            </Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.form}>
              <Input
                label="University *"
                placeholder="Search or enter your university"
                value={university}
                onChangeText={(text) => {
                  setUniversity(text);
                  setShowSuggestions(text.length > 0);
                }}
                onFocus={() => setShowSuggestions(university.length > 0)}
                leftIcon={<Ionicons name="school" size={20} color={colors.textTertiary} />}
              />

              {showSuggestions && filteredUniversities.length > 0 && (
                <View style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {filteredUniversities.slice(0, 5).map((uni, index) => (
                    <TouchableOpacity
                      key={uni}
                      style={[
                        styles.suggestionItem,
                        index < filteredUniversities.slice(0, 5).length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }
                      ]}
                      onPress={() => handleUniversitySelect(uni)}
                    >
                      <Ionicons name="school" size={16} color={colors.primary} />
                      <Text style={[styles.suggestionText, { color: colors.text }]}>
                        {uni}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Input
                label="Student ID (Optional)"
                placeholder="Enter your student ID"
                value={studentId}
                onChangeText={setStudentId}
                leftIcon={<Ionicons name="card" size={20} color={colors.textTertiary} />}
              />
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Why do we need this?
              </Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your university information helps us:
            </Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={[styles.infoBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.infoItemText, { color: colors.textSecondary }]}>
                  Connect you with students from your campus
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={[styles.infoBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.infoItemText, { color: colors.textSecondary }]}>
                  Show relevant products and services
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={[styles.infoBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.infoItemText, { color: colors.textSecondary }]}>
                  Enable student verification (optional)
                </Text>
              </View>
            </View>
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
              onPress={() => router.push('/(onboarding)/preferences')}
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
  formCard: {
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  form: {
    gap: 8,
  },
  suggestions: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  infoCard: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
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
    marginBottom: 12,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  infoItemText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
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