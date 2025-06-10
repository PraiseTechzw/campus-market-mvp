import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulse animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
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
        text1: 'Invalid OTP',
        text2: 'Please enter the complete 6-digit code',
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email!,
        token: otpCode,
        type: 'email'
      });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Email Verified!',
        text2: 'Your account has been successfully verified',
      });

      router.replace('/(onboarding)/welcome');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: error.message || 'Invalid verification code',
      });
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: 'A new verification code has been sent to your email',
      });
      
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error.message || 'Failed to resend verification code',
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
        </View>
      </LinearGradient>

      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 600 }}
        style={styles.content}
      >
        <View style={styles.iconContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[styles.iconBackground, { backgroundColor: colors.primary }]}>
              <Ionicons name="mail" size={48} color="#FFFFFF" />
            </View>
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Verify Your Email
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We've sent a 6-digit verification code to{'\n'}
          <Text style={{ fontWeight: '600', color: colors.primary }}>{email}</Text>
        </Text>

        <Card style={styles.otpCard}>
          <Text style={[styles.otpLabel, { color: colors.text }]}>
            Enter Verification Code
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

          <View style={styles.otpInfo}>
            <Ionicons name="time" size={16} color={colors.textTertiary} />
            <Text style={[styles.otpInfoText, { color: colors.textTertiary }]}>
              Code expires in 10 minutes
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Verify Email"
            onPress={handleVerifyOtp}
            loading={loading}
            disabled={otp.join('').length !== 6}
            style={styles.verifyButton}
          />

          <View style={styles.resendSection}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Didn't receive the code?
            </Text>
            
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                <Text style={[styles.resendLink, { color: colors.primary }]}>
                  Resend verification code
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.countdownText, { color: colors.textTertiary }]}>
                Resend in {countdown}s
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.backToLoginButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={[styles.backText, { color: colors.textSecondary }]}>
            Back to registration
          </Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    height: 120,
    paddingTop: 60,
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  otpCard: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
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
    marginBottom: 16,
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
  otpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpInfoText: {
    fontSize: 12,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  verifyButton: {
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    marginBottom: 40,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
  },
});