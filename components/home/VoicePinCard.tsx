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
  const s = secs % 60;
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
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
            },
          ]}
        >

          {/* ── TOP BAR ─────────────────────────────────── */}
          <View style={styles.topBar}>
            <View style={styles.topLeft}>
              {isHidden ? (
                <View style={[styles.emotionBadge, { backgroundColor: '#6A5ACD33', borderColor: '#6A5ACD88', paddingHorizontal: 8 }]}>
                  <Ionicons name="sparkles" size={14} color="#6A5ACD" />
                </View>
              ) : (
                !!pin.emotionLabel && (
                  <View style={[styles.emotionBadge, { backgroundColor: emotionColor + "33", borderColor: emotionColor + "88" }]}>
                    <Text style={[styles.emotionBadgeText, { color: emotionColor }]}>
                      {pin.emotionLabel}
                    </Text>
                  </View>
                )
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Report flag button */}
              {!pin.isAnonymous && (
                <TouchableOpacity
                  onPress={() => hasReported ? Alert.alert('Đã báo cáo', 'Bạn đã báo cáo bài đăng này rồi.') : setShowReportModal(true)}
                  hitSlop={10}
                  style={[styles.reportBtn, { backgroundColor: hasReported ? '#ef444422' : currentTheme.colors.surfaceAlt }]}
                >
                  <Ionicons
                    name={hasReported ? 'flag' : 'flag-outline'}
                    size={16}
                    color={hasReported ? '#ef4444' : currentTheme.colors.textMuted}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} hitSlop={15} style={[styles.closeBtn, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
                <Ionicons name="close" size={20} color={currentTheme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── VINYL RECORD ─────────────────────────────── */}
          <View style={[styles.playerContainer, { backgroundColor: currentTheme.colors.surfaceAlt, borderRadius: currentTheme.borderRadius.xl, overflow: 'visible' }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => playing ? player.pause() : player.play()} style={{ zIndex: 1 }}>
              <View style={{
                shadowColor: emotionColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                elevation: 15,
              }}>
                <Animated.View style={[styles.vinylPlate, { transform: [{ rotate: spin }], borderColor: currentTheme.colors.border }]}>
                  <Image
                    source={{ uri: pin.images?.[0]?.imageUrl ?? pin.imageUrl ?? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' }}
                    style={styles.recordImage}
                    resizeMode="cover"
                  />
                  <View style={styles.vinylCenterContainer}>
                    <View style={styles.vinylCenterRing2} />
                    <View style={styles.vinylCenterRing3} />
                    <View style={styles.vinylCenterHole} />
                  </View>
                </Animated.View>
              </View>
            </TouchableOpacity>

            <Animated.View
              pointerEvents="none"
              style={[styles.tonearmContainer, { transform: [{ rotate: armRotate }] }]}
            >
              <Image
                source={require("../../assets/images/3d_tonearm.png")}
                style={styles.tonearmImage}
              />
            </Animated.View>
          </View>

          {/* ── INFO + PLAY BUTTON ───────────────────────── */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              {!isHidden && (
                <TouchableOpacity onPress={navigateToProfile} style={styles.authorRow}>
                  <View style={[styles.authorAvatar, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
                    {pin.user?.avatar ? (
                      <Image source={{ uri: pin.user.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person-circle-outline" size={18} color={currentTheme.colors.textMuted} />
                    )}
                  </View>
                  <Text style={[styles.authorText, { color: currentTheme.colors.textMuted }]}>{authorLabel}</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.title, { color: currentTheme.colors.text }]} numberOfLines={2}>
                {pin.content ?? (pin.isAnonymous ? "Ký ức thầm lặng" : `Bản ghi #${String(pin.id).slice(-4)}`)}
              </Text>

              {/* Transcription Button & Display */}
              <View style={styles.transcriptionContainer}>
                <TouchableOpacity
                  onPress={handleToggleTranscription}
                  style={[styles.transcriptionBtn, { backgroundColor: currentTheme.colors.surfaceAlt }]}
                  activeOpacity={0.7}
                >
                  {isThinking ? (
                    <MotiView
                      from={{ rotate: '0deg' }}
                      animate={{ rotate: '360deg' }}
                      transition={{ loop: true, duration: 1000, type: 'timing', easing: ReanimatedEasing.linear }}
                    >
                      <Ionicons name="sparkles" size={16} color={Colors.primary} />
                    </MotiView>
                  ) : (
                    <Ionicons name={showTranscription ? "eye-off-outline" : "language-outline"} size={16} color={currentTheme.colors.primary} />
                  )}
                  <Text style={[styles.transcriptionBtnText, { color: currentTheme.colors.primary }]}>
                    {isThinking ? "Đang suy nghĩ..." : showTranscription ? "Ẩn phiên âm" : "Xem phiên âm"}
                  </Text>
                </TouchableOpacity>

                {showTranscription && transcription && (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={[styles.transcriptionBox, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.primary + '44' }]}
                  >
                    <Text style={[styles.transcriptionText, { color: currentTheme.colors.text }]}>
                      {transcription}
                    </Text>
                  </MotiView>
                )}

                {showTranscription && !transcription && (
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={styles.noTranscriptionBox}
                  >
                    <Text style={[styles.noTranscriptionText, { color: currentTheme.colors.textMuted }]}>
                      Chưa có bản phiên âm cho âm thanh này.
                    </Text>
                  </MotiView>
                )}
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={12} color={currentTheme.colors.textMuted} />
                <Text style={[styles.metaText, { color: currentTheme.colors.textMuted }]} numberOfLines={1}>
                  {pin.address ?? "Không rõ vị trí"}
                </Text>
              </View>
              {/* <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={12} color={currentTheme.colors.textMuted} />
                <Text style={[styles.metaText, { color: currentTheme.colors.textMuted }]}>{timeAgo(pin.createdAt)}</Text>
              </View> */}
            </View>
          </View>

          {/* ── FOOTER: visibility + date ─────────────────── */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Ionicons name={VISIBILITY_ICON[pin.visibility] ?? "earth-outline"} size={13} color={currentTheme.colors.textMuted} />
              <Text style={[styles.visLabel, { color: currentTheme.colors.textMuted }]}>
                {pin.visibility === 'PUBLIC' ? 'Công khai' : pin.visibility === 'FRIENDS' ? 'Bạn bè' : 'Riêng tư'}
              </Text>
            </View>
            <Text style={[styles.dateText, { color: currentTheme.colors.textMuted }]}>{new Date(pin.createdAt).toLocaleDateString()}</Text>
          </View>

          {/* Reaction Picker Overlay */}
          {showReactions && (
            <Animated.View style={[styles.reactionPicker, {
              transform: [
                { scale: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                { translateY: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
              ],
              opacity: reactionAnim,
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            }]}>
              {REACTION_TYPES.map((r) => (
                <TouchableOpacity
                  key={r.type}
                  onPress={() => { toggleReactions(); handleReaction(r.type); }}
                  style={styles.reactionBtn}
                  activeOpacity={0.6}
                >
                  <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>
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
    zIndex: 1000,
  },
  turntableBody: {
    width: width * 0.90,
    borderRadius: 36,
    padding: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  playerContainer: {
    height: 330,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 24,
  },
  vinylShadow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 12,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 24,
  },
  vinylPlate: {
    width: 260,
    height: 260,
    borderRadius: 135,
    overflow: "hidden",
    borderWidth: 3,
  },
  recordImage: {
    width: "100%",
    height: "100%",
    opacity: 0.95,
  },
  vinylCenterContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  vinylCenterRing2: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4043486e", // Light gray
  },
  vinylCenterRing3: {
    position: "absolute",
    width: 15,
    height: 15,
    borderRadius: 16,
    backgroundColor: "#000000", // Black
  },
  vinylCenterHole: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#4c4f56c2", // Gray
  },
  emotionBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  emotionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  tonearmContainer: {
    position: "absolute",
    top: -20,
    right: 7,
    height: 305,
    width: 170,
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
    marginBottom: 18,
    gap: 12,
  },
  infoLeft: {
    flex: 1,
    gap: 5,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  authorText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  arBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  arBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  visLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 11,
  },
  reactionPicker: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 20,
    gap: 8,
  },
  reactionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  reactionEmoji: {
    fontSize: 26,
  },
  floatingOrigin: {
    position: "absolute",
    bottom: 20,
    width: 20,
    height: 20,
    zIndex: 15,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
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
    marginTop: 8,
    marginBottom: 4,
  },
  transcriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  transcriptionBtnText: {
    fontSize: 12,
    fontWeight: '600',
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
  // ── Report button ─────────────────────────────────
  reportBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Report modal ──────────────────────────────
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