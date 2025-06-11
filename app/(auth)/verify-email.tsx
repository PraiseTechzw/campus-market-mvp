import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { isLoaded, signUp } = useSignUp();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerification = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!isLoaded || !signUp) {
        throw new Error('SignUp not initialized');
      }

      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        Toast.show({
          type: 'success',
          text1: 'Email Verified!',
          text2: 'Your account has been verified successfully',
        });
        router.replace('/(onboarding)/profile-setup');
      } else {
        throw new Error('Verification incomplete');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.message || 'Invalid verification code');
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: error.message || 'Please check your code and try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      if (!isLoaded || !signUp) {
        throw new Error('SignUp not initialized');
      }

      await signUp.prepareEmailAddressVerification();
      
      Toast.show({
        type: 'success',
        text1: 'Code Resent',
        text2: 'Please check your email for the new code',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error.message || 'Could not resend verification code',
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.headerContent}
        >
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to {email}
          </Text>
        </MotiView>
      </LinearGradient>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 200 }}
        style={styles.content}
      >
        <Card style={styles.formCard}>
          <Input
            label="Verification Code"
            value={code}
            onChangeText={setCode}
            placeholder="Enter the 6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            error={error}
          />

          <Button
            onPress={handleVerification}
            loading={loading}
            style={styles.verifyButton}
            title="Verify Email"
          />

          <TouchableOpacity
            onPress={handleResendCode}
            disabled={loading}
            style={styles.resendButton}
          >
            <Text style={[styles.resendText, { color: colors.primary }]}>
              Didn't receive the code? Resend
            </Text>
          </TouchableOpacity>
        </Card>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    padding: 20,
  },
  verifyButton: {
    marginTop: 20,
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});