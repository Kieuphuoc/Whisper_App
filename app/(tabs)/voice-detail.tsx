import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  user?: {
    name: string;
    avatar?: string;
  };
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
  likes: number;
  replies: number;
};

type Reaction = '❤️' | '👍' | '😊' | '🎵' | '💭';

export default function VoiceDetailScreen() {
  const router = useRouter();
  const { voicePinId } = useLocalSearchParams<{ voicePinId: string }>();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  // Mock data - trong thực tế sẽ fetch từ API
  const mockVoiceDetail: VoiceDetail = {
    id: voicePinId || '1',
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
    user: {
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    },
  };

  const mockComments: Comment[] = [
    {
      id: '1',
      text: 'Love the energy in this voice! 🎵',
      createdAt: '2024-01-15T11:00:00Z',
      user: {
        name: 'Sarah Wilson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      },
      likes: 5,
      replies: 1,
    },
    {
      id: '2',
      text: 'Central Park is beautiful this time of year!',
      createdAt: '2024-01-15T11:30:00Z',
      user: {
        name: 'Mike Johnson',
      },
      likes: 3,
      replies: 0,
    },
  ];

  useEffect(() => {
    setComments(mockComments);
  }, []);

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

  const handleComment = () => {
    if (!commentText.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung comment');
      return;
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText,
      createdAt: new Date().toISOString(),
      user: {
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      },
      likes: 0,
      replies: 0,
    };

    setComments([newComment, ...comments]);
    setCommentText('');
    setShowCommentInput(false);
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
                backgroundColor: isPlaying ? '#8b5cf6' : '#e5e7eb',
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

  const CommentItem = ({ comment }: { comment: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUser}>
          {comment.user.avatar ? (
            <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatar} />
          ) : (
            <View style={styles.defaultCommentAvatar}>
              <Ionicons name="person" size={16} color="#8b5cf6" />
            </View>
          )}
          <Text style={styles.commentUserName}>{comment.user.name}</Text>
        </View>
        <Text style={styles.commentTime}>
          {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="heart-outline" size={14} color="#6b7280" />
          <Text style={styles.commentActionText}>{comment.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="chatbubble-outline" size={14} color="#6b7280" />
          <Text style={styles.commentActionText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Detail</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          {mockVoiceDetail.user?.avatar ? (
            <Image source={{ uri: mockVoiceDetail.user.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={styles.defaultUserAvatar}>
              <Ionicons name="person" size={24} color="#8b5cf6" />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{mockVoiceDetail.user?.name || 'Anonymous'}</Text>
            <Text style={styles.userTimestamp}>
              {new Date(mockVoiceDetail.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
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

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowCommentInput(true)}
        >
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

      {/* Comment Input */}
      {showCommentInput && (
        <View style={styles.commentInputSection}>
          <TextInput
            style={styles.commentInput}
            placeholder="Viết comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <View style={styles.commentInputActions}>
            <TouchableOpacity 
              style={styles.cancelCommentButton}
              onPress={() => {
                setShowCommentInput(false);
                setCommentText('');
              }}
            >
              <Text style={styles.cancelCommentText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.postCommentButton, !commentText.trim() && styles.postCommentButtonDisabled]}
              onPress={handleComment}
              disabled={!commentText.trim()}
            >
              <Text style={styles.postCommentText}>Đăng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
        </View>

        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}

        {comments.length === 0 && (
          <View style={styles.emptyComments}>
            <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyCommentsText}>Chưa có comment nào</Text>
            <Text style={styles.emptyCommentsSubtext}>Hãy là người đầu tiên comment!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  userSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  defaultUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userTimestamp: {
    fontSize: 12,
    color: '#6b7280',
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
    backgroundColor: '#faf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  emotionText: {
    fontSize: 32,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8b5cf6',
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
    backgroundColor: '#faf5ff',
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
  commentInputSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  commentInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  commentInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelCommentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelCommentText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  postCommentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  postCommentButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  postCommentText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  commentsSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginTop: 8,
  },
  commentsHeader: {
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  commentItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  defaultCommentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  commentTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});
