import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface DrezzleLogoProps {
  size?: 'small' | 'medium' | 'large' | 'splash';
  style?: ViewStyle;
}

export default function DrezzleLogo({ size = 'medium', style }: DrezzleLogoProps) {
  const logoUri = 'https://customer-assets.emergentagent.com/job_android-app-dev-3/artifacts/6oabdye9_ChatGPT%20Image%2021%20set%202025%2C%2017_08_33.png';
  
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 140, height: 56 };  // +40% rispetto all'originale 100x40
      case 'medium':
        return { width: 210, height: 84 };  // +40% rispetto all'originale 150x60
      case 'large':
        return { width: 308, height: 123 }; // +40% rispetto all'originale 220x88
      case 'splash':
        return { width: 420, height: 168 }; // +40% rispetto all'originale 300x120
      default:
        return { width: 210, height: 84 };
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: logoUri }}
        style={[getSize(), styles.logo]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Mantiene le proporzioni dell'immagine
  },
});