import { CameraView, useCameraPermissions } from "expo-camera";
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
import { markUnlockedAR } from "@/storage/voiceARProgress";
import CharmanderOverlay from "@/components/voice-ar/CharmanderOverlay";

type Params = { pinId?: string };

export default function VoiceARCameraScreen() {
  const scheme = useColorScheme() || "light";
  const isDark = scheme === "dark";
  const router = useRouter();
  const { pinId } = useLocalSearchParams<Params>();

  const [permission, requestPermission] = useCameraPermissions();
  const [pin, setPin] = useState<VoicePin | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [deltaDeg, setDeltaDeg] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [placed, setPlaced] = useState(false);

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
        if (!cancelled) setPin(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pinId]);

  const unlockRadius = pin?.unlockRadius ?? 15;

  useEffect(() => {
    (async () => {
      if (!permission || permission.granted) return;
      await requestPermission();
    })();
  }, [permission, requestPermission]);

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
        { accuracy: Location.Accuracy.High, timeInterval: 1200, distanceInterval: 6 },
        (loc) => {
          if (!pin) return;
          const me = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const target = { latitude: pin.latitude, longitude: pin.longitude };

          const d = haversineDistanceMeters(me, target);
          setDistance(d);

          const heading = headingRef.current;
          if (heading != null) {
            const bearing = initialBearingDegrees(me, target);
            const delta = normalizeAngleDegrees(bearing - heading);
            const prev = smoothedDeltaRef.current;
            const next = prev == null ? delta : lerp(prev, delta, 0.2);
            smoothedDeltaRef.current = next;
            setDeltaDeg(next);
          }

          if (!unlocked && d <= unlockRadius) {
            setUnlocked(true);
          }
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
  }, [pin, unlockRadius, unlocked]);

  const xOffset = useMemo(() => {
    // Map delta [-90..90] degrees to horizontal shift [-120..120]
    if (deltaDeg == null) return 0;
    const clamped = Math.max(-90, Math.min(90, deltaDeg));
    return (clamped / 90) * 120;
  }, [deltaDeg]);

  const signal = useMemo(() => {
    if (distance == null) return 0.2;
    if (distance <= unlockRadius) return 1;
    const t = Math.max(0, Math.min(1, 1 - distance / 120));
    return 0.25 + 0.75 * t;
  }, [distance, unlockRadius]);

  const distanceLabel = useMemo(() => {
    if (distance == null) return "—";
    if (distance < 10) return `${distance.toFixed(1)}m`;
    return `${Math.round(distance)}m`;
  }, [distance]);

  const handleUnlock = async () => {
    if (!pin) return;
    await markUnlockedAR(pin.id);
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const api = authApis(token);
        await api.post(endpoints.voiceDiscover(pin.id));
      }
    } catch {
      // ignore network error
    }
    // Go back to Home, select pin and autoplay.
    router.push({ pathname: "/(tabs)/home", params: { selectPinId: String(pin.id), autoPlay: "1" } });
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.permissionWrap, { backgroundColor: isDark ? "#05060a" : "#f5f7ff" }]}>
        <Text style={{ color: isDark ? "#fff" : "#111827", fontWeight: "800" }}>
          Cần quyền camera để khám phá
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Cho phép camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* 3D overlay pseudo-anchor (Expo Go friendly) */}
      <CharmanderOverlay xOffsetPx={xOffset} intensity={signal} placed={placed} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.pill}>
          <Ionicons name="sparkles" size={14} color="#ddd6fe" />
          <Text style={styles.pillText}>Geo AR</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setPlaced((v) => !v);
          }}
          style={[styles.iconBtn, { backgroundColor: placed ? "rgba(139,92,246,0.45)" : "rgba(0,0,0,0.35)" }]}
          hitSlop={12}
        >
          <Ionicons name={placed ? "pin" : "pin-outline"} size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.hud}>
        <Text style={styles.hudLabel}>Khoảng cách</Text>
        <Text style={styles.hudValue}>{distanceLabel}</Text>
      </View>

      {/* Beacon overlay */}
      <View pointerEvents="none" style={styles.beaconWrap}>
        <View style={[styles.beacon, { transform: [{ translateX: xOffset }], opacity: signal }]}>
          <View style={[styles.ring, { opacity: 0.35 + 0.45 * signal }]} />
          <View style={[styles.dot, { opacity: 0.6 + 0.4 * signal }]} />
        </View>
        <Text style={styles.beaconText}>
          {unlocked ? "Đã tới nơi — mở voice!" : "Hãy xoay điện thoại và tiến lại gần"}
        </Text>
      </View>

      <View style={styles.bottom}>
        {unlocked ? (
          <TouchableOpacity onPress={handleUnlock} activeOpacity={0.9} style={styles.cta}>
            <Ionicons name="headset-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Mở voice ẩn</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.note}>
            <Ionicons name="compass-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.noteText}>Tới gần ≤ {unlockRadius}m để mở</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute",
    top: 54,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.30)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.45)",
  },
  pillText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  hud: {
    position: "absolute",
    top: 120,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 2,
  },
  hudLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800" },
  hudValue: { color: "#fff", fontSize: 16, fontWeight: "900" },
  beaconWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "42%",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  beacon: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#a78bfa",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#c4b5fd",
    shadowColor: "#a78bfa",
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  beaconText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "800",
    fontSize: 13,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  bottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 26,
    gap: 10,
  },
  cta: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  note: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  noteText: { color: "rgba(255,255,255,0.88)", fontWeight: "900" },
  permissionWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 16 },
  permissionBtn: { backgroundColor: "#8b5cf6", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  permissionBtnText: { color: "#fff", fontWeight: "900" },
});

