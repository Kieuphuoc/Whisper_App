import { VoicePin } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/Theme";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "@/configs/Apis";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

type Props = {
  pin: VoicePin;
  onClose: () => void;
};

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

const EMOTION_COLOR: Record<string, string> = {
  Happy: "#facc15",
  Sad: "#60a5fa",
  Calm: "#34d399",
  Nostalgic: "#f472b6",
  Romantic: "#fb7185",
  Curious: "#a78bfa",
  Angry: "#f87171",
};

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

export default function VoicePinTurntable({ pin, onClose }: Props) {
  const colorScheme = useColorScheme() || 'light';
  const currentTheme = theme[colorScheme];
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  const [reactionCount, setReactionCount] = useState(pin.reactionsCount ?? 0);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  const [showReactions, setShowReactions] = useState(false);
  const reactionAnim = useRef(new Animated.Value(0)).current;
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string }[]>([]);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const armAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

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
    if (isPlaying) {
      Animated.timing(armAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      loopRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      Animated.timing(armAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }
  }, [isPlaying]);

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
        // Toggle off
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
  const armRotate = armAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "25deg"] });

  const emotionColor = EMOTION_COLOR[pin.emotionLabel ?? ""] ?? Colors.primary;
  const authorLabel = pin.isAnonymous
    ? "Ẩn danh"
    : pin.user?.displayName ?? pin.user?.username ?? `Voice #${pin.id}`;

  const navigateToProfile = () => {
    if (!pin.isAnonymous && pin.userId) {
      onClose();
      router.push(`/user/${pin.userId}`);
    }
  };

  return (
    <BlurView intensity={colorScheme === 'dark' ? 50 : 30} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.overlay}>
      <View style={[styles.turntableBody, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }]}>

        {/* ── TOP BAR ─────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            {/* Emotion badge floats over the disc */}
            {pin.emotionLabel && (
              <View style={[styles.emotionBadge, { backgroundColor: emotionColor + "33", borderColor: emotionColor + "88" }]}>
                <Text style={[styles.emotionBadgeText, { color: emotionColor }]}>
                  {pin.emotionLabel}
                </Text>
              </View>
            )}          </View>
          <TouchableOpacity onPress={onClose} hitSlop={15} style={[styles.closeBtn, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
            <Ionicons name="close" size={20} color={currentTheme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── VINYL RECORD ─────────────────────────────── */}
        <View style={styles.playerContainer}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setIsPlaying(!isPlaying)}>
            {/* <View style={[styles.vinylShadow, { backgroundColor: '#000', borderColor: currentTheme.colors.border, shadowColor: Colors.primary }]}> */}
            <Animated.View style={[styles.vinylPlate, { transform: [{ rotate: spin }], borderColor: currentTheme.colors.border }]}>
              <Image
                source={{ uri: pin.images?.[0]?.imageUrl ?? pin.imageUrl ?? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' }}
                style={styles.recordImage}
                resizeMode="cover"
              />
              <View style={styles.vinylCenterContainer}>
                <View style={styles.vinylCenterRing2} />
                <View style={styles.vinylCenterRing3} />
                <View style={[styles.vinylCenterHole, { backgroundColor: currentTheme.colors.background }]} />
              </View>
            </Animated.View>
            {/* </View> */}
          </TouchableOpacity>

          {/* Tonearm */}
          <Animated.View style={[styles.tonearmContainer, { transform: [{ rotate: armRotate }] }]}>
            <Image
              source={require("../../assets/images/3d_tonearm.png")}
              style={styles.tonearmImage}
            />
          </Animated.View>


        </View>

        {/* ── INFO + PLAY BUTTON ───────────────────────── */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            {/* Author */}
            <TouchableOpacity onPress={navigateToProfile} style={styles.authorRow}>
              <View style={[styles.authorAvatar, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
                {pin.user?.avatar ? (
                  <Image source={{ uri: pin.user.avatar }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person-circle-outline" size={18} color={currentTheme.colors.textMuted} />
                )}
              </View>
              <Text style={[styles.authorText, { color: currentTheme.colors.textMuted }]}>{authorLabel}</Text>
              {pin.type === "HIDDEN_AR" && (
                <View style={[styles.arBadge, { backgroundColor: Colors.primary + '33', borderColor: Colors.primary + '80' }]}>
                  <Text style={[styles.arBadgeText, { color: Colors.primary }]}>AR</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Title / content */}
            <Text style={[styles.title, { color: currentTheme.colors.text }]} numberOfLines={2}>
              {pin.content ?? (pin.isAnonymous ? "Ký ức thầm lặng" : `Bản ghi #${String(pin.id).slice(-4)}`)}
            </Text>

            {/* Location + time */}
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={currentTheme.colors.textMuted} />
              <Text style={[styles.metaText, { color: currentTheme.colors.textMuted }]} numberOfLines={1}>
                {pin.address ?? "Không rõ vị trí"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={12} color={currentTheme.colors.textMuted} />
              <Text style={[styles.metaText, { color: currentTheme.colors.textMuted }]}>{timeAgo(pin.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* ── STATS ROW ────────────────────────────────── */}
        {/* <View style={[styles.statsRow, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.border }]}>
          <View style={styles.statItem}>
            <Ionicons name="headset-outline" size={14} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{pin.listensCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.textMuted }]}>nghe</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: currentTheme.colors.border }]} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => {
              if (showReactions) toggleReactions();
              handleReaction(userReaction ? null : 'LIKE');
            }}
            onLongPress={toggleReactions}
            delayLongPress={200}
            activeOpacity={0.7}
          >
            {userReaction ? (
              <Text style={{ fontSize: 13, lineHeight: 15 }}>{REACTION_TYPES.find(r => r.type === userReaction)?.emoji || '❤️'}</Text>
            ) : (
              <Ionicons name="heart-outline" size={14} color={Colors.error} />
            )}
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{reactionCount}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.textMuted }]}>thích</Text>

            <View style={styles.floatingOrigin} pointerEvents="none">
              {floatingEmojis.map((item) => (
                <FloatingEmoji
                  key={item.id}
                  emoji={item.emoji}
                  onComplete={() => setFloatingEmojis(prev => prev.filter(e => e.id !== item.id))}
                />
              ))}
            </View>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: currentTheme.colors.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color={currentTheme.colors.primary} />
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{pin.commentsCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.textMuted }]}>lời nhắn</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: currentTheme.colors.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="timer-outline" size={14} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{formatDuration(pin.duration)}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.textMuted }]}>thời lượng</Text>
          </View>
        </View> */}

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

      </View>
    </BlurView>
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
    width: 270,
    height: 270,
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
    backgroundColor: "#111111", // đen mỏng như viền
  },
  vinylCenterRing3: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#555555", // xám đậm trong cùng
  },
  vinylCenterHole: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
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
    top: -7,
    right: 7,
    height: 255,
    width: 120,
    alignItems: "center",
    zIndex: 5,
    transformOrigin: "top center",
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
});