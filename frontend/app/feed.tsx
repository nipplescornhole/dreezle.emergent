import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import DrezzleLogo from '../components/DrezzleLogo';

const { width, height } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Content {
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

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
}

export default function FeedScreen() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedContents, setSavedContents] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // Helper function for role badge
  const getBadgeConfig = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'listener':
        return { color: '#6b7280', backgroundColor: 'rgba(107, 114, 128, 0.15)', icon: 'headset', label: 'Listener' };
      case 'creator':
        return { color: '#ff6b9d', backgroundColor: 'rgba(255, 107, 157, 0.15)', icon: 'mic', label: 'Creator' };
      case 'expert':
        return { color: '#45d4aa', backgroundColor: 'rgba(69, 212, 170, 0.15)', icon: 'star', label: 'Expert' };
      case 'label':
        return { color: '#c770f0', backgroundColor: 'rgba(199, 112, 240, 0.15)', icon: 'business', label: 'Label' };
      default:
        return { color: '#6b7280', backgroundColor: 'rgba(107, 114, 128, 0.15)', icon: 'person', label: 'User' };
    }
  };

  const renderBadge = (role: string, size: 'small' | 'medium' = 'small') => {
    const config = getBadgeConfig(role);
    const sizeConfig = size === 'small' 
      ? { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, iconSize: 12 }
      : { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, iconSize: 14 };

    return (
      <View style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.color,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
        }
      ]}>
        <Ionicons name={config.icon as any} size={sizeConfig.iconSize} color={config.color} style={styles.badgeIcon} />
        <Text style={[styles.badgeText, { color: config.color, fontSize: sizeConfig.fontSize }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    initializeApp();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      await checkAuthAndLoadData();
    } catch (error) {
      console.error('Initialization error:', error);
      await loadContents();
    }
  };

  const checkAuthAndLoadData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      await loadContents();
    }
  };

  const loadContents = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/contents`);
      if (response.ok) {
        const data = await response.json();
        setContents(data);
      }
    } catch (error) {
      console.error('Load contents error:', error);
      Alert.alert('Error', 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const playMedia = async (content: Content) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (content.content_type === 'audio' && content.audio_data) {
        // Play audio
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: `data:audio/mp3;base64,${content.audio_data}` },
          { shouldPlay: true, isLooping: true }
        );

        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } else if (content.content_type === 'video' && content.video_data) {
        // For video, the video component will handle playback
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Media play error:', error);
      Alert.alert('Error', 'Unable to play media');
    }
  };

  const togglePlayback = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const likeContent = async (contentId: string) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to like content');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/contents/${contentId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setContents((prev) =>
          prev.map((content) =>
            content.id === contentId
              ? {
                  ...content,
                  likes_count: result.liked
                    ? content.likes_count + 1
                    : content.likes_count - 1,
                }
              : content
          )
        );
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const saveContent = async (contentId: string) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to save content');
      return;
    }

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
        const result = await response.json();
        setSavedContents(prev => {
          const newSet = new Set(prev);
          if (result.saved) {
            newSet.add(contentId);
          } else {
            newSet.delete(contentId);
          }
          return newSet;
        });
        
        Alert.alert(
          'Success', 
          result.saved ? 'Content saved!' : 'Content unsaved!'
        );
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save content');
    }
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);

      // Auto-play media for current item
      const currentContent = contents[newIndex];
      if (currentContent && (currentContent.audio_data || currentContent.video_data)) {
        playMedia(currentContent);
      }
    }
  };

  const renderContentItem = ({ item, index }: { item: Content; index: number }) => (
    <View style={styles.contentContainer}>
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      />

      {/* Background Media */}
      {item.content_type === 'video' && item.video_data ? (
        // Video content - for web we'll use a placeholder since video needs special handling
        <View style={styles.backgroundImage}>
          <LinearGradient
            colors={['#ff6b9d', '#c770f0', '#45d4aa']}
            style={styles.backgroundImage}
          />
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam" size={80} color="white" />
            <Text style={styles.videoPlaceholderText}>Video Content</Text>
          </View>
        </View>
      ) : item.cover_image ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.cover_image}` }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#ff6b9d', '#c770f0', '#45d4aa']}
          style={styles.backgroundImage}
        />
      )}

      {/* Content Info */}
      <View style={styles.contentInfo}>
        <View style={styles.contentTypeIndicator}>
          <Ionicons
            name={item.content_type === 'video' ? 'videocam' : 'musical-notes'}
            size={16}
            color="white"
          />
          <Text style={styles.contentTypeText}>
            {item.content_type.toUpperCase()}
          </Text>
        </View>
        
        {/* Creator Info with Badge */}
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName}>
            {item.username || 'Unknown User'}
          </Text>
          {item.user_role && renderBadge(item.user_role, 'small')}
        </View>
        
        <Text style={styles.contentTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.contentDescription}>{item.description}</Text>
        )}
        <Text style={styles.contentStats}>
          {item.likes_count} likes • {item.comments_count} comments
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => likeContent(item.id)}
        >
          <Ionicons name="heart" size={32} color="#ff6b9d" />
          <Text style={styles.actionText}>{item.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/comments?contentId=${item.id}`)}
        >
          <Ionicons name="chatbubble" size={32} color="white" />
          <Text style={styles.actionText}>{item.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.playButton]}
          onPress={togglePlayback}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Drezzle...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person" size={24} color="white" />
        </TouchableOpacity>

        <DrezzleLogo size="small" />

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/upload')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content Feed */}
      <FlatList
        ref={flatListRef}
        data={contents}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height - 100}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="home" size={24} color="#ff6b9d" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="search" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/upload')}
        >
          <Ionicons name="add-circle" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="heart" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width,
    height: height - 100,
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  contentInfo: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 80,
    zIndex: 2,
  },
  contentTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  contentTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  creatorName: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontWeight: '600',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 18,
  },
  contentStats: {
    fontSize: 12,
    color: '#999',
  },
  videoPlaceholder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -50 }],
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionButtons: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    alignItems: 'center',
    zIndex: 2,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  playButton: {
    backgroundColor: 'rgba(255, 107, 157, 0.8)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingVertical: 15,
    paddingBottom: 25,
  },
  navButton: {
    alignItems: 'center',
  },
});