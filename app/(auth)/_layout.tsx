import { useAuth as useAppAuth } from '@/contexts/AuthContext';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isSignedIn } = useAuth();
  const { user, loading } = useAppAuth();

  // If still loading auth state, show nothing
  if (loading) {
    return null;
  }

  // If signed in, handle routing based on user state
  if (isSignedIn) {
    // If user hasn't completed onboarding (no university set)
    if (!user?.university) {
      return <Redirect href="/(onboarding)/profile-setup" />;
    }
    // If user has completed onboarding, go to main app
    return <Redirect href="/(tabs)" />;
  }

  // If not signed in, show auth screens
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}

