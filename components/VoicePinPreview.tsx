import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioRecorder } from 'expo-audio';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

type VoicePinPreviewProps = {
  recorder: ReturnType<typeof useAudioRecorder>;
  createVoicePin: () => Promise<void>;
  description: string;
  setDescription: (description: string) => void;
  onClose?: () => void;
}

const VoicePinPreview = React.memo(({ recorder, createVoicePin, description, setDescription, onClose }: VoicePinPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [isPosting, setIsPosting] = useState(false);

  const intervalRef = useRef<any>(null);
  const player = useAudioPlayer(recorder.uri);

  // Memoize functions to prevent unnecessary re-renders
  const play = useCallback(() => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, player]);

  const formatMillis = useCallback((millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }, []);

  // Memoize calculated values
  const progressPercent = useMemo(() => {
    return duration > 0 ? (position / duration) * 100 : 0;
  }, [duration, position]);

  const handlePost = useCallback(async () => {
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả cho voice pin');
      return;
    }

    setIsPosting(true);
    try {
      await createVoicePin();
      console.log("Chạy được description")
      onClose?.();
    } catch (error) {
      console.log(error);
      Alert.alert('Lỗi', 'Không thể đăng voice pin');
    } finally {
      setIsPosting(false);
    }
  }, [description, createVoicePin, onClose]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Preview Voice Pin</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Audio Preview */}
          <View style={styles.audioSection}>
            <View style={styles.audioControls}>
              <TouchableOpacity onPress={play} style={styles.playButton}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              <View style={styles.audioInfo}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.duration}>{formatMillis(player.duration)}</Text>
              </View>
            </View>
          </View>

          {/* Description Input */}

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Description</Text>

            <TextInput
              style={styles.input}
              placeholder="Nhập mô tả cho voice pin của bạn..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>


          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isPosting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.postButton, isPosting && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <Text style={styles.postButtonText}>Posting...</Text>
              ) : (
                <Text style={styles.postButtonText}>Post Voice Pin</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>

  );
});

export default VoicePinPreview;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 16,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  audioSection: {
    marginBottom: 24,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  audioInfo: {
    flex: 1,
    marginLeft: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  duration: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  postButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  postButtonDisabled: {
    backgroundColor: '#c4b5fd',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
