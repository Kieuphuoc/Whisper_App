import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

type VoiceDetail = {
  id: string;
  emotion: string;
  duration: string;
  createdAt: string;
  description: string;
  location: string;
  audioUrl: string;
  imageUrl?: string;
  likes: number;
  replies: number;
  shares: number;
  deviceInfo: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

type Reaction = '❤️' | '👍' | '😊' | '🎵' | '💭';

export default function VoiceDetailScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [showReactions, setShowReactions] = useState(false);

  const mockVoiceDetail: VoiceDetail = {
    id: '1',
    emotion: '😊',
    duration: '1:23',
    createdAt: '2024-01-15T10:30:00Z',
    description: 'Morning jog vibes! The sun is shining and the air is crisp. Perfect day for a run in Central Park.',
    location: 'Central Park, New York',
    audioUrl: 'https://example.com/audio.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    likes: 15,
    replies: 3,
    shares: 2,
    deviceInfo: 'iPhone 15 Pro • iOS 17.2',
    coordinates: {
      latitude: 40.7829,
      longitude: -73.9654,
    },
  };

  const player = useAudioPlayer(mockVoiceDetail.audioUrl);

  const reactions: Reaction[] = ['❤️', '👍', '😊', '🎵', '💭'];

  const playPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReaction = (reaction: Reaction) => {
    setUserReaction(userReaction === reaction ? null : reaction);
    setShowReactions(false);
  };

  const WaveformVisualizer = () => (
    <View style={styles.waveformContainer}>
      <View style={styles.waveform}>
        {Array.from({ length: 50 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: Math.random() * 40 + 10,
                backgroundColor: isPlaying ? '#22c55e' : '#e5e7eb',
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.timeInfo}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
      </View>
    </View>
  );

  const ReactionButton = () => (
    <View style={styles.reactionContainer}>
      <TouchableOpacity
        style={styles.reactionButton}
        onPress={() => setShowReactions(!showReactions)}
      >
        <Text style={styles.reactionIcon}>
          {userReaction || '❤️'}
        </Text>
        <Text style={styles.reactionCount}>{mockVoiceDetail.likes}</Text>
      </TouchableOpacity>

      {showReactions && (
        <View style={styles.reactionsPopup}>
          {reactions.map((reaction) => (
            <TouchableOpacity
              key={reaction}
              style={styles.reactionOption}
              onPress={() => handleReaction(reaction)}
            >
              <Text style={styles.reactionOptionText}>{reaction}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Detail</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Emotion and Play Controls */}
      <View style={styles.playSection}>
        <View style={styles.emotionContainer}>
          <Text style={styles.emotionText}>{mockVoiceDetail.emotion}</Text>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={playPause}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color="#ffffff"
          />
        </TouchableOpacity>

        <WaveformVisualizer />
      </View>

      {/* Voice Info */}
      <View style={styles.infoSection}>
        <Text style={styles.description}>{mockVoiceDetail.description}</Text>
        
        <View style={styles.metadataContainer}>
          <View style={styles.metadataItem}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.metadataText}>{mockVoiceDetail.location}</Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.metadataText}>
              {new Date(mockVoiceDetail.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Ionicons name="phone-portrait-outline" size={16} color="#6b7280" />
            <Text style={styles.metadataText}>{mockVoiceDetail.deviceInfo}</Text>
          </View>
        </View>
      </View>

      {/* Optional Image */}
      {mockVoiceDetail.imageUrl && (
        <View style={styles.imageSection}>
          <Image
            source={{ uri: mockVoiceDetail.imageUrl }}
            style={styles.voiceImage}
            contentFit="cover"
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <ReactionButton />

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>{mockVoiceDetail.replies}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>{mockVoiceDetail.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Reply Section */}
      <View style={styles.replySection}>
        <View style={styles.replyHeader}>
          <Text style={styles.replyTitle}>Replies</Text>
          <TouchableOpacity>
            <Text style={styles.replyAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.replyInput}>
          <TouchableOpacity style={styles.replyButton}>
            <Ionicons name="mic" size={20} color="#22c55e" />
            <Text style={styles.replyButtonText}>Reply with voice</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
  },
  emotionContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  emotionText: {
    fontSize: 32,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  waveformContainer: {
    width: '100%',
    marginBottom: 16,
  },
  waveform: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: 8,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '400',
  },
  metadataContainer: {
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
  },
  imageSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginTop: 8,
  },
  voiceImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  reactionContainer: {
    position: 'relative',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
  },
  reactionIcon: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  reactionsPopup: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reactionOption: {
    padding: 8,
  },
  reactionOptionText: {
    fontSize: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  replySection: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginTop: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  replyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  replyAllText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  replyButtonText: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '500',
  },
});
