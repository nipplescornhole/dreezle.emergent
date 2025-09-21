import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserBadge from '../components/UserBadge.tsx';

const { width } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AuthData {
  email: string;
  password: string;
  username?: string;
  role?: string;
}

export default function AuthScreen() {
  const { mode } = useLocalSearchParams();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AuthData>({
    email: '',
    password: '',
    username: '',
    role: 'listener',
  });

  const roles = [
    { 
      value: 'listener', 
      label: 'Listener', 
      icon: 'headset',
      description: 'Ascolta, metti like, commenta e salva contenuti'
    },
    { 
      value: 'creator', 
      label: 'Creator', 
      icon: 'mic',
      description: 'Pubblica contenuti, interagisce e costruisce il tuo pubblico'
    },
    { 
      value: 'expert', 
      label: 'Expert', 
      icon: 'star',
      description: 'Come Listener + verifica con documenti di studi musicali'
    },
    { 
      value: 'label', 
      label: 'Label', 
      icon: 'business',
      description: 'Etichetta discografica verificata dall\'admin'
    },
  ];

  const handleAuth = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && !formData.username) {
      Alert.alert('Error', 'Username is required for registration');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            username: formData.username,
            role: formData.role,
          };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('access_token', data.access_token);
        
        let successMessage = isLogin ? 'Welcome back!' : 'Account created successfully!';
        if (!isLogin && formData.role === 'expert') {
          successMessage += '\nPuoi caricare i documenti di studio più tardi dal profilo.';
        } else if (!isLogin && formData.role === 'label') {
          successMessage += '\nIl tuo account sarà verificato dall\'admin.';
        }
        
        Alert.alert('Success', successMessage, [
          { text: 'OK', onPress: () => router.replace('/feed') }
        ]);
      } else {
        Alert.alert('Error', data.detail || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a0a1a', '#2a0a2a']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  {isLogin ? 'Welcome Back' : 'Join Drezzle'}
                </Text>
                <Text style={styles.subtitle}>
                  {isLogin
                    ? 'Sign in to continue your musical journey'
                    : 'Create your account and start sharing music'}
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#666"
                    value={formData.username}
                    onChangeText={(text) => setFormData({ ...formData, username: text })}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                />
              </View>

              {!isLogin && (
                <View style={styles.roleContainer}>
                  <Text style={styles.roleTitle}>Scegli il tuo ruolo:</Text>
                  <View style={styles.rolesGrid}>
                    {roles.map((role) => (
                      <TouchableOpacity
                        key={role.value}
                        style={[
                          styles.roleOption,
                          formData.role === role.value && styles.roleOptionSelected,
                        ]}
                        onPress={() => setFormData({ ...formData, role: role.value })}
                      >
                        <View style={styles.roleHeader}>
                          <UserBadge role={role.value} size="small" />
                        </View>
                        <Text style={styles.roleDescription}>
                          {role.description}
                        </Text>
                        {role.value === 'expert' && (
                          <Text style={styles.roleNote}>
                            * Richiede verifica documenti
                          </Text>
                        )}
                        {role.value === 'label' && (
                          <Text style={styles.roleNote}>
                            * Richiede approvazione admin
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#666', '#666'] : ['#ff6b9d', '#c770f0']}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <Text style={styles.submitText}>Loading...</Text>
                  ) : (
                    <>
                      <Text style={styles.submitText}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsLogin(!isLogin)}
              >
                <Text style={styles.switchText}>
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
    fontWeight: '600',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleOption: {
    width: (width - 64) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 120,
  },
  roleOptionSelected: {
    borderColor: '#ff6b9d',
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
  },
  roleHeader: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
    marginBottom: 4,
  },
  roleNote: {
    fontSize: 10,
    color: '#ff6b9d',
    fontStyle: 'italic',
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'underline',
  },
});