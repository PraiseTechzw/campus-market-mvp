import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function VerificationScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [studentIdImage, setStudentIdImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please allow access to your photo library',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setStudentIdImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please allow access to your camera',
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setStudentIdImage(result.assets[0].uri);
    }
  };

  const handleSubmitVerification = async () => {
    if (!studentIdImage) {
      Toast.show({
        type: 'error',
        text1: 'Image Required',
        text2: 'Please upload your student ID for verification',
      });
      return;
    }

    setLoading(true);
    
    try {
      // In a real app, you'd upload the image and submit for verification
      // For now, we'll just simulate the process
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      Toast.show({
        type: 'success',
        text1: 'Verification Submitted',
        text2: 'Your student ID has been submitted for review',
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.message || 'Failed to submit verification',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  if (user.is_verified) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Verification</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.verifiedContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 800 }}
          >
            <View style={[styles.verifiedIcon, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            
            <Text style={[styles.verifiedTitle, { color: colors.text }]}>
              Account Verified!
            </Text>
            <Text style={[styles.verifiedSubtitle, { color: colors.textSecondary }]}>
              Your student status has been verified. You now have access to all verified user features.
            </Text>

            <Card style={styles.benefitsCard}>
              <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                Verified Benefits
              </Text>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Blue verification badge on your profile
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Increased trust from other students
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Priority in search results
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Access to verified-only features
                  </Text>
                </View>
              </View>
            </Card>
          </MotiView>
        </View>
      </View>
    );
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
        <Text style={[styles.title, { color: colors.text }]}>Student Verification</Text>
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
          <View style={styles.titleSection}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Verify Your Student Status
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Get verified to build trust with other students and unlock exclusive features
            </Text>
          </View>

          <Card style={styles.benefitsCard}>
            <View style={styles.benefitsHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                Benefits of Verification
              </Text>
            </View>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  Blue verification badge on your profile
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  Increased trust from other students
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  Priority in search results
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  Access to verified-only features
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.uploadCard}>
            <Text style={[styles.uploadTitle, { color: colors.text }]}>
              Upload Student ID
            </Text>
            <Text style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>
              Take a clear photo of your student ID card
            </Text>

            {studentIdImage ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: studentIdImage }} style={styles.previewImage} />
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                  onPress={() => setStudentIdImage(null)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.uploadArea, { borderColor: colors.border }]}>
                <Ionicons name="camera" size={48} color={colors.textTertiary} />
                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                  No image selected
                </Text>
              </View>
            )}

            <View style={styles.uploadActions}>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={pickImage}
              >
                <Ionicons name="images" size={20} color={colors.primary} />
                <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                  Gallery
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={20} color={colors.primary} />
                <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.privacyCard}>
            <View style={styles.privacyHeader}>
              <Ionicons name="lock-closed" size={20} color={colors.info} />
              <Text style={[styles.privacyTitle, { color: colors.text }]}>
                Privacy & Security
              </Text>
            </View>
            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
              Your student ID will only be used for verification purposes and will be securely stored. 
              Personal information will be kept private and not shared with other users.
            </Text>
          </Card>

          <View style={styles.actions}>
            <Button
              title={studentIdImage ? "Submit for Verification" : "Upload Student ID"}
              onPress={handleSubmitVerification}
              loading={loading}
              disabled={!studentIdImage}
              style={styles.submitButton}
            />
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
  titleSection: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  benefitsCard: {
    marginBottom: 20,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  uploadCard: {
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadArea: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 14,
    marginTop: 8,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  privacyCard: {
    marginBottom: 32,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginBottom: 40,
  },
  submitButton: {
    marginBottom: 8,
  },
  verifiedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  verifiedIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  verifiedTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  verifiedSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
});