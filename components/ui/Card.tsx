import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blur?: boolean;
  intensity?: number;
}

export function Card({ children, style, blur = false, intensity = 20 }: CardProps) {
  const { colors, colorScheme } = useTheme();

  if (blur) {
    return (
      <BlurView
        intensity={intensity}
        tint={colorScheme}
        style={[
          styles.card,
          styles.blurCard,
          { borderColor: colors.border },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  blurCard: {
    overflow: 'hidden',
  },
});