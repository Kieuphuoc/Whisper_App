import { VoicePin } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

  const emotionColor = EMOTION_COLOR[pin.emotionLabel ?? ""] ?? "#8b5cf6";
  const authorLabel = pin.isAnonymous
    ? "Anonymous"
    : pin.user?.name ?? pin.user?.username ?? `Voice #${pin.id}`;

  return (
    <View style={styles.overlay}>
      <View style={styles.turntableBody}>

        {/* ── TOP BAR ─────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Ionicons name="disc-outline" size={18} color="#8b5cf6" />
            <Text style={styles.topLabel}>Voice Pin</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={15} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── VINYL RECORD ─────────────────────────────── */}
        <View style={styles.playerContainer}>
          <View style={styles.vinylShadow}>
            <Animated.View style={[styles.vinylPlate, { transform: [{ rotate: spin }] }]}>
              <Image
                source={{ uri: pin.imageUrl ?? 'https://i.pinimg.com/736x/fd/1f/c3/fd1fc3bb9231406261397b7f647e999f.jpg' }}
                style={styles.recordImage}
              />
              <View style={styles.recordCenter} />
            </Animated.View>
          </View>

          {/* Tonearm */}
          <Animated.View style={[styles.tonearmContainer, { transform: [{ rotate: armRotate }] }]}>
            <View style={styles.tonearmBase} />
            <View style={styles.tonearmStick} />
            <View style={styles.tonearmHead} />
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
            <View style={styles.authorRow}>
              <Ionicons name="person-circle-outline" size={14} color="#6b7280" />
              <Text style={styles.authorText}>{authorLabel}</Text>
              {pin.type === "HIDDEN_AR" && (
                <View style={styles.arBadge}>
                  <Text style={styles.arBadgeText}>AR</Text>
                </View>
              )}
            </View>

            {/* Title / content */}
            <Text style={styles.title} numberOfLines={2}>
              {pin.content ?? (pin.isAnonymous ? "Unknown Voice" : `Recording #${String(pin.id).slice(-4)}`)}
            </Text>

            {/* Location + time */}
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color="#6b7280" />
              <Text style={styles.metaText} numberOfLines={1}>
                {pin.address ?? "Unknown location"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={12} color="#6b7280" />
              <Text style={styles.metaText}>{timeAgo(pin.createdAt)}</Text>
            </View>
          </View>

          {/* Play button */}
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={26} color={isPlaying ? "#000" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* ── STATS ROW ────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="headset-outline" size={14} color="#9ca3af" />
            <Text style={styles.statValue}>{pin.listensCount ?? 0}</Text>
            <Text style={styles.statLabel}>plays</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color="#f87171" />
            <Text style={styles.statValue}>{pin.reactionsCount ?? 0}</Text>
            <Text style={styles.statLabel}>likes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color="#60a5fa" />
            <Text style={styles.statValue}>{pin.commentsCount ?? 0}</Text>
            <Text style={styles.statLabel}>comments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="timer-outline" size={14} color="#9ca3af" />
            <Text style={styles.statValue}>{formatDuration(pin.duration)}</Text>
            <Text style={styles.statLabel}>duration</Text>
          </View>
        </View>

        {/* ── FOOTER: visibility + date ─────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Ionicons name={VISIBILITY_ICON[pin.visibility] ?? "earth-outline"} size={13} color="#6b7280" />
            <Text style={styles.visLabel}>
              {pin.visibility.charAt(0) + pin.visibility.slice(1).toLowerCase()}
            </Text>
          </View>
          <Text style={styles.dateText}>{new Date(pin.createdAt).toLocaleDateString()}</Text>
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
    backgroundColor: "#111118",
    borderRadius: 36,
    padding: 22,
    borderWidth: 1,
    borderColor: "#2a2a3a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 24,
  },

  // ── Top bar ────────────────────────────────────
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
    color: "#8b5cf6",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Vinyl ──────────────────────────────────────
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
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 8,
    borderColor: "#1a1a1a",
    shadowColor: "#8b5cf6",
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
    borderColor: "#2a2a2a",
  },
  recordImage: {
    width: "100%",
    height: "100%",
    opacity: 0.75,
  },
  recordCenter: {
    position: "absolute",
    top: "45%",
    left: "45%",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#111118",
    borderWidth: 3,
    borderColor: "#8b5cf6",
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

  // ── Tonearm ────────────────────────────────────
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
    backgroundColor: "#333",
    borderWidth: 4,
    borderColor: "#444",
  },
  tonearmStick: {
    width: 5,
    height: 110,
    backgroundColor: "#555",
    marginTop: -4,
  },
  tonearmHead: {
    width: 13,
    height: 22,
    backgroundColor: "#777",
    borderRadius: 3,
    marginTop: -4,
  },

  // ── Info row ───────────────────────────────────
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
  authorText: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  arBadge: {
    backgroundColor: "rgba(139,92,246,0.2)",
    borderColor: "rgba(139,92,246,0.5)",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  arBadgeText: {
    color: "#a78bfa",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: "#f9fafb",
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
    color: "#6b7280",
    fontSize: 11,
    flex: 1,
  },

  // ── Play button ────────────────────────────────
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  playBtnActive: {
    backgroundColor: "#fff",
  },

  // ── Stats row ──────────────────────────────────
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1f1f2e",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    color: "#f3f4f6",
    fontSize: 15,
    fontWeight: "700",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#2a2a3a",
  },

  // ── Footer ─────────────────────────────────────
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
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "500",
  },
  dateText: {
    color: "#4b5563",
    fontSize: 11,
  },
});