import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'large', fullScreen = false }: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const dotScaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main rotation animation
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse animation for the outer ring
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Dot scale animation
    const dotScale = Animated.loop(
      Animated.sequence([
        Animated.timing(dotScaleValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotScaleValue, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spin.start();
    pulse.start();
    dotScale.start();

    return () => {
      spin.stop();
      pulse.stop();
      dotScale.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulse = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const dotScale = dotScaleValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  const spinnerSize = size === 'large' ? 80 : 40;
  const dotSize = size === 'large' ? 12 : 6;

  const renderSpinner = () => (
    <View style={[styles.spinnerWrapper, { width: spinnerSize, height: spinnerSize }]}>
      {/* Outer rotating ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderWidth: size === 'large' ? 3 : 2,
            borderColor: colors.primary,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      
      {/* Pulsing middle ring */}
      <Animated.View
        style={[
          styles.middleRing,
          {
            width: spinnerSize * 0.7,
            height: spinnerSize * 0.7,
            borderWidth: size === 'large' ? 2 : 1,
            borderColor: colors.primary,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      {/* Animated center dot */}
      <Animated.View
        style={[
          styles.centerDot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: colors.primary,
            transform: [{ scale: dotScale }],
          },
        ]}
      />
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        {renderSpinner()}
      </View>
    );
  }

  return (
    <View style={styles.center}>
      {renderSpinner()}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderRadius: 100,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  middleRing: {
    position: 'absolute',
    borderRadius: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  centerDot: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.8,
  },
});