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
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrezzleLogo from '../components/DrezzleLogo';
import { useLanguage, Language } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        setIsLoggedIn(true);
        // Don't auto-redirect - let user see the landing page
        // router.replace('/feed');
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
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => setShowLanguageModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="language" size={20} color="#ff6b9d" />
              <Text style={styles.languageButtonText}>{t('welcome.language')}</Text>
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <DrezzleLogo size="large" />
            </View>
            <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.featureCard}>
              <Ionicons name="play-circle" size={60} color="#ff6b9d" />
              <Text style={styles.featureTitle}>{t('welcome.discover.title')}</Text>
              <Text style={styles.featureDescription}>
                {t('welcome.discover.description')}
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="mic" size={60} color="#c770f0" />
              <Text style={styles.featureTitle}>{t('welcome.create.title')}</Text>
              <Text style={styles.featureDescription}>
                {t('welcome.create.description')}
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="people" size={60} color="#45d4aa" />
              <Text style={styles.featureTitle}>{t('welcome.connect.title')}</Text>
              <Text style={styles.featureDescription}>
                {t('welcome.connect.description')}
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
                <Text style={styles.buttonText}>{t('welcome.signin')}</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.registerButton]}
              onPress={() => navigateToAuth('register')}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>{t('welcome.signup')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.push('/feed')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestButtonText}>{t('welcome.guest')}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('welcome.footer')}
            </Text>
            <View style={styles.socialIcons}>
              <Ionicons name="logo-instagram" size={24} color="#666" />
              <Ionicons name="logo-twitter" size={24} color="#666" />
              <Ionicons name="logo-tiktok" size={24} color="#666" />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('welcome.language')}</Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.languageOptions}>
              {[
                { code: 'it' as Language, name: t('language.italian'), flag: '🇮🇹' },
                { code: 'es' as Language, name: t('language.spanish'), flag: '🇪🇸' },
                { code: 'de' as Language, name: t('language.german'), flag: '🇩🇪' },
                { code: 'en' as Language, name: t('language.english'), flag: '🇬🇧' },
                { code: 'en-US' as Language, name: t('language.american'), flag: '🇺🇸' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    language === lang.code && styles.selectedLanguageOption,
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    language === lang.code && styles.selectedLanguageName,
                  ]}>
                    {lang.name}
                  </Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark" size={20} color="#ff6b9d" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    marginBottom: 12,
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
  languageButton: {
    position: 'absolute',
    top: 10,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  languageButtonText: {
    color: '#ff6b9d',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  languageOptions: {
    gap: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedLanguageOption: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#ccc',
  },
  selectedLanguageName: {
    color: 'white',
    fontWeight: '500',
  },
});