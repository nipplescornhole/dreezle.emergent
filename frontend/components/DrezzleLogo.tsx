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
        return { width: 100, height: 40 };
      case 'medium':
        return { width: 150, height: 60 };
      case 'large':
        return { width: 220, height: 88 };
      case 'splash':
        return { width: 300, height: 120 };
      default:
        return { width: 150, height: 60 };
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