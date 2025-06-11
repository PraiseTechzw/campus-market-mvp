import { useAuth as useAppAuth } from '@/contexts/AuthContext';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { user, loading: isUserLoading } = useAppAuth();

  // Show loading indicator while auth state is being determined
  if (!isClerkLoaded || isUserLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
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

