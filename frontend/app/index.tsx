import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrezzleLogo from '../components/DrezzleLogo';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        setIsLoggedIn(true);
        // Navigate to main feed
        router.replace('/feed');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToAuth = (mode: 'login' | 'register') => {
    router.push(`/auth?mode=${mode}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <DrezzleLogo size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <LinearGradient
        colors={['#0a0a0a', '#1a0a1a', '#2a0a2a']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <DrezzleLogo size="large" />
            </View>
            <Text style={styles.tagline}>Social Music Platform</Text>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.featureCard}>
              <Ionicons name="play-circle" size={60} color="#ff6b9d" />
              <Text style={styles.featureTitle}>Discover Music</Text>
              <Text style={styles.featureDescription}>
                Swipe through endless musical content from talented creators
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="mic" size={60} color="#c770f0" />
              <Text style={styles.featureTitle}>Create & Share</Text>
              <Text style={styles.featureDescription}>
                Upload your music and reach millions of listeners worldwide
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="people" size={60} color="#45d4aa" />
              <Text style={styles.featureTitle}>Connect</Text>
              <Text style={styles.featureDescription}>
                Engage with artists, like, comment, and build your music community
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.loginButton]}
              onPress={() => navigateToAuth('login')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff6b9d', '#c770f0']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.registerButton]}
              onPress={() => navigateToAuth('register')}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.push('/feed')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Join thousands of music lovers and creators
            </Text>
            <View style={styles.socialIcons}>
              <Ionicons name="logo-instagram" size={24} color="#666" />
              <Ionicons name="logo-twitter" size={24} color="#666" />
              <Ionicons name="logo-tiktok" size={24} color="#666" />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b9d',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  tagline: {
    fontSize: 16,
    color: '#999',
    fontWeight: '300',
  },
  heroSection: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    marginBottom: 40,
  },
  actionButton: {
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
    overflow: 'hidden',
  },
  loginButton: {
    elevation: 5,
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff6b9d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b9d',
  },
  guestButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 20,
  },
});