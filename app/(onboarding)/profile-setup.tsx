import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Country } from '@/components/ui/CountryPicker';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function ProfileSetupScreen() {
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: '',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url || null);
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
      setAvatar(result.assets[0].uri);
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (!formData.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Name Required',
        text2: 'Please enter your full name',
      });
      return;
    }

    setLoading(true);
    
    try {
      const updates = {
        name: formData.name.trim(),
        phone: formData.phone.trim() ? 
          `${selectedCountry?.dialCode || ''} ${formData.phone.trim()}` : 
          undefined,
        // In a real app, you'd upload the avatar to storage first
        avatar_url: avatar || undefined,
      };

      const { error } = await updateProfile(updates);
      
      if (error) throw new Error(error);

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been set up successfully',
      });

      router.push('/(onboarding)/university-setup');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update profile',
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
          <Text style={styles.headerTitle}>Profile Setup</Text>
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
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '25%' }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              Step 1 of 4
            </Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              Let's set up your profile
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Add your details to help other students recognize you
            </Text>
          </View>

          <Card style={styles.avatarCard}>
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Ionicons name="person" size={40} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.avatarActions}>
                <TouchableOpacity 
                  style={[styles.avatarAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={20} color={colors.primary} />
                  <Text style={[styles.avatarActionText, { color: colors.primary }]}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.avatarAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={20} color={colors.primary} />
                  <Text style={[styles.avatarActionText, { color: colors.primary }]}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <View style={styles.form}>
              <Input
                label="Full Name *"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                leftIcon={<Ionicons name="person" size={20} color={colors.textTertiary} />}
              />

              <PhoneInput
                label="Phone Number"
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                onChangeCountry={setSelectedCountry}
              />

              <Input
                label="Bio (Optional)"
                placeholder="Tell us a bit about yourself"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={3}
                leftIcon={<Ionicons name="document-text" size={20} color={colors.textTertiary} />}
                style={{ height: 80, textAlignVertical: 'top' }}
              />
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
              onPress={() => router.push('/(onboarding)/university-setup')}
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
  avatarCard: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  form: {
    gap: 8,
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