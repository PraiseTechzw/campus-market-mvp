import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter the complete 6-digit code',
      });
      return;
    }

    setStep('password');
    Toast.show({
      type: 'success',
      text1: 'Code Verified',
      text2: 'Now create your new password',
    });
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Required',
        text2: 'Please enter a new password',
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Password Too Short',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords Don\'t Match',
        text2: 'Please make sure both passwords match',
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Password Updated',
        text2: 'Your password has been successfully updated',
      });

      router.replace('/(auth)/login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update password',
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

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.logoSection}
          >
            <View style={styles.logoContainer}>
              <Ionicons name="key" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>
              {step === 'otp' ? 'Enter Reset Code' : 'Create New Password'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {step === 'otp' 
                ? 'Enter the 6-digit code sent to your email'
                : 'Choose a strong password for your account'
              }
            </Text>
          </MotiView>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Card style={styles.formCard} blur intensity={20}>
            {step === 'otp' ? (
              <View style={styles.otpSection}>
                <Text style={[styles.otpLabel, { color: colors.text }]}>
                  Verification Code
                </Text>
                
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'timing', delay: index * 100 }}
                    >
                      <TextInput
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        style={[
                          styles.otpInput,
                          {
                            backgroundColor: colors.surface,
                            borderColor: digit ? colors.primary : colors.border,
                            color: colors.text,
                          }
                        ]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        keyboardType="numeric"
                        maxLength={1}
                        textAlign="center"
                        selectTextOnFocus
                        autoFocus={index === 0}
                      />
                    </MotiView>
                  ))}
                </View>

                <Button
                  title="Verify Code"
                  onPress={handleVerifyOtp}
                  disabled={otp.join('').length !== 6}
                  style={styles.verifyButton}
                />
              </View>
            ) : (
              <View style={styles.passwordSection}>
                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  leftIcon={<Ionicons name="lock-closed\" size={20} color={colors.textTertiary} />}
                />

                <Input
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  leftIcon={<Ionicons name="lock-closed\" size={20} color={colors.textTertiary} />}
                />

                <View style={styles.passwordStrength}>
                  <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>
                    Password strength:
                  </Text>
                  <View style={styles.strengthMeter}>
                    <View 
                      style={[
                        styles.strengthFill, 
                        { 
                          width: `${Math.min(newPassword.length * 10, 100)}%`,
                          backgroundColor: newPassword.length < 6 ? colors.error : 
                                          newPassword.length < 8 ? colors.warning : 
                                          colors.success
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.strengthText, { 
                    color: newPassword.length < 6 ? colors.error : 
                           newPassword.length < 8 ? colors.warning : 
                           colors.success 
                  }]}>
                    {newPassword.length < 6 ? 'Weak' : 
                     newPassword.length < 8 ? 'Medium' : 
                     'Strong'}
                  </Text>
                </View>

                <Button
                  title="Update Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.updateButton}
                />
              </View>
            )}
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Remember your password?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Sign in
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
    paddingBottom: 40,
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
  logoSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  formCard: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 16,
  },
  otpSection: {
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  passwordSection: {
    gap: 8,
  },
  passwordStrength: {
    marginTop: 8,
    marginBottom: 16,
  },
  strengthLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  strengthMeter: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  updateButton: {
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '700',
  },
});