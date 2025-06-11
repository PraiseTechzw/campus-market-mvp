import { toastConfig } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ClerkProvider } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import 'react-native-url-polyfill/auto';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { colorScheme } = useTheme();
  const isReady = useFrameworkReady();
  
  useEffect(() => {
    if (isReady) {
      // Hide splash screen when everything is ready
      SplashScreen.hideAsync();
    }
  }, [isReady]);
  
  if (!isReady) {
    return null;
  }
  
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Toast config={toastConfig} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider 
        publishableKey={Constants.expoConfig?.extra?.clerkPublishableKey}
        tokenCache={{
          async getToken(key) {
            try {
              return await AsyncStorage.getItem(key);
            } catch (err) {
              return null;
            }
          },
          async saveToken(key, token) {
            try {
              return await AsyncStorage.setItem(key, token);
            } catch (err) {
              return;
            }
          },
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <MessagingProvider>
                <RootLayoutContent />
              </MessagingProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}