import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface DrezzleLogoProps {
  size?: 'small' | 'medium' | 'large' | 'splash';
  style?: ViewStyle;
}

export default function DrezzleLogo({ size = 'medium', style }: DrezzleLogoProps) {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 140, height: 56 };
      case 'medium':
        return { width: 210, height: 84 };
      case 'large':
        return { width: 308, height: 123 };
      case 'splash':
        return { width: 420, height: 168 };
      default:
        return { width: 210, height: 84 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 28;
      case 'large':
        return 42;
      case 'splash':
        return 56;
      default:
        return 28;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 32;
      case 'large':
        return 48;
      case 'splash':
        return 64;
      default:
        return 32;
    }
  };

  const dimensions = getSize();

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }, style]}>
      <LinearGradient
        colors={['#ff6b9d', '#c770f0']}
        style={[styles.logoContainer, { width: dimensions.width, height: dimensions.height }]}
      >
        <View style={styles.logoContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes" size={getIconSize()} color="white" />
          </View>
          <Text style={[styles.logoText, { fontSize: getFontSize() }]}>
            Drezzle
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    marginRight: 8,
  },
  logoText: {
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});