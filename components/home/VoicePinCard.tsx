import { VoicePin } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
} from "react-native";
import { Easing as ReanimatedEasing } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { theme } from "@/constants/Theme";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "@/configs/Apis";
import { BlurView } from "expo-blur";
import { View as MotiView } from "moti";
import { EMOTION_COLORS, EmotionType } from "@/constants/Emotions";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Text } from "../ui/text";

const { width } = Dimensions.get("window");

// ─── helpers ──────────────────────────────────────────────
function formatDuration(secs?: number): string {
  if (!secs) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Vừa xong";
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

const VISIBILITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  PUBLIC: "earth-outline",
  FRIENDS: "people-outline",
  PRIVATE: "lock-closed-outline",
};

const EMOTION_COLOR = EMOTION_COLORS;

const REACTION_TYPES = [
  { type: "LIKE", emoji: "👍" },
  { type: "LOVE", emoji: "❤️" },
  { type: "LAUGH", emoji: "😂" },
  { type: "WOW", emoji: "😲" },
  { type: "SAD", emoji: "😢" },
  { type: "ANGRY", emoji: "😡" },
];

function FloatingEmoji({ emoji, onComplete }: { emoji: string; onComplete: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const xOffset = useRef((Math.random() - 0.5) * 60).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000 + Math.random() * 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(onComplete);
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -150] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, xOffset] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0.5, 1.5, 1, 0.8] });

  return (
    <Animated.Text style={[styles.floatingEmoji, { transform: [{ translateY }, { translateX }, { scale }], opacity }]}>
      {emoji}
    </Animated.Text>
  );
}

function WavyRipple({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  if (!isPlaying) return null;

  const rippleColor = color && color.startsWith('#') ? color : '#fb7185';

  return (
    <View style={styles.rippleContainer} pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          from={{ scale: 1, opacity: 0.8, rotate: "0deg", skewX: "0deg" }}
          animate={{
            scale: 2.5,
            opacity: 0,
            rotate: i % 2 === 0 ? "20deg" : "-20deg",
            skewX: i % 2 === 0 ? "10deg" : "-10deg",
          }}
          transition={{
            type: "timing",
            duration: 3500,
            loop: true,
            delay: i * 1000,
            repeatReverse: false,
            rotate: {
              type: "timing",
              duration: 1000,
              loop: true,
              repeatReverse: true,
            },
            skewX: {
              type: "timing",
              duration: 1200,
              loop: true,
              repeatReverse: true,
            }
          }}
          style={[styles.rippleRing, { borderColor: rippleColor }]}
        />
      ))}
      {[0, 1].map((i) => (
        <MotiView
          key={`detail-${i}`}
          from={{ scale: 1.2, opacity: 0.5, rotate: "0deg" }}
          animate={{
            scale: 2.2,
            opacity: 0,
            rotate: i % 2 === 0 ? "-30deg" : "30deg",
          }}
          transition={{
            type: "timing",
            duration: 4000,
            loop: true,
            delay: i * 1500 + 500,
            repeatReverse: false,
            rotate: {
              type: "timing",
              duration: 2000,
              loop: true,
              repeatReverse: true,
            }
          }}
          style={[styles.rippleRing, { borderColor: rippleColor, borderWidth: 1, borderStyle: 'dotted' }]}
        />
      ))}
    </View>
  );
}

