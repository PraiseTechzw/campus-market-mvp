import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Email Required',
        text2: 'Please enter your email address',
      });
      return;
    }

    if (!validateEmail(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined, // This ensures OTP is sent instead of magic link
      });

      if (error) throw error;

      setEmailSent(true);
      Toast.show({
        type: 'success',
        text1: 'Reset Code Sent',
        text2: 'Check your email for the password reset code',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error.message || 'Failed to send reset code',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToReset = () => {
    router.push({
      pathname: '/(auth)/reset-password',
      params: { email }
    });
  };

  if (emailSent) {
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

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <View style={styles.successContainer}>
              <MotiView
                from={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
                  <Ionicons name="mail" size={48} color="#FFFFFF" />
                </View>
              </MotiView>
              
              <Text style={[styles.successTitle, { color: colors.text }]}>
                Check Your Email
              </Text>
              
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                We've sent a password reset code to {email}
              </Text>

              <Card style={styles.instructionsCard}>
                <View style={styles.instructionItem}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepText}>1</Text>
                  </View>
                  <Text style={[styles.instructionText, { color: colors.text }]}>
                    Check your email inbox
                  </Text>
                </View>

                <View style={styles.instructionItem}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepText}>2</Text>
                  </View>
                  <Text style={[styles.instructionText, { color: colors.text }]}>
                    Enter the 6-digit reset code
                  </Text>
                </View>

                <View style={styles.instructionItem}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepText}>3</Text>
                  </View>
                  <Text style={[styles.instructionText, { color: colors.text }]}>
                    Create your new password
                  </Text>
                </View>
              </Card>

              <View style={styles.actions}>
                <Button
                  title="Enter Reset Code"
                  onPress={handleProceedToReset}
                  style={styles.proceedButton}
                />
                
                <Button
                  title="Resend Code"
                  onPress={() => setEmailSent(false)}
                  variant="outline"
                  style={styles.resendButton}
                />
                
                <Link href="/(auth)/login" asChild>
                  <Button
                    title="Back to Login"
                    onPress={() => {}}
                    variant="ghost"
                    style={styles.backToLoginButton}
                  />
                </Link>
              </View>
            </View>
          </MotiView>
        </ScrollView>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Forgot Password?</Text>
            <Text style={styles.headerSubtitle}>
              No worries! Enter your email and we'll send you a reset code.
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
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
        >
          <Card style={styles.formCard} blur intensity={20}>
            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail\" size={20} color={colors.textTertiary} />}
              />

              <Button
                title="Send Reset Code"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.resetButton}
              />
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Remember your password?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Sign in
                </Text>
              </TouchableOpacity>
            </Link>
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
  form: {
    gap: 8,
  },
  resetButton: {
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
  successContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  instructionsCard: {
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  proceedButton: {
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  resendButton: {
    backgroundColor: 'transparent',
  },
  backToLoginButton: {
    marginTop: 8,
  },
});