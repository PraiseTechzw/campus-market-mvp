import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Country } from '@/components/ui/CountryPicker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import Toast from 'react-native-toast-message';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: '',
    university: user?.university || '',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const updates = {
        name: formData.name.trim(),
        phone: formData.phone.trim() ? 
          `${selectedCountry?.dialCode || ''} ${formData.phone.trim()}` : 
          undefined,
        university: formData.university.trim() || undefined,
        // In a real app, you'd upload the avatar to storage first
        avatar_url: avatar || undefined,
      };

      const { error } = await updateProfile(updates);
      
      if (error) throw new Error(error);

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully',
      });

      router.back();
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            // In a real app, you'd implement account deletion
            Toast.show({
              type: 'info',
              text1: 'Feature Coming Soon',
              text2: 'Account deletion will be available soon',
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
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.saveText, { color: colors.primary }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
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
          {/* Avatar Section */}
          <Card style={styles.avatarCard}>
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="person" size={40} color={colors.textTertiary} />
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

          {/* Personal Information */}
          <Card style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Information
            </Text>
            
            <View style={styles.form}>
              <Input
                label="Full Name *"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                error={errors.name}
                leftIcon={<Ionicons name="person\" size={20} color={colors.textTertiary} />}
              />

              <Input
                label="Email Address"
                placeholder="Email address"
                value={user.email}
                editable={false}
                leftIcon={<Ionicons name="mail\" size={20} color={colors.textTertiary} />}
                style={{ opacity: 0.6 }}
              />

              <PhoneInput
                label="Phone Number"
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                onChangeCountry={setSelectedCountry}
              />

              <Input
                label="University"
                placeholder="Enter your university"
                value={formData.university}
                onChangeText={(text) => setFormData({ ...formData, university: text })}
                leftIcon={<Ionicons name="school\" size={20} color={colors.textTertiary} />}
              />

              <Input
                label="Bio"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={3}
                leftIcon={<Ionicons name="document-text\" size={20} color={colors.textTertiary} />}
                style={{ height: 80, textAlignVertical: 'top' }}
              />
            </View>
          </Card>

          {/* Account Status */}
          <Card style={styles.statusCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account Status
            </Text>
            
            <View style={styles.statusItem}>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusLabel, { color: colors.text }]}>
                  Email Verification
                </Text>
                <Text style={[styles.statusValue, { color: colors.success }]}>
                  Verified
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusLabel, { color: colors.text }]}>
                  Student Verification
                </Text>
                <Text style={[styles.statusValue, { color: user.is_verified ? colors.success : colors.warning }]}>
                  {user.is_verified ? 'Verified' : 'Pending'}
                </Text>
              </View>
              <Ionicons 
                name={user.is_verified ? "checkmark-circle" : "time"} 
                size={20} 
                color={user.is_verified ? colors.success : colors.warning} 
              />
            </View>

            {!user.is_verified && (
              <TouchableOpacity 
                style={[styles.verifyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/profile/verification')}
              >
                <Text style={styles.verifyButtonText}>Complete Verification</Text>
              </TouchableOpacity>
            )}
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
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarCard: {
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  form: {
    gap: 8,
  },
  statusCard: {
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifyButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});