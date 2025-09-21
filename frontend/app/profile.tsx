import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserBadge from '../components/UserBadge';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
  badge_status?: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/auth?mode=login');
        return;
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } catch (error) {
      console.error('Profile load error:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('access_token');
            router.replace('/');
          },
        },
      ]
    );
  };

  const requestBadge = async () => {
    if (user?.role !== 'creator') {
      Alert.alert('Info', 'Only creators can request expert badges');
      return;
    }

    Alert.prompt(
      'Request Expert Badge',
      'Tell us why you deserve an expert badge:',
      async (reason) => {
        if (!reason?.trim()) return;

        try {
          const token = await AsyncStorage.getItem('access_token');
          const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/badge-requests`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: reason.trim() }),
          });

          if (response.ok) {
            Alert.alert('Success', 'Badge request submitted for review!');
            loadUserProfile(); // Refresh profile
          } else {
            const error = await response.json();
            Alert.alert('Error', error.detail || 'Failed to submit request');
          }
        } catch (error) {
          Alert.alert('Error', 'Network error');
        }
      }
    );
  };

  const requestLabel = async () => {
    Alert.prompt(
      'Request Label Status',
      'Enter your label name:',
      async (labelName) => {
        if (!labelName?.trim()) return;

        Alert.prompt(
          'Label Description',
          'Describe your label:',
          async (description) => {
            if (!description?.trim()) return;

            try {
              const token = await AsyncStorage.getItem('access_token');
              const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/label-requests`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  label_name: labelName.trim(),
                  description: description.trim(),
                }),
              });

              if (response.ok) {
                Alert.alert('Success', 'Label request submitted for review!');
              } else {
                const error = await response.json();
                Alert.alert('Error', error.detail || 'Failed to submit request');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error');
            }
          }
        );
      }
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'creator': return '#ff6b9d';
      case 'expert': return '#45d4aa';
      case 'label': return '#c770f0';
      default: return '#666';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'creator': return 'mic';
      case 'expert': return 'star';
      case 'label': return 'business';
      default: return 'person';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please login to view profile</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/auth?mode=login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <Text style={styles.title}>Profile</Text>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {/* Settings functionality */}}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userContainer}>
            <LinearGradient
              colors={['#ff6b9d', '#c770f0']}
              style={styles.avatarContainer}
            >
              <Ionicons name="person" size={40} color="white" />
            </LinearGradient>

            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>

            <View style={styles.roleContainer}>
              <Ionicons
                name={getRoleIcon(user.role) as any}
                size={16}
                color={getRoleColor(user.role)}
              />
              <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
              {user.is_verified && (
                <Ionicons name="checkmark-circle" size={16} color="#45d4aa" />
              )}
            </View>

            {user.badge_status && (
              <View style={styles.badgeStatus}>
                <Text style={styles.badgeStatusText}>
                  Badge Status: {user.badge_status}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            {user.role === 'creator' && !user.badge_status && (
              <TouchableOpacity style={styles.actionItem} onPress={requestBadge}>
                <View style={styles.actionItemLeft}>
                  <Ionicons name="star" size={24} color="#45d4aa" />
                  <Text style={styles.actionItemText}>Request Expert Badge</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionItem} onPress={requestLabel}>
              <View style={styles.actionItemLeft}>
                <Ionicons name="business" size={24} color="#c770f0" />
                <Text style={styles.actionItemText}>Request Label Status</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/upload')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="add-circle" size={24} color="#ff6b9d" />
                <Text style={styles.actionItemText}>Upload Content</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <View style={styles.settingItem}>
              <View style={styles.actionItemLeft}>
                <Ionicons name="notifications" size={24} color="#666" />
                <Text style={styles.actionItemText}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#333', true: '#ff6b9d' }}
                thumbColor={notificationsEnabled ? '#fff' : '#ccc'}
              />
            </View>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionItemLeft}>
                <Ionicons name="shield-checkmark" size={24} color="#666" />
                <Text style={styles.actionItemText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionItemLeft}>
                <Ionicons name="help-circle" size={24} color="#666" />
                <Text style={styles.actionItemText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionItemLeft}>
                <Ionicons name="information-circle" size={24} color="#666" />
                <Text style={styles.actionItemText}>About</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#ff4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
    fontSize: 18,
    color: '#ff6b9d',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeStatus: {
    marginTop: 8,
    backgroundColor: 'rgba(69, 212, 170, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeStatusText: {
    fontSize: 12,
    color: '#45d4aa',
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: 32,
  },
  settingsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionItemText: {
    fontSize: 16,
    color: 'white',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
  },
});