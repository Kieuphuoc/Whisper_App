import { BlurView } from "expo-blur";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { VoicePin } from "@/types";

type Props = {
  pin: VoicePin;
  distanceMeters: number;
  onStart: () => void;
  onDismiss: () => void;
};

export default function ExploreOverlay({ pin, distanceMeters, onStart, onDismiss }: Props) {
  const scheme = useColorScheme() || "light";
  const isDark = scheme === "dark";

  return (
    <BlurView intensity={isDark ? 55 : 35} tint={isDark ? "dark" : "light"} style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color="#8b5cf6" />
            <Text style={styles.badgeText}>Voice AR</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} hitSlop={12} style={styles.close}>
            <Ionicons name="close" size={18} color={isDark ? "#e5e7eb" : "#111827"} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          Bạn có muốn nghe voice ẩn gần đây không?
        </Text>
        <Text style={styles.sub}>
          Có điều thú vị ở đây này. Bạn đang cách khoảng{" "}
          <Text style={styles.subStrong}>{Math.round(distanceMeters)}m</Text>.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onDismiss} style={[styles.btn, styles.btnGhost]} activeOpacity={0.85}>
            <Text style={styles.btnGhostText}>Bỏ qua</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onStart} style={[styles.btn, styles.btnPrimary]} activeOpacity={0.9}>
            <Ionicons name="compass-outline" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Bắt đầu dò</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5000,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(17,24,39,0.70)",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderColor: "rgba(139,92,246,0.35)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "#ddd6fe", fontWeight: "700", fontSize: 12 },
  close: { padding: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.10)" },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18 },
  subStrong: { color: "#fff", fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnGhost: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  btnGhostText: { color: "rgba(255,255,255,0.9)", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#8b5cf6" },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
});

