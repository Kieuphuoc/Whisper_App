import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import Apis, { authApis, endpoints } from "@/configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VoicePin } from "@/types";
import {
  haversineDistanceMeters,
  initialBearingDegrees,
  normalizeAngleDegrees,
  lerp,
} from "@/utils/geo";

type Params = { pinId?: string };

export default function VoiceARHuntScreen() {
  const scheme = useColorScheme() || "light";
  const isDark = scheme === "dark";
  const router = useRouter();
  const { pinId } = useLocalSearchParams<Params>();

  const [pin, setPin] = useState<VoicePin | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [deltaDeg, setDeltaDeg] = useState<number | null>(null);

  const posSubRef = useRef<Location.LocationSubscription | null>(null);
  const headSubRef = useRef<Location.LocationSubscription | null>(null);
  const headingRef = useRef<number | null>(null);
  const smoothedDeltaRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pinId) return;
      try {
        const token = await AsyncStorage.getItem("token");
        const api = token ? authApis(token) : Apis;
        const res = await api.get(endpoints.voiceDetail(pinId));
        const data = res.data?.data as VoicePin | undefined;
        if (!cancelled && data) setPin(data);
      } catch {
        // If fetch fails, user can still open camera; but guidance needs pin.
        if (!cancelled) setPin(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pinId]);

  const unlockRadius = pin?.unlockRadius ?? 15;

  const directionLabel = useMemo(() => {
    if (deltaDeg == null) return "Đang căn hướng…";
    if (deltaDeg > 15) return "Sang phải";
    if (deltaDeg < -15) return "Qua trái";
    return "Đi thẳng";
  }, [deltaDeg]);

  const distanceLabel = useMemo(() => {
    if (distance == null) return "—";
    if (distance < 10) return `${distance.toFixed(1)}m`;
    return `${Math.round(distance)}m`;
  }, [distance]);

  const proximityLabel = useMemo(() => {
    if (distance == null) return "Đang định vị…";
    if (distance <= unlockRadius) return "Rất gần rồi — bật camera để mở!";
    if (distance <= 30) return "Đang rất gần…";
    if (distance <= 80) return "Tiếp tục tiến lại gần";
    return "Đi theo hướng dẫn";
  }, [distance, unlockRadius]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== "granted") return;

      posSubRef.current?.remove();
      headSubRef.current?.remove();

      headSubRef.current = await Location.watchHeadingAsync((h) => {
        headingRef.current = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      });

      posSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1500, distanceInterval: 8 },
        (loc) => {
          if (!pin) return;
          const me = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const target = { latitude: pin.latitude, longitude: pin.longitude };
          const d = haversineDistanceMeters(me, target);
          setDistance(d);

          const heading = headingRef.current;
          if (heading == null) return;
          const bearing = initialBearingDegrees(me, target);
          const delta = normalizeAngleDegrees(bearing - heading);

          const prev = smoothedDeltaRef.current;
          const next = prev == null ? delta : lerp(prev, delta, 0.18);
          smoothedDeltaRef.current = next;
          setDeltaDeg(next);
        }
      );
    })();

    return () => {
      cancelled = true;
      posSubRef.current?.remove();
      headSubRef.current?.remove();
      posSubRef.current = null;
      headSubRef.current = null;
    };
  }, [pin]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#05060a" : "#f5f7ff" }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={isDark ? "#e5e7eb" : "#111827"} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: isDark ? "#fff" : "#111827" }]}>Dò voice AR</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Khoảng cách</Text>
            <Text style={styles.metricValue}>{distanceLabel}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Hướng</Text>
            <Text style={styles.metricValue}>{directionLabel}</Text>
          </View>
        </View>

        <Text style={styles.hint}>{proximityLabel}</Text>
        {!pin && (
          <Text style={styles.warn}>
            Không tải được dữ liệu pin. Bạn có thể quay lại và thử lại khi mạng ổn định.
          </Text>
        )}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/voice-ar/camera", params: { pinId: String(pinId ?? "") } })}
          activeOpacity={0.9}
          style={[styles.cta, { opacity: pinId ? 1 : 0.6 }]}
          disabled={!pinId}
        >
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.ctaText}>Bật camera để khám phá</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { fontWeight: "900", fontSize: 16 },
  panel: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
    gap: 12,
  },
  row: { flexDirection: "row", gap: 12 },
  metric: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(17,24,39,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 4,
  },
  metricLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700" },
  metricValue: { color: "#fff", fontSize: 18, fontWeight: "900" },
  hint: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 18 },
  warn: { color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 16 },
  bottom: { marginTop: "auto", padding: 16, paddingBottom: 28 },
  cta: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#8b5cf6",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});

