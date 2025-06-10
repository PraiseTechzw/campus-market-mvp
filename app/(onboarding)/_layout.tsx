import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="university-setup" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}