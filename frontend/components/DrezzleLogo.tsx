import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface DrezzleLogoProps {
  size?: 'small' | 'medium' | 'large' | 'splash';
  style?: ViewStyle;
}

export default function DrezzleLogo({ size = 'medium', style }: DrezzleLogoProps) {
  const logoUri = 'https://customer-assets.emergentagent.com/job_android-app-dev-3/artifacts/u9zpyfn2_Immagine%202025-09-19%20165238.png';
  
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 80, height: 30 };
      case 'medium':
        return { width: 120, height: 45 };
      case 'large':
        return { width: 200, height: 75 };
      case 'splash':
        return { width: 280, height: 105 };
      default:
        return { width: 120, height: 45 };
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