export default function VoicePinTurntable({ pin, onClose, autoPlay = false }: { pin: VoicePin; onClose: () => void; autoPlay?: boolean }) {
  const colorScheme = useColorScheme() || 'light';
  const currentTheme = theme[colorScheme];
  const router = useRouter();

  // Open/close animation for the overlay card
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardTranslateY = useRef(new Animated.Value(18)).current;
  const [isClosing, setIsClosing] = useState(false);

  const player = useAudioPlayer(pin.audioUrl);
  const { playing } = useAudioPlayerStatus(player);

  const [reactionCount, setReactionCount] = useState(pin.reactionsCount ?? 0);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  const [showReactions, setShowReactions] = useState(false);
  const reactionAnim = useRef(new Animated.Value(0)).current;
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string }[]>([]);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const armAnim = useRef(new Animated.Value(0)).current;
  const rotationProgress = useRef(0);
  const isPlayingRef = useRef(false);

  const [isThinking, setIsThinking] = useState(false);
  const [transcription, setTranscription] = useState(pin.transcription);
  const [showTranscription, setShowTranscription] = useState(false);

  // ── Report state ───────────────────────────────────
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const REPORT_REASONS = [
    { key: 'SPAM', label: 'Spam', icon: 'mail-unread-outline' as const },
    { key: 'HARASSMENT', label: 'Quấy rối', icon: 'hand-left-outline' as const },
    { key: 'HATE_SPEECH', label: 'Ngôn từ thù hận', icon: 'warning-outline' as const },
    { key: 'VIOLENCE', label: 'Bạo lực', icon: 'skull-outline' as const },
    { key: 'NUDITY', label: 'Nội dung nhạy cảm', icon: 'eye-off-outline' as const },
    { key: 'MISINFORMATION', label: 'Thông tin sai lệch', icon: 'newspaper-outline' as const },
    { key: 'COPYRIGHT', label: 'Vi phạm bản quyền', icon: 'copy-outline' as const },
    { key: 'OTHER', label: 'Lý do khác', icon: 'ellipsis-horizontal-outline' as const },
  ];

  const handleReport = async (reason: string) => {
    setReportLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Thông báo', 'Bạn cần đăng nhập để báo cáo.');
        return;
      }
      const api = authApis(token);
      await api.post(endpoints.submitReport, { voicePinId: pin.id, reason });
      setHasReported(true);
      setShowReportModal(false);
      Alert.alert('Cảm ơn!', 'Báo cáo của bạn đã được ghi nhận. Chúng tôi sẽ xem xét sớm nhất.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setReportLoading(false);
    }
  };

  const toggleReactions = () => {
    if (showReactions) {
      Animated.spring(reactionAnim, { toValue: 0, useNativeDriver: true }).start(() => setShowReactions(false));
    } else {
      setShowReactions(true);
      Animated.spring(reactionAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  };

  const fireFloatingEmoji = (emoji: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setFloatingEmojis(prev => [...prev, { id, emoji }]);
  };

  useEffect(() => {
    overlayOpacity.setValue(0);
    cardScale.setValue(0.94);
    cardTranslateY.setValue(18);
    setIsClosing(false);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 18,
        stiffness: 260,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [pin.id]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.96,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 10,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
      else onClose();
    });
  };

  useEffect(() => {
    isPlayingRef.current = playing;

    const startRotation = (startValue: number) => {
      if (!isPlayingRef.current) return;

      const duration = 6000 * (1 - startValue);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && isPlayingRef.current) {
          rotateAnim.setValue(0);
          startRotation(0);
        }
      });
    };

    if (playing) {
      Animated.timing(armAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      startRotation(rotationProgress.current);
    } else {
      rotateAnim.stopAnimation((v) => {
        rotationProgress.current = v;
      });
      Animated.timing(armAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }
  }, [playing]);

  useEffect(() => {
    if (autoPlay && player) {
      player.play();
    }
  }, [autoPlay, player]);

  useEffect(() => {
    const triggerDiscovery = async () => {
      if (pin.type === 'HIDDEN_AR' || pin.type?.toString() === 'HIDDEN_AR') {
        try {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            const api = authApis(token);
            await api.post(endpoints.voiceDiscover(pin.id));
            console.log("Pin discovered internally via Turntable");
          }
        } catch (e) {
          console.log("Internal discovery attempt:", e);
        }
      }
    };
    if (autoPlay) {
      triggerDiscovery();
    }
  }, [autoPlay, pin.id, pin.type]);

  useEffect(() => {
    const fetchReaction = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const api = authApis(token);
          const res = await api.get(endpoints.reactionSummary(pin.id));
          if (res.data) {
            setReactionCount(res.data.total);
            setUserReaction(res.data.userReaction);
          }
        }
      } catch (err) {
        console.log("Error fetching reaction summary", err);
      }
    };
    fetchReaction();
  }, [pin.id]);

  const handleReaction = async (type: string | null) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để thả tim.");
      return;
    }
    const api = authApis(token);
    try {
      if (type === null || (userReaction === type && type === "LIKE")) {
        setUserReaction(null);
        setReactionCount((prev) => Math.max(0, prev - 1));
        await api.delete(endpoints.reactionDelete(pin.id));
      } else {
        const isChanging = userReaction !== null;
        setUserReaction(type);
        if (!isChanging) setReactionCount((prev) => prev + 1);

        const emoji = REACTION_TYPES.find(r => r.type === type)?.emoji || '❤️';
        fireFloatingEmoji(emoji);

        await api.post(endpoints.reaction, { voicePinId: pin.id, type });
      }
    } catch (err) {
      console.log("Error reacting", err);
      Alert.alert("Lỗi", "Không thể thả tim. Vui lòng thử lại sau.");
    }
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const armRotate = armAnim.interpolate({ inputRange: [0, 1], outputRange: ["-10deg", "5deg"] });

  const isHidden = pin.isAnonymous || pin.type === 'HIDDEN_AR';
  const emotionColor = isHidden ? '#6A5ACD' : (EMOTION_COLOR[pin.emotionLabel as EmotionType ?? ""] ?? Colors.primary);
  const authorLabel = isHidden
    ? "Ẩn danh"
    : pin.user?.displayName ?? pin.user?.username ?? `Voice #${pin.id}`;

  const navigateToProfile = () => {
    if (!pin.isAnonymous && pin.userId) {
      handleClose();
      router.push(`/user/${pin.userId}`);
    }
  };

  const handleToggleTranscription = async () => {
    if (!showTranscription) {
      if (!transcription) {
        setIsThinking(true);
        try {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            const api = authApis(token);
            const res = await api.get(endpoints.voiceDetail(pin.id));
            if (res.data?.data?.transcription) {
              setTranscription(res.data.data.transcription);
            }
          }
        } catch (err) {
          console.log("Error fetching transcription", err);
        } finally {
          setIsThinking(false);
          setShowTranscription(true);
        }
      } else {
        setShowTranscription(true);
      }
    } else {
      setShowTranscription(false);
    }
  };

  return (
    <>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <BlurView intensity={colorScheme === 'dark' ? 50 : 30} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <Animated.View
          style={[
            styles.turntableBody,
            {
              backgroundColor: '#FFFFFF',
              transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
            },
          ]}
        >

          {/* ── TOP BAR ─────────────────────────────────── */}
          <View style={styles.topBar}>
            <View style={styles.topLeft} />
            {/* <TouchableOpacity onPress={handleClose} hitSlop={15} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#000" />
            </TouchableOpacity> */}
          </View>

          {/* ── VINYL RECORD ─────────────────────────────── */}
          <View style={styles.playerContainer}>
            <View style={styles.levelIndicatorLeft}>
              <View style={styles.levelBar} />
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={() => playing ? player.pause() : player.play()} style={{ zIndex: 1 }}>
              <Animated.View style={[styles.vinylPlate, { transform: [{ rotate: spin }] }]}>
                <View style={styles.vinylBlackDisk}>
                  <Image
                    source={{ uri: pin.images?.[0]?.imageUrl ?? pin.imageUrl ?? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' }}
                    style={styles.recordImage}
                    resizeMode="cover"
                  />
                </View>
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.levelIndicatorRight}>
              <View style={styles.levelBar} />
            </View>

            <Animated.View
              pointerEvents="none"
              style={[styles.tonearmContainer, { transform: [{ rotate: armRotate }] }]}
            >
              <Image
                source={require("../../assets/images/3d_tonearm.png")}
                style={styles.tonearmImage}
              />
            </Animated.View>

            {/* Transcription Toggle moved to the 'W' spot */}
            <TouchableOpacity
              onPress={handleToggleTranscription}
              style={styles.vinylTopButton}
              activeOpacity={0.7}
            >
              {isThinking ? (
                <MotiView
                  from={{ rotate: '0deg' }}
                  animate={{ rotate: '360deg' }}
                  transition={{ loop: true, duration: 1000, type: 'timing', easing: ReanimatedEasing.linear }}
                >
                  <Ionicons name="sparkles" size={26} color="#CBD5E1" />
                </MotiView>
              ) : (
                <View style={styles.vinylTopButtonContent}>
                  <Ionicons name={showTranscription ? "eye-off-outline" : "language-outline"} size={26} color="#CBD5E1" />
                  <Text style={styles.vinylTopButtonLetter}>W</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── INFO + PLAY BUTTON ───────────────────────── */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <TouchableOpacity onPress={navigateToProfile} style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  {pin.user?.avatar ? (
                    <Image source={{ uri: pin.user.avatar }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person-circle" size={20} color="#CBD5E1" />
                  )}
                </View>
                <Text style={styles.authorText}>{authorLabel.toUpperCase()}</Text>
              </TouchableOpacity>

              {/* Transcription Box remains here if visible */}
              {showTranscription && (
                <View style={styles.transcriptionContainer}>
                  {transcription ? (
                    <MotiView
                      from={{ opacity: 0, translateY: 10 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      style={[styles.transcriptionBox, { backgroundColor: '#F8FAFC', borderColor: '#7B61FF44' }]}
                    >
                      <Text style={[styles.transcriptionText, { color: '#1E293B' }]}>
                        {transcription}
                      </Text>
                    </MotiView>
                  ) : (
                    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.noTranscriptionBox}>
                      <Text style={[styles.noTranscriptionText, { color: currentTheme.colors.textMuted }]}>
                        Chưa có bản phiên âm.
                      </Text>
                    </MotiView>
                  )}
                </View>
              )}

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#94A3B8" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {pin.address ?? "Không rõ vị trí"}
                </Text>
              </View>

              {/* Reaction & Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="headset-outline" size={20} color="#94A3B8" />
                  <Text style={styles.statValue}>{pin.listensCount ?? 0}</Text>
                  <Text style={styles.statLabel}>Nghe</Text>
                </View>

                <View style={styles.statDivider} />

                <TouchableOpacity
                  onPress={() => handleReaction(userReaction ? null : 'LIKE')}
                  onLongPress={toggleReactions}
                  delayLongPress={300}
                  style={styles.statItem}
                >
                  <MotiView
                    animate={{ rotate: userReaction ? '0deg' : '0deg', scale: userReaction ? 1.2 : 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                  >
                    <Ionicons
                      name={userReaction ? "heart" : "heart-outline"}
                      size={20}
                      color={userReaction ? "#EF4444" : "#94A3B8"}
                    />
                  </MotiView>
                  <Text style={styles.statValue}>{reactionCount}</Text>
                  <Text style={styles.statLabel}>Thích</Text>
                </TouchableOpacity>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={19} color="#94A3B8" />
                  <Text style={styles.statValue}>{pin.commentsCount ?? 0}</Text>
                  <Text style={styles.statLabel}>Lời nhắn</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Ionicons name="timer-outline" size={20} color="#94A3B8" />
                  <Text style={styles.statValue}>{formatDuration(player.duration)}</Text>
                  <Text style={styles.statLabel}>Thời lượng</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── FOOTER: visibility + date ─────────────────── */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Ionicons name={VISIBILITY_ICON[pin.visibility] ?? "earth-outline"} size={14} color="#94A3B8" />
              <Text style={styles.visLabel}>
                {pin.visibility === 'PUBLIC' ? 'Công khai' : pin.visibility === 'FRIENDS' ? 'Bạn bè' : 'Riêng tư'}
              </Text>
            </View>
            <Text style={styles.dateText}>{new Date(pin.createdAt).toLocaleDateString()}</Text>
          </View>
        </Animated.View>

        {/* Floating Microphone Button */}
        <TouchableOpacity
          style={styles.micButtonContainer}
          onPress={() => playing ? player.pause() : player.play()}
          activeOpacity={0.8}
        >
          <View style={styles.micButtonInside}>
            <Ionicons name="mic" size={28} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Reaction Picker Overlay */}
        {showReactions && (
          <Animated.View style={[styles.reactionPicker, {
            transform: [
              { scale: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
              { translateY: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
            ],
            opacity: reactionAnim,
          }]}>
            {REACTION_TYPES.map((r, index) => (
              <TouchableOpacity
                key={r.type}
                onPress={() => { toggleReactions(); handleReaction(r.type); }}
                style={styles.reactionBtn}
                activeOpacity={0.6}
              >
                <MotiView
                  from={{ scale: 0, translateY: 20 }}
                  animate={{ scale: 1, translateY: 0 }}
                  transition={{
                    type: 'spring',
                    delay: index * 50,
                  }}
                >
                  <MotiView
                    animate={{
                      translateY: [0, -4, 0, -2, 0],
                      scale: [1, 1.1, 1, 1.05, 1],
                    }}
                    transition={{
                      loop: true,
                      type: 'timing',
                      duration: 2000,
                      delay: index * 100,
                    }}
                  >
                    <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                  </MotiView>
                </MotiView>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </Animated.View>

      {/* ── REPORT MODAL ─────────────────────────────── */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalDragHandle} />
            </View>
            <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>Báo cáo vi phạm</Text>
            <Text style={[styles.modalSubtitle, { color: currentTheme.colors.textMuted }]}>
              Chọn lý do báo cáo bài đăng này:
            </Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.reportReasonBtn, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.border }]}
                  onPress={() => {
                    Alert.alert(
                      'Xác nhận báo cáo',
                      `Bạn muốn báo cáo bài đăng này vì "${r.label}"?`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Báo cáo', style: 'destructive', onPress: () => handleReport(r.key) }
                      ]
                    );
                  }}
                  disabled={reportLoading}
                  activeOpacity={0.7}
                >
                  <Ionicons name={r.icon} size={20} color="#ef4444" style={{ marginRight: 12 }} />
                  <Text style={[styles.reportReasonText, { color: currentTheme.colors.text }]}>{r.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={currentTheme.colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: currentTheme.colors.border }]}
              onPress={() => setShowReportModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: currentTheme.colors.textSecondary }]}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  turntableBody: {
    width: width * 0.92,
    borderRadius: 40,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    backgroundColor: '#FFF',
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F8FAFC',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerContainer: {
    height: 320,
    backgroundColor: '#F1F5F9',
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 24,
  },
  vinylPlate: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  vinylBlackDisk: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  recordImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  levelIndicatorLeft: {
    position: 'absolute',
    left: 20,
    bottom: 30,
    width: 20,
    height: 60,
    backgroundColor: '#CBD5E1',
    borderRadius: 10,
    justifyContent: 'flex-end',
    padding: 3,
  },
  levelIndicatorRight: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 20,
    height: 60,
    backgroundColor: '#CBD5E1',
    borderRadius: 10,
    justifyContent: 'flex-end',
    padding: 3,
  },
  levelBar: {
    width: '100%',
    height: '60%',
    backgroundColor: '#475569',
    borderRadius: 7,
  },
  vinylTopButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 4,
  },
  vinylTopButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vinylTopButtonLetter: {
    fontSize: 24,
    fontWeight: '900',
    color: '#CBD5E1',
    marginTop: -2,
  },
  tonearmContainer: {
    position: "absolute",
    top: -10,
    right: 5,
    height: 300,
    width: 160,
    alignItems: "center",
    zIndex: 5,
    transformOrigin: ["50%", "0%", 0],
  },
  tonearmImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    gap: 12,
  },
  infoLeft: {
    flex: 1,
    gap: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  authorText: {
    fontSize: 12,
    fontWeight: "600",
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: '#1E293B',
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: '#94A3B8',
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  visLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: '#94A3B8',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  micButtonContainer: {
    position: 'absolute',
    bottom: -35,
    alignSelf: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 15,
    zIndex: 1001,
  },
  micButtonInside: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  reactionPicker: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 35,
    borderWidth: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 2000,
    gap: 8,
    backgroundColor: '#FFF',
    borderColor: '#E2E8F0',
  },
  reactionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  reactionEmoji: {
    fontSize: 26,
  },
  floatingEmoji: {
    position: "absolute",
    fontSize: 28,
  },
  rippleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
    overflow: "visible",
  },
  rippleRing: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
  },
  transcriptionContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  transcriptionBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  noTranscriptionBox: {
    marginTop: 8,
    paddingHorizontal: 12,
  },
  noTranscriptionText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  reportBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748b55',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  reportReasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  reportReasonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalCancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});