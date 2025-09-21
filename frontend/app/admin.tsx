import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AdminStats {
  total_users: number;
  total_contents: number;
  pending_expert_requests: number;
  pending_label_requests: number;
  users_by_role: { [key: string]: number };
  recent_registrations: number;
}

interface PendingRequest {
  id: string;
  email: string;
  username: string;
  verification_documents?: string;
  verification_description?: string;
  created_at: string;
  submitted_at?: string;
}

interface PendingVerifications {
  expert_requests: PendingRequest[];
  label_requests: PendingRequest[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionReason, setDecisionReason] = useState('');
  const [requestType, setRequestType] = useState<'expert' | 'label'>('expert');
  const { t } = useLanguage();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Access Denied', 'Please login as admin');
        router.replace('/auth?mode=login');
        return;
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const user = await response.json();
        if (user.role !== 'admin') {
          Alert.alert('Access Denied', 'Admin access required');
          router.replace('/');
          return;
        }
        loadDashboardData();
      } else {
        Alert.alert('Error', 'Failed to verify admin access');
        router.replace('/auth?mode=login');
      }
    } catch (error) {
      console.error('Admin access check error:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      // Load stats and pending verifications in parallel
      const [statsResponse, pendingResponse] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/pending-verifications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      if (statsResponse.ok && pendingResponse.ok) {
        const statsData = await statsResponse.json();
        const pendingData = await pendingResponse.json();
        
        setStats(statsData);
        setPendingVerifications(pendingData);
      } else {
        Alert.alert('Error', 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleVerificationDecision = async (decision: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    try {
      const token = await AsyncStorage.getItem('access_token');
      const endpoint = requestType === 'expert' 
        ? `/api/admin/verify-expert/${selectedRequest.id}`
        : `/api/admin/verify-label/${selectedRequest.id}`;

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          reason: decision === 'reject' ? decisionReason : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Success', result.message);
        setShowDecisionModal(false);
        setSelectedRequest(null);
        setDecisionReason('');
        loadDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Decision error:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  const openDecisionModal = (request: PendingRequest, type: 'expert' | 'label') => {
    setSelectedRequest(request);
    setRequestType(type);
    setShowDecisionModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'listener': return '#6b7280';
      case 'creator': return '#ff6b9d';
      case 'expert': return '#45d4aa';
      case 'label': return '#c770f0';
      case 'admin': return '#fbbf24';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento Dashboard Admin...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a0a1a', '#2a0a2a']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>Admin Dashboard</Text>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Overview */}
          {stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Statistiche Generali</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={32} color="#ff6b9d" />
                  <Text style={styles.statNumber}>{stats.total_users}</Text>
                  <Text style={styles.statLabel}>Utenti Totali</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="musical-notes" size={32} color="#c770f0" />
                  <Text style={styles.statNumber}>{stats.total_contents}</Text>
                  <Text style={styles.statLabel}>Contenuti</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="hourglass" size={32} color="#45d4aa" />
                  <Text style={styles.statNumber}>
                    {stats.pending_expert_requests + stats.pending_label_requests}
                  </Text>
                  <Text style={styles.statLabel}>Richieste Pending</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="person-add" size={32} color="#fbbf24" />
                  <Text style={styles.statNumber}>{stats.recent_registrations}</Text>
                  <Text style={styles.statLabel}>Nuovi (7gg)</Text>
                </View>
              </View>

              {/* Users by Role */}
              <Text style={styles.subsectionTitle}>Utenti per Ruolo</Text>
              <View style={styles.rolesList}>
                {Object.entries(stats.users_by_role).map(([role, count]) => (
                  <View key={role} style={styles.roleItem}>
                    <View style={[styles.roleDot, { backgroundColor: getRoleColor(role) }]} />
                    <Text style={styles.roleText}>{role}: </Text>
                    <Text style={styles.roleCount}>{count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pending Verifications */}
          {pendingVerifications && (
            <View style={styles.verificationsContainer}>
              <Text style={styles.sectionTitle}>Richieste di Verifica</Text>

              {/* Expert Requests */}
              {pendingVerifications.expert_requests.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>
                    Richieste Expert ({pendingVerifications.expert_requests.length})
                  </Text>
                  {pendingVerifications.expert_requests.map((request) => (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestUsername}>{request.username}</Text>
                        <Text style={styles.requestEmail}>{request.email}</Text>
                      </View>
                      <Text style={styles.requestDate}>
                        Richiesta: {formatDate(request.created_at)}
                      </Text>
                      {request.verification_description && (
                        <Text style={styles.requestDescription}>
                          {request.verification_description}
                        </Text>
                      )}
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => openDecisionModal(request, 'expert')}
                        >
                          <Text style={styles.actionButtonText}>Gestisci</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Label Requests */}
              {pendingVerifications.label_requests.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>
                    Richieste Label ({pendingVerifications.label_requests.length})
                  </Text>
                  {pendingVerifications.label_requests.map((request) => (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestUsername}>{request.username}</Text>
                        <Text style={styles.requestEmail}>{request.email}</Text>
                      </View>
                      <Text style={styles.requestDate}>
                        Richiesta: {formatDate(request.created_at)}
                      </Text>
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => openDecisionModal(request, 'label')}
                        >
                          <Text style={styles.actionButtonText}>Gestisci</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {pendingVerifications.expert_requests.length === 0 && 
               pendingVerifications.label_requests.length === 0 && (
                <Text style={styles.noRequestsText}>
                  Nessuna richiesta di verifica pending
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Decision Modal */}
        <Modal
          visible={showDecisionModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDecisionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Gestisci Richiesta {requestType === 'expert' ? 'Expert' : 'Label'}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDecisionModal(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {selectedRequest && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalUserInfo}>
                    Utente: {selectedRequest.username} ({selectedRequest.email})
                  </Text>
                  
                  {selectedRequest.verification_description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Descrizione:</Text>
                      <Text style={styles.descriptionText}>
                        {selectedRequest.verification_description}
                      </Text>
                    </View>
                  )}

                  <View style={styles.decisionSection}>
                    <Text style={styles.decisionLabel}>Motivo (per rifiuto):</Text>
                    <TextInput
                      style={styles.reasonInput}
                      placeholder="Inserisci motivo del rifiuto..."
                      placeholderTextColor="#666"
                      value={decisionReason}
                      onChangeText={setDecisionReason}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.decisionButton, styles.approveDecisionButton]}
                      onPress={() => handleVerificationDecision('approve')}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.decisionButtonText}>Approva</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.decisionButton, styles.rejectDecisionButton]}
                      onPress={() => handleVerificationDecision('reject')}
                    >
                      <Ionicons name="close" size={20} color="white" />
                      <Text style={styles.decisionButtonText}>Rifiuta</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
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
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
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
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  statsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 20,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  rolesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  roleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  roleText: {
    fontSize: 14,
    color: '#ccc',
    textTransform: 'capitalize',
  },
  roleCount: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  verificationsContainer: {
    marginBottom: 32,
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requestHeader: {
    marginBottom: 8,
  },
  requestUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  requestEmail: {
    fontSize: 14,
    color: '#999',
  },
  requestDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  requestDescription: {
    fontSize: 14,
    color: '#ccc',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#45d4aa',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noRequestsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalUserInfo: {
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  decisionSection: {
    marginBottom: 24,
  },
  decisionLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    fontWeight: '600',
  },
  reasonInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  decisionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveDecisionButton: {
    backgroundColor: '#45d4aa',
  },
  rejectDecisionButton: {
    backgroundColor: '#ff4444',
  },
  decisionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});