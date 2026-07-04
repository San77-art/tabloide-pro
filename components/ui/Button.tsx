import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', loading, disabled, style, textStyle }: ButtonProps) {
  const height = size === 'sm' ? 36 : size === 'lg' ? 56 : 48;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 15 });
  };

  if (variant === 'primary') {
    return (
      <Animated.View style={[animStyle, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
        >
          <LinearGradient
            colors={Colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.base, { height }, styles.primaryShadow]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.primaryText, { fontSize }, textStyle]}>{label}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'outline') {
    return (
      <Animated.View style={[animStyle, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[styles.base, styles.outline, { height }]}
        >
          <Text style={[styles.outlineText, { fontSize }, textStyle]}>{label}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[styles.base, { height }]}
      >
        <Text style={[styles.ghostText, { fontSize }, textStyle]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  primaryText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  outlineText: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  ghostText: {
    color: Colors.textMuted,
    fontFamily: 'Inter_500Medium',
  },
});
