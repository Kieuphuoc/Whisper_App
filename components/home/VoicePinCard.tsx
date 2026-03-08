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
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/Theme";
import { Colors } from "@/constants/Colors";

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

export default function VoicePinTurntable({ pin, onClose }: Props) {
  const colorScheme = useColorScheme() || 'light';
  const currentTheme = theme[colorScheme];
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const armAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

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
    <View style={styles.overlay}>
      <View style={[styles.turntableBody, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }]}>

        {/* ── TOP BAR ─────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Ionicons name="disc-outline" size={18} color={Colors.primary} />
            <Text style={[styles.topLabel, { color: Colors.primary }]}>Voice Pin</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={15} style={[styles.closeBtn, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
            <Ionicons name="close" size={20} color={currentTheme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── VINYL RECORD ─────────────────────────────── */}
        <View style={styles.playerContainer}>
          <View style={[styles.vinylShadow, { backgroundColor: '#000', borderColor: currentTheme.colors.border, shadowColor: Colors.primary }]}>
            <Animated.View style={[styles.vinylPlate, { transform: [{ rotate: spin }], borderColor: currentTheme.colors.border }]}>
              <Image
                source={{ uri: pin.images?.[0]?.imageUrl ?? pin.imageUrl ?? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' }}
                style={styles.recordImage}
                resizeMode="cover"
              />
              <View style={[styles.recordCenter, { backgroundColor: currentTheme.colors.surface, borderColor: Colors.primary }]} />
            </Animated.View>
          </View>

          {/* Tonearm */}
          <Animated.View style={[styles.tonearmContainer, { transform: [{ rotate: armRotate }] }]}>
            <View style={[styles.tonearmBase, { backgroundColor: '#333', borderColor: '#444' }]} />
            <View style={[styles.tonearmStick, { backgroundColor: '#555' }]} />
            <View style={[styles.tonearmHead, { backgroundColor: '#777' }]} />
          </Animated.View>

          {/* Emotion badge floats over the disc */}
          {pin.emotionLabel && (
            <View style={[styles.emotionBadge, { backgroundColor: emotionColor + "33", borderColor: emotionColor + "88" }]}>
              <Text style={[styles.emotionBadgeText, { color: emotionColor }]}>
                {pin.emotionLabel}
              </Text>
            </View>
          )}
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

          {/* Play button */}
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            style={[styles.playBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }, isPlaying && styles.playBtnActive]}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={26} color={isPlaying ? Colors.primary : Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ── STATS ROW ────────────────────────────────── */}
        <View style={[styles.statsRow, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.border }]}>
          <View style={styles.statItem}>
            <Ionicons name="headset-outline" size={14} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{pin.listensCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.textMuted }]}>nghe</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: currentTheme.colors.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color={Colors.error} />
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{pin.reactionsCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.textMuted }]}>thích</Text>
          </View>
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

      </View>
    </View>
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
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 24,
  },
  vinylShadow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  vinylPlate: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: "hidden",
    borderWidth: 2,
  },
  recordImage: {
    width: "100%",
    height: "100%",
    opacity: 0.95,
  },
  recordCenter: {
    position: "absolute",
    top: "45%",
    left: "45%",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
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
    top: 10,
    right: 20,
    height: 170,
    width: 50,
    alignItems: "center",
    zIndex: 5,
  },
  tonearmBase: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 4,
  },
  tonearmStick: {
    width: 5,
    height: 110,
    marginTop: -4,
  },
  tonearmHead: {
    width: 13,
    height: 22,
    borderRadius: 3,
    marginTop: -4,
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
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  playBtnActive: {
    backgroundColor: "#fff",
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
});