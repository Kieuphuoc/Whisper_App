import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Apis, { authApis, endpoints } from '../configs/Apis';

type VoicePin = {
  id: string;
  latitude: number;
  longitude: number;
  emotion: string;
  description: string;
  duration: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  audioUrl: string;
  imageUrl?: string;
  address?: string;
  createdAt: string;
  user?: {
    name: string;
    avatar?: string;
  };
  likes?: number;
  replies?: number;
};

type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null;

type Comment = {
  id: string;
  user: { name: string; avatar?: string };
  content: string;
  createdAt: string;
  replies?: Comment[];
};

export default function VoiceDetailScreen() {
  const router = useRouter();
  const { voicePinId, voicePinJson } = useLocalSearchParams<{ voicePinId?: string; voicePinJson?: string }>();

  const [voicePin, setVoicePin] = useState<VoicePin | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedReaction, setSelectedReaction] = useState<ReactionType>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<Exclude<ReactionType, null>, number>>({ like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 });

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const player = useAudioPlayer(voicePin?.audioUrl || undefined);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = useCallback(() => {
    if (!voicePin?.audioUrl) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, player, voicePin?.audioUrl]);

  const totalReactions = useMemo(() => Object.values(reactionCounts).reduce((a, b) => a + b, 0), [reactionCounts]);

  const loadVoicePin = useCallback(async () => {
    if (!voicePinId) return;
    try {
      setLoading(true);
      setError(null);

      // If full object passed via params, prefer it
      if (voicePinJson && !voicePin) {
        try {
          const parsed: VoicePin = JSON.parse(decodeURIComponent(String(voicePinJson)));
          if (parsed && parsed.id) {
            setVoicePin(parsed);
            setReactionCounts(prev => ({ ...prev, like: parsed.likes || 0 }));
            return;
          }
        } catch {}
      }

      // Try with auth first
      const token = await AsyncStorage.getItem('token');
      let detail: VoicePin | null = null;

      if (token) {
        try {
          const res = await authApis(token).get(endpoints.voice);
          const list: VoicePin[] = res.data?.data || [];
          detail = list.find(v => v.id === voicePinId) || null;
        } catch {}
      }

      if (!detail) {
        try {
          const res = await Apis.get(endpoints.voicePublic);
          const list: VoicePin[] = res.data?.data || [];
          detail = list.find(v => v.id === voicePinId) || null;
        } catch {}
      }

      if (!detail) {
        throw new Error('Không tìm thấy voice pin.');
      }

      setVoicePin(detail);
      // Seed reaction counts if available
      setReactionCounts(prev => ({ ...prev, like: detail.likes || 0 }));

      // Optionally load comments from API here if available
      // const commentsRes = await Apis.get(`${endpoints.voice}${voicePinId}/comments/`)
      // setComments(commentsRes.data?.data || [])
    } catch (e: any) {
      setError(e?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  }, [voicePinId]);

  useEffect(() => {
    loadVoicePin();
  }, [loadVoicePin]);

  const onSelectReaction = useCallback(async (reaction: Exclude<ReactionType, null>) => {
    if (!voicePin) return;
    setSelectedReaction(prev => (prev === reaction ? null : reaction));
    setReactionCounts(prev => {
      const next = { ...prev };
      // Remove previous selection count
      if (selectedReaction && next[selectedReaction] > 0) next[selectedReaction] -= 1;
      // Add new selection count (if toggled off, skip add)
      if (selectedReaction !== reaction) next[reaction] += 1;
      return next;
    });

    // Try to send to API if available
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await authApis(token).post(`/voice/${voicePin.id}/react/`, { reaction });
      }
    } catch {}
  }, [voicePin, selectedReaction]);

  const addComment = useCallback(async () => {
    const content = newComment.trim();
    if (!content) return;
    const temp: Comment = {
      id: `${Date.now()}`,
      user: { name: 'You' },
      content,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setComments(prev => [temp, ...prev]);
    setNewComment('');

    try {
      const token = await AsyncStorage.getItem('token');
      if (token && voicePin) {
        await authApis(token).post(`/voice/${voicePin.id}/comments/`, { content });
      }
    } catch (e) {}
  }, [newComment, voicePin]);

  const addReply = useCallback(async () => {
    const content = replyText.trim();
    if (!content || !replyTo) return;
    setComments(prev => prev.map(c => {
      if (c.id === replyTo) {
        const updated: Comment = { id: `${Date.now()}`, user: { name: 'You' }, content, createdAt: new Date().toISOString() } as Comment;
        const replies = Array.isArray(c.replies) ? [updated, ...c.replies] : [updated];
        return { ...c, replies };
      }
      return c;
    }));
    setReplyText('');
    setReplyTo(null);

    try {
      const token = await AsyncStorage.getItem('token');
      if (token && voicePin) {
        await authApis(token).post(`/voice/${voicePin.id}/comments/${replyTo}/replies/`, { content });
      }
    } catch (e) {}
  }, [replyText, replyTo, voicePin]);

  const renderReactionBar = useMemo(() => (
    <View style={styles.reactionBar}>
      {(
        [
          { key: 'like', label: 'Like', icon: 'thumbs-up' },
          { key: 'love', label: 'Love', icon: 'heart' },
          { key: 'haha', label: 'Haha', icon: 'happy' },
          { key: 'wow', label: 'Wow', icon: 'sparkles' },
          { key: 'sad', label: 'Sad', icon: 'sad' },
          { key: 'angry', label: 'Angry', icon: 'flame' },
        ] as const
      ).map(item => (
        <TouchableOpacity key={item.key} style={[styles.reactionItem, selectedReaction === item.key && styles.reactionItemActive]} onPress={() => onSelectReaction(item.key)}>
          <Ionicons name={item.icon as any} size={18} color={selectedReaction === item.key ? '#fff' : '#6b7280'} />
          <Text style={[styles.reactionText, selectedReaction === item.key && styles.reactionTextActive]}>{item.label}</Text>
          <Text style={[styles.reactionCount, selectedReaction === item.key && styles.reactionTextActive]}>{reactionCounts[item.key]}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.reactionTotal}>
        <Ionicons name="heart-circle" size={18} color="#ef4444" />
        <Text style={styles.reactionTotalText}>{totalReactions}</Text>
      </View>
    </View>
  ), [onSelectReaction, reactionCounts, selectedReaction, totalReactions]);

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{item.user.name?.[0] || 'U'}</Text>
      </View>
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>{item.user.name}</Text>
        <Text style={styles.commentContent}>{item.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity onPress={() => setReplyTo(item.id)}>
            <Text style={styles.commentActionText}>Trả lời</Text>
          </TouchableOpacity>
          <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        {Array.isArray(item.replies) && item.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {item.replies.map(r => (
              <View key={r.id} style={styles.replyItem}>
                <View style={styles.replyAvatar}>
                  <Text style={styles.replyAvatarText}>{r.user.name?.[0] || 'U'}</Text>
                </View>
                <View style={styles.replyBody}>
                  <Text style={styles.replyAuthor}>{r.user.name}</Text>
                  <Text style={styles.replyContent}>{r.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  if (!voicePinId) {
    return (
      <View style={styles.center}>
        <Text>Thiếu tham số voicePinId</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Pin Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.center}><Text>Đang tải...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text>{error}</Text></View>
        ) : voicePin ? (
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.userRow}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{voicePin.user?.name?.[0] || 'U'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{voicePin.user?.name || 'Unknown'}</Text>
                  <Text style={styles.timeText}>{new Date(voicePin.createdAt).toLocaleString()}</Text>
                </View>
                <View style={styles.visibilityPill}>
                  <Text style={styles.visibilityText}>{voicePin.visibility}</Text>
                </View>
              </View>

              <Text style={styles.description}>{voicePin.description}</Text>

              <View style={styles.audioPlayer}>
                <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.audioMeta}>Audio</Text>
                  <Text style={styles.audioSub}>{voicePin.audioUrl ? 'Streaming...' : 'No audio URL'}</Text>
                </View>
              </View>

              {renderReactionBar}
            </View>

            <View style={styles.commentComposer}>
              {replyTo && (
                <View style={styles.replyingTo}>
                  <Text style={styles.replyingToText}>Đang trả lời bình luận #{replyTo}</Text>
                  <TouchableOpacity onPress={() => { setReplyTo(null); setReplyText(''); }}>
                    <Ionicons name="close" size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}

              {!replyTo ? (
                <View style={styles.inputRow}>
                  <TextInput style={styles.input} placeholder="Viết bình luận..." value={newComment} onChangeText={setNewComment} multiline />
                  <TouchableOpacity style={styles.sendBtn} onPress={addComment}>
                    <Ionicons name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inputRow}>
                  <TextInput style={styles.input} placeholder="Viết phản hồi..." value={replyText} onChangeText={setReplyText} multiline />
                  <TouchableOpacity style={styles.sendBtn} onPress={addReply}>
                    <Ionicons name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderCommentItem}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={<View style={styles.emptyBox}><Text style={styles.emptyText}>Chưa có bình luận</Text></View>}
            />
          </View>
        ) : (
          <View style={styles.center}><Text>Không có dữ liệu</Text></View>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#374151',
    fontWeight: '700',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  visibilityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
  },
  visibilityText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 22,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioMeta: {
    color: '#fff',
    fontWeight: '700',
  },
  audioSub: {
    color: '#d1d5db',
    fontSize: 12,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  reactionItemActive: {
    backgroundColor: '#8b5cf6',
  },
  reactionText: {
    marginLeft: 6,
    color: '#6b7280',
    fontWeight: '600',
    marginRight: 4,
  },
  reactionTextActive: {
    color: '#fff',
  },
  reactionCount: {
    color: '#6b7280',
    fontWeight: '600',
  },
  reactionTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 6,
  },
  reactionTotalText: {
    color: '#111827',
    fontWeight: '700',
  },
  commentComposer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  replyingToText: {
    color: '#6b7280',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    color: '#374151',
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: '700',
    color: '#111827',
  },
  commentContent: {
    color: '#111827',
    marginTop: 2,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  commentActionText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  commentTime: {
    color: '#9ca3af',
    fontSize: 12,
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingLeft: 8,
    gap: 8,
  },
  replyItem: {
    flexDirection: 'row',
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  replyAvatarText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
  },
  replyBody: {
    flex: 1,
  },
  replyAuthor: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 13,
  },
  replyContent: {
    color: '#111827',
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#6b7280',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


