import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { MemoryCard } from '@/components/MemoryCard';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import Apis, { endpoints } from '../../configs/Apis';

type Comment = {
  id: string | number;
  userName: string;
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
};

type VoicePin = {
  id: string;
  latitude: number;
  longitude: number;
  emotion: string;
  description: string;
  duration: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  audioUrl?: string;
  imageUrl?: string;
  address?: string;
  createdAt: string;
  user?: {
    id: number,
    username: string;
    displayName: string;
    avatar?: string;
  };
  likes?: number;
  replies?: number;
};

export default function VoiceDetailScreen() {
  const { voicePinId } = useLocalSearchParams();
  const id = parseInt(voicePinId as string, 10);

  const [voicePin, setVoicePin] = useState<VoicePin | null>(null);
  const [loading, setLoading] = useState(false);
  const [postLikes, setPostLikes] = useState<number>(0);
  const [postLiked, setPostLiked] = useState<boolean>(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<{ commentId: string | number; position: { x: number; y: number } } | null>(null);

  // Mock data cho comment
  useEffect(() => {
    const mockComments: Comment[] = [
      {
        id: 1,
        userName: 'Alice',
        content: 'This is amazing!',
        createdAt: '2025-09-10T10:00:00Z',
        likes: 2,
        replies: [
          { id: '1-1', userName: 'Bob', content: 'Totally agree!', createdAt: '2025-09-10T10:05:00Z', likes: 1 }
        ],
      },
      {
        id: 2,
        userName: 'Charlie',
        content: 'Love this voice pin!',
        createdAt: '2025-09-10T11:00:00Z',
        likes: 3,
      },
    ];
    setComments(mockComments);
  }, []);

  const handleReactPost = useCallback(() => {
    setPostLiked((liked) => {
      const next = !liked;
      setPostLikes((n) => (next ? n + 1 : Math.max(0, n - 1)));
      return next;
    });
  }, []);

  const loadVoiceDetail = async () => {
    try {
      setLoading(true);
      const res = await Apis.get(endpoints['voiceDetail'](id));
      const data = res.data?.data ?? res.data;
      setVoicePin(data);
      setPostLikes(data?.likes || 0);
    } catch (ex: any) {
      console.log('Error loading Voice Detail:', ex);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoiceDetail();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  const handleReactionPress = (commentId: string | number, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setShowReactionPicker({ commentId, position: { x: pageX, y: pageY } });
  };

  const handleReactionSelect = (commentId: string | number, reaction: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, likes: comment.likes + 1 };
      }
      return comment;
    }));
    setShowReactionPicker(null);
  };

  const ReactionPicker = () => {
    if (!showReactionPicker) return null;

    const reactions = [
      { name: 'heart', emoji: '❤️', color: '#ef4444' },
      { name: 'laugh', emoji: '😂', color: '#f59e0b' },
      { name: 'wow', emoji: '😮', color: '#3b82f6' },
      { name: 'sad', emoji: '😢', color: '#8b5cf6' },
      { name: 'angry', emoji: '😡', color: '#ef4444' },
    ];

    return (
      <View style={[styles.reactionPicker, {
        left: showReactionPicker.position.x - 100,
        top: showReactionPicker.position.y - 60
      }]}>
        {reactions.map((reaction, index) => (
          <TouchableOpacity
            key={reaction.name}
            style={[styles.reactionButton, { backgroundColor: reaction.color }]}
            onPress={() => handleReactionSelect(showReactionPicker.commentId, reaction.name)}
          >
            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      {/* Main Comment */}
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAvatar}>
            <Image
              source={{ uri: 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg' }}
              style={styles.avatarImage}
            />
          </View>
          <View style={styles.commentInfo}>
            <Text style={styles.commentUserName}>{item.userName}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.commentContent}>{item.content}</Text>

        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onLongPress={(e) => handleReactionPress(item.id, e)}
            onPress={() => { item.likes += 1; setComments([...comments]) }}
          >
            <Ionicons name="heart" size={14} color="#ef4444" />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={14} color="#6b7280" />
            <Text style={styles.actionText}>Trả lời</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={14} color="#6b7280" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Replies */}
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map(reply => (
            <View key={reply.id} style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <View style={styles.replyAvatar}>
                  <Image
                    source={{ uri: 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg' }}
                    style={styles.avatarImage}
                  />
                </View>
                <View style={styles.replyInfo}>
                  <Text style={styles.replyUserName}>{reply.userName}</Text>
                  <Text style={styles.replyTime}>{formatTimeAgo(reply.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.replyContent}>{reply.content}</Text>

              <View style={styles.replyActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onLongPress={(e) => handleReactionPress(reply.id, e)}
                  onPress={() => { reply.likes += 1; setComments([...comments]) }}
                >
                  <Ionicons name="heart-outline" size={12} color="#ef4444" />
                  <Text style={styles.actionText}>{reply.likes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ThemedView style={{ flex: 1 }}>
        {voicePin?.audioUrl && <MemoryCard memory={voicePin as any} nameUser={voicePin?.user?.displayName} />}

        {/* Reaction */}
        {/* <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity
            onPress={handleReactPost}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: postLiked ? '#8b5cf6' : '#faf5ff',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Ionicons
              name={postLiked ? "heart" : "heart-outline"}
              size={20}
              color={postLiked ? 'white' : '#8b5cf6'}
            />
            <Text style={{ marginLeft: 6, color: postLiked ? 'white' : '#8b5cf6', fontWeight: '600' }}>{postLikes}</Text>
          </TouchableOpacity>
        </View> */}

        {/* Comments */}
        <ReactionPicker />

        <FlatList
          data={comments}
          keyExtractor={item => item.id.toString()}
          renderItem={renderComment}
          ListHeaderComponent={() => (
            <View style={styles.commentsHeader}>
              <View style={styles.commentsHeaderContent}>
                <Ionicons name="chatbubbles-outline" size={20} color="#8b5cf6" />
                <Text style={styles.commentsHeaderText}>Bình luận</Text>
                <View style={styles.commentsCount}>
                  <Text style={styles.commentsCountText}>{comments.length}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyCommentsText}>Chưa có bình luận nào</Text>
              <Text style={styles.emptyCommentsSubtext}>Hãy là người đầu tiên bình luận!</Text>
            </View>
          )}
        />

        {/* Reaction Picker Overlay */}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  commentContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  commentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.08)',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  commentInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 1,
  },
  commentTime: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  commentContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.08)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  reactionPicker: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    zIndex: 1000,
  },
  reactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(139, 92, 246, 0.15)',
  },
  replyCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.06)',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    overflow: 'hidden',
  },
  replyInfo: {
    flex: 1,
  },
  replyUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 1,
  },
  replyTime: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  replyContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 6,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  commentsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  commentsCount: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  commentsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  playerCard: {
    padding: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  largeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ddd',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f1',
  },
  progressWrap: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  timeRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    marginRight: 12,
    marginTop: 4,
  },
  commentBody: {
    flex: 1,
    gap: 6,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postActions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  postActionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  postActionBtnActive: {
    backgroundColor: '#8b5cf6',
  },
  postActionText: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 12,
  },
  postActionTextActive: {
    color: '#fff',
  },
  metaBtn: {
    paddingVertical: 2,
  },
  muted: {
    color: '#888',
  },
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 30,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
    padding: 10,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  sendBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sendBtnPrimary: {
    backgroundColor: '#8b5cf6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  replyingTo: {
    marginTop: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
