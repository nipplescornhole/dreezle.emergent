import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface SavedContent {
  id: string;
  user_id: string;
  username?: string;
  user_role?: string;
  title: string;
  description?: string;
  content_type: string;
  audio_data?: string;
  video_data?: string;
  cover_image?: string;
  duration?: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function SavedScreen() {
  const [savedContents, setSavedContents] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedContents();
  }, []);

  const loadSavedContents = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/auth?mode=login');
        return;
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/saved-contents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedContents(data);
      } else {
        Alert.alert('Error', 'Failed to load saved content');
      }
    } catch (error) {
      console.error('Load saved contents error:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const unsaveContent = async (contentId: string) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/contents/${contentId}/save`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSavedContents(prev => prev.filter(content => content.id !== contentId));
        Alert.alert('Success', 'Content unsaved!');
      }
    } catch (error) {
      console.error('Unsave error:', error);
      Alert.alert('Error', 'Failed to unsave content');
    }
  };

  const renderContentItem = ({ item }: { item: SavedContent }) => (
    <TouchableOpacity
      style={styles.contentCard}
      onPress={() => {
        // Navigate back to feed or open content detail
        router.push('/feed');
      }}
    >
      {item.cover_image && (
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.cover_image}` }}
          style={styles.contentImage}
        />
      )}
      
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle}>{item.title}</Text>
        <Text style={styles.contentUsername}>by {item.username || 'Unknown User'}</Text>
        {item.description && (
          <Text style={styles.contentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.contentStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color="#ff6b9d" />
            <Text style={styles.statText}>{item.likes_count}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={16} color="#ccc" />
            <Text style={styles.statText}>{item.comments_count}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons 
              name={item.content_type === 'audio' ? 'musical-notes' : 'videocam'} 
              size={16} 
              color="#c770f0" 
            />
            <Text style={styles.statText}>{item.content_type}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.unsaveButton}
        onPress={() => unsaveContent(item.id)}
      >
        <Ionicons name="bookmark" size={24} color="#ff6b9d" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Saved Content...</Text>
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

          <Text style={styles.title}>Saved Content</Text>

          <View style={{ width: 24 }} />
        </View>

        {savedContents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={80} color="#666" />
            <Text style={styles.emptyTitle}>No Saved Content</Text>
            <Text style={styles.emptyDescription}>
              Save your favorite music and videos to access them here
            </Text>
            <Link href="/feed" asChild>
              <TouchableOpacity style={styles.browseButton}>
                <Text style={styles.browseButtonText}>Browse Content</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <FlatList
            data={savedContents}
            renderItem={renderContentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  contentUsername: {
    fontSize: 14,
    color: '#ff6b9d',
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 16,
  },
  contentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  unsaveButton: {
    padding: 8,
  },
});