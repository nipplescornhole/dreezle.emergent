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
        return { width: 200, height: 80 };  // Test più grande
      case 'medium':
        return { width: 250, height: 100 };
      case 'large':
        return { width: 350, height: 140 };  // Test molto più grande
      case 'splash':
        return { width: 400, height: 160 };
      default:
        return { width: 250, height: 100 };
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