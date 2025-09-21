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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function UploadScreen() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'audio' | 'video'>('audio');
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Convert to base64 (simplified for demo)
        const base64Audio = await fileToBase64(asset.uri);
        setAudioFile(base64Audio);
        Alert.alert('Success', 'Audio file selected!');
      }
    } catch (error) {
      console.error('Audio picker error:', error);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        duration: 60, // Max 60 seconds
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Convert to base64 (simplified for demo - in real app you'd handle this differently)
        const base64Video = await fileToBase64(asset.uri);
        setVideoFile(base64Video);
        setDuration(asset.duration || null);
        Alert.alert('Success', 'Video file selected!');
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to pick video file');
    }
  };

  const pickCoverImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImage(result.assets[0].base64!);
        Alert.alert('Success', 'Cover image selected!');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const fileToBase64 = async (uri: string): Promise<string> => {
    // This is a simplified conversion for demo purposes
    // In a real app, you'd use proper file reading methods
    return 'demo-base64-file-data';
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (contentType === 'audio' && !audioFile) {
      Alert.alert('Error', 'Please select an audio file');
      return;
    }

    if (contentType === 'video' && !videoFile) {
      Alert.alert('Error', 'Please select a video file');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'Please login to upload content');
        router.push('/auth?mode=login');
        return;
      }

      const uploadData = {
        title: title.trim(),
        description: description.trim() || null,
        content_type: contentType,
        audio_data: contentType === 'audio' ? audioFile : null,
        video_data: contentType === 'video' ? videoFile : null,
        cover_image: coverImage,
        duration: duration,
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(uploadData),
      });

      if (response.ok) {
        Alert.alert(
          'Success!',
          `Your ${contentType} content has been uploaded successfully!`,
          [{ text: 'OK', onPress: () => router.push('/feed') }]
        );
        
        // Reset form
        setTitle('');
        setDescription('');
        setAudioFile(null);
        setVideoFile(null);
        setCoverImage(null);
        setDuration(null);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = title.trim() && ((contentType === 'audio' && audioFile) || (contentType === 'video' && videoFile));

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

              <Text style={styles.title}>Upload Content</Text>

              <TouchableOpacity
                style={[styles.uploadButton, !isFormValid && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={loading || !isFormValid}
              >
                <Text style={[styles.uploadButtonText, !isFormValid && styles.uploadButtonTextDisabled]}>
                  {loading ? 'Uploading...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content Type Selector */}
            <View style={styles.contentTypeContainer}>
              <Text style={styles.sectionTitle}>Content Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, contentType === 'audio' && styles.typeOptionSelected]}
                  onPress={() => setContentType('audio')}
                >
                  <Ionicons
                    name="musical-notes"
                    size={24}
                    color={contentType === 'audio' ? '#ff6b9d' : '#666'}
                  />
                  <Text style={[styles.typeText, contentType === 'audio' && styles.typeTextSelected]}>
                    Audio
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeOption, contentType === 'video' && styles.typeOptionSelected]}
                  onPress={() => setContentType('video')}
                >
                  <Ionicons
                    name="videocam"
                    size={24}
                    color={contentType === 'video' ? '#ff6b9d' : '#666'}
                  />
                  <Text style={[styles.typeText, contentType === 'video' && styles.typeTextSelected]}>
                    Video
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Title Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Give your ${contentType} a catchy title...`}
                  placeholderTextColor="#666"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
                <Text style={styles.charCount}>{title.length}/100</Text>
              </View>

              {/* Description Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={`Tell us about your ${contentType}...`}
                  placeholderTextColor="#666"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              {/* Media Upload */}
              <View style={styles.uploadSection}>
                <Text style={styles.sectionTitle}>
                  {contentType === 'audio' ? 'Audio File *' : 'Video File *'}
                </Text>
                <TouchableOpacity
                  style={[styles.uploadCard, (audioFile || videoFile) && styles.uploadCardSelected]}
                  onPress={contentType === 'audio' ? pickAudio : pickVideo}
                >
                  <Ionicons
                    name={
                      (audioFile || videoFile)
                        ? "checkmark-circle"
                        : contentType === 'audio'
                        ? "musical-notes"
                        : "videocam"
                    }
                    size={40}
                    color={(audioFile || videoFile) ? "#45d4aa" : "#666"}
                  />
                  <Text style={[styles.uploadCardText, (audioFile || videoFile) && styles.uploadCardTextSelected]}>
                    {(audioFile || videoFile)
                      ? `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} file selected`
                      : `Select ${contentType} file`
                    }
                  </Text>
                  <Text style={styles.uploadCardSubtext}>
                    {contentType === 'audio'
                      ? 'MP3, WAV, AAC supported'
                      : 'MP4, MOV supported (max 60s)'
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Cover Image Upload */}
              <View style={styles.uploadSection}>
                <Text style={styles.sectionTitle}>Cover Image</Text>
                <TouchableOpacity
                  style={[styles.uploadCard, coverImage && styles.uploadCardSelected]}
                  onPress={pickCoverImage}
                >
                  {coverImage ? (
                    <View style={styles.imagePreview}>
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${coverImage}` }}
                        style={styles.previewImage}
                      />
                      <Text style={[styles.uploadCardText, styles.uploadCardTextSelected]}>
                        Cover image selected
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="image" size={40} color="#666" />
                      <Text style={styles.uploadCardText}>
                        Add cover image
                      </Text>
                      <Text style={styles.uploadCardSubtext}>
                        {contentType === 'video' ? 'Optional - video thumbnail will be used if not provided' : 'Square images work best'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Guidelines */}
              <View style={styles.guidelinesContainer}>
                <Text style={styles.guidelinesTitle}>Upload Guidelines</Text>
                <View style={styles.guideline}>
                  <Ionicons name="checkmark" size={16} color="#45d4aa" />
                  <Text style={styles.guidelineText}>
                    {contentType === 'audio' ? 'Audio files up to 10MB' : 'Video files up to 50MB (max 60s)'}
                  </Text>
                </View>
                <View style={styles.guideline}>
                  <Ionicons name="checkmark" size={16} color="#45d4aa" />
                  <Text style={styles.guidelineText}>Only upload original content</Text>
                </View>
                <View style={styles.guideline}>
                  <Ionicons name="checkmark" size={16} color="#45d4aa" />
                  <Text style={styles.guidelineText}>Respectful content only</Text>
                </View>
                {contentType === 'video' && (
                  <View style={styles.guideline}>
                    <Ionicons name="checkmark" size={16} color="#45d4aa" />
                    <Text style={styles.guidelineText}>Video with integrated audio preferred</Text>
                  </View>
                )}
              </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  uploadButton: {
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#333',
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  uploadButtonTextDisabled: {
    color: '#666',
  },
  contentTypeContainer: {
    marginBottom: 24,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeOptionSelected: {
    borderColor: '#ff6b9d',
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  typeTextSelected: {
    color: '#ff6b9d',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  uploadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 12,
    fontWeight: '600',
  },
  uploadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  uploadCardSelected: {
    borderColor: '#45d4aa',
    backgroundColor: 'rgba(69, 212, 170, 0.1)',
    borderStyle: 'solid',
  },
  uploadCardText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  uploadCardTextSelected: {
    color: '#45d4aa',
  },
  uploadCardSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  guidelinesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
  },
  guidelinesTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginBottom: 12,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 12,
    color: '#ccc',
    marginLeft: 8,
  },
});