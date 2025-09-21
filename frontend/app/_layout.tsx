import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import DrezzleLogo from '../components/DrezzleLogo';
import { LanguageProvider } from '../contexts/LanguageContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading time
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <LinearGradient
          colors={['#7b2cbf', '#9d4edd', '#c77dff']}
          style={styles.splashGradient}
        >
          <DrezzleLogo size="splash" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="feed" />
        <Stack.Screen name="upload" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="comments" />
      </Stack>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
  },
  splashGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});