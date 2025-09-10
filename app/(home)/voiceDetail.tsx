import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

import { MemoryCard } from '@/components/MemoryCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import Apis, { endpoints } from '../../configs/Apis';

type Comment = {
  id: string | number;
  userName: string;
  content: string;
  createdAt: string;
  likes: number;
  replies: Comment[];
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
    displayName:string;

    avatar?: string;
  };
  likes?: number;
  replies?: number;
};

const SAMPLE_AUDIO = 'https://cdn.pixabay.com/audio/2022/03/15/audio_9e2b8ec3c7.mp3';




export default function VoiceDetailScreen() {
  const { voicePinId } = useLocalSearchParams();

  const id = parseInt(voicePinId as string, 10);

  const [sound, setSound] = useState<null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);

  // const recorder = useAudioRecorder(SAMPLE_AUDIO);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);

  const progress = useMemo(() => {
    if (!durationMillis) return 0;
    return positionMillis / durationMillis;
  }, [positionMillis, durationMillis]);

  const formattedTime = useCallback((millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, []);

  const [voicePin, setVoicePin] = useState<VoicePin | null>(null);
  console.log("voicePin?.user?.displayName",voicePin?.user?.displayName)
  const [loading, setLoading] = useState(false);
  const [postLikes, setPostLikes] = useState<number>(0);
  const [postLiked, setPostLiked] = useState<boolean>(false);

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
  
  const CommentItem: React.FC<{
    item: Comment;
    depth?: number;
  }> = ({ item, depth = 0 }) => {
    const [showReplies, setShowReplies] = useState<boolean>(true);
    const isChild = depth > 0;

    return (
      <View style={[styles.commentRow, isChild && { marginLeft: 44 }]}>
        <View style={styles.avatar} />
        <View style={styles.commentBody}>
          <View style={styles.commentBubble}>
            <ThemedText type="defaultSemiBold">{item.userName}</ThemedText>
            <ThemedText>{item.content}</ThemedText>
          </View>
          <View style={styles.commentMetaRow}>
            <ThemedText style={styles.muted}>{item.createdAt}</ThemedText>
            <Pressable style={styles.metaBtn} onPress={() => setReplyTo({ id: String(item.id), userName: item.userName })}>
              <ThemedText type="link">Trả lời</ThemedText>
            </Pressable>
            {/* <Pressable style={styles.metaBtn} onPress={() => handleReactComment(item.id)}>
              <ThemedText type="link">Thích ({item.likes})</ThemedText>
            </Pressable>
            <Pressable style={styles.metaBtn} onPress={() => handleDeleteComment(item.id)}>
              <ThemedText type="link">Xóa</ThemedText>
            </Pressable> */}
          </View>
          {!!item.replies.length && (
            <Pressable onPress={() => setShowReplies((s) => !s)}>
              <ThemedText type="link">
                {showReplies ? 'Ẩn câu trả lời' : `Xem ${item.replies.length} câu trả lời`}
              </ThemedText>
            </Pressable>
          )}
          {showReplies &&
            item.replies.map((r) => <CommentItem key={r.id} item={r} depth={depth + 1} />)}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ThemedView style={styles.container}>
          {voicePin?.audioUrl && <MemoryCard memory={voicePin} nameUser={voicePin?.user?.displayName}></MemoryCard> }

        <View style={styles.divider} />

        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CommentItem item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingBottom: 96, paddingTop: 8 }}
          ListHeaderComponent={() => (
            <View style={{ paddingBottom: 8 }}>
              <ThemedText type="subtitle">Comment</ThemedText>
              {commentsLoading && (
                <ThemedText style={styles.muted}>Đang tải bình luận...</ThemedText>
              )}
              {replyTo && (
                <View style={styles.replyingTo}>
                  <ThemedText>
                    Đang trả lời: <ThemedText type="defaultSemiBold">{replyTo.userName}</ThemedText>
                  </ThemedText>
                  <Pressable onPress={() => setReplyTo(null)}>
                    <ThemedText type="link">Hủy</ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        />

        {/* Post reaction bar */}
        <View style={styles.postActions}>
          <Pressable style={[styles.postActionBtn, postLiked && styles.postActionBtnActive]} onPress={handleReactPost}>
            <ThemedText style={[styles.postActionText, postLiked && styles.postActionTextActive]}>Thích ({postLikes})</ThemedText>
          </Pressable>
        </View>

        <View style={styles.inputBar}>
          <View style={styles.inputAvatar} />
          <TextInput
            style={styles.textInput}
            placeholder={replyTo ? `Trả lời ${replyTo.userName}...` : 'Viết bình luận...'}
            placeholderTextColor={Colors.light.tabIconDefault}
            value={inputText}
            onChangeText={setInputText}
            // onSubmitEditing={handleSubmit}
            returnKeyType="send"
          />
          {/* <Pressable style={[styles.sendBtn, styles.sendBtnPrimary]} onPress={handleSubmit}>
            <ThemedText style={styles.sendBtnPrimaryText}>Gửi</ThemedText>
          </Pressable> */}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>

  );
}

const styles = StyleSheet.create({
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
  commentBubble: {
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    bottom: 0,
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
