import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useLocationContext } from "@/contexts/LocationContext";
import { Text } from "@/components/ui/text";
import { authApis, endpoints } from "@/configs/Apis";
import Apis from "@/configs/Apis";
import { VoicePin } from "@/types";
import { parseVoicePinFromDetailResponse } from "@/utils/parseVoiceDetail";
import { haversineDistanceMeters } from "@/utils/geo";
import { markUnlockedAR } from "@/storage/voiceARProgress";
import "@/utils/debugViroProbe";
import { isViroNativeAvailable } from "@/utils/nativeModulesAvailability";
import { DEFAULT_AR_MODEL_URL } from "@/constants/arModels";

const WorldARScene = lazy(() => import("@/components/voice-ar/WorldARScene"));
import { resolveArModelUri } from "@/utils/arModelCache";

type Params = { pinId?: string | string[] };

function normalizeRouteParam(v: string | string[] | undefined): string | undefined {
  if (v == null || v === "") return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = typeof s === "string" ? s.trim() : String(s).trim();
  return t === "" ? undefined : t;
}

const IOS_SIMULATOR_AR_PREVIEW = Platform.OS === "ios" && !Device.isDevice;

export default function VoiceARCameraScreen() {
  const scheme = useColorScheme() || "light";
  const isDark = scheme === "dark";
  const router = useRouter();
  const { pinId: pinIdParam } = useLocalSearchParams<Params>();
  const pinId = normalizeRouteParam(pinIdParam);

  const { permissionStatus: locationPermission } = useLocationContext();
  const [pin, setPin] = useState<VoicePin | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [modelPlaced, setModelPlaced] = useState(false);
  const [localModelUri, setLocalModelUri] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const posSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pinId) return;
      try {
        const res = await Apis.get(endpoints.voiceDetail(pinId));
        const data = parseVoicePinFromDetailResponse(res);
        if (!cancelled && data) setPin(data);
        else if (!cancelled) setPin(null);
      } catch {
        if (!cancelled) setPin(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pinId]);

  const unlockRadius = pin?.unlockRadius ?? 15;
  const remoteModelUrl = (pin?.arModelUrl?.trim() || DEFAULT_AR_MODEL_URL).trim();
  const withinUnlockRadius = distance != null && distance <= unlockRadius;
  const canStartAR = withinUnlockRadius || IOS_SIMULATOR_AR_PREVIEW;

  useEffect(() => {
    if (!canStartAR || IOS_SIMULATOR_AR_PREVIEW) return;
    let cancelled = false;
    setModelLoading(true);
    setModelError(null);
    (async () => {
      try {
        const uri = await resolveArModelUri(remoteModelUrl);
        if (!cancelled) setLocalModelUri(uri);
      } catch {
        if (!cancelled) {
          setModelError("Không tải được mô hình 3D. Kiểm tra mạng và thử lại.");
          setLocalModelUri(null);
        }
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canStartAR, remoteModelUrl]);

  useEffect(() => {
    if (locationPermission !== "granted" || !pin) return;

    let cancelled = false;
    (async () => {
      posSubRef.current?.remove();
      posSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1200, distanceInterval: 6 },
        (loc) => {
          if (cancelled || !pin) return;
          const me = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const target = { latitude: pin.latitude, longitude: pin.longitude };
          const d = haversineDistanceMeters(me, target);
          setDistance(d);
          if (!unlocked && d <= unlockRadius) setUnlocked(true);
        }
      );
    })();

    return () => {
      cancelled = true;
      posSubRef.current?.remove();
      posSubRef.current = null;
    };
  }, [locationPermission, pin, unlockRadius, unlocked]);

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
    router.push({ pathname: "/(tabs)/home", params: { selectPinId: String(pin.id), autoPlay: "1" } });
  };

  const showUnlockCta = unlocked && modelPlaced;

  return (
    <View style={styles.container}>
      {!canStartAR ? (
        <View style={[styles.gateBackdrop, { backgroundColor: isDark ? "#05060a" : "#1a1033" }]}>
          <Ionicons name="footsteps-outline" size={48} color="#a78bfa" />
          <Text style={styles.gateTitle}>Đến gần hơn để mở AR</Text>
          <Text style={styles.gateSub}>
            Bạn đang cách {distanceLabel}. Tiến tới ≤ {unlockRadius}m để quét sàn và đặt vật thể 3D.
          </Text>
        </View>
      ) : modelLoading ? (
        <View style={styles.gateBackdrop}>
          <Text style={styles.gateSub}>Đang tải mô hình 3D…</Text>
        </View>
      ) : modelError ? (
        <View style={styles.gateBackdrop}>
          <Text style={styles.gateTitle}>Lỗi model</Text>
          <Text style={styles.gateSub}>{modelError}</Text>
        </View>
      ) : IOS_SIMULATOR_AR_PREVIEW ? (
        <View style={[styles.gateBackdrop, styles.simulatorBackdrop]}>
          <Text style={styles.gateTitle}>Simulator</Text>
          <Text style={styles.gateSub}>AR thật cần thiết bị có ARKit. Build dev client và chạy trên máy thật.</Text>
        </View>
      ) : !isViroNativeAvailable() ? (
        <View style={[styles.gateBackdrop, styles.simulatorBackdrop]}>
          <Text style={styles.gateTitle}>AR chưa sẵn sàng</Text>
          <Text style={styles.gateSub}>
            Dev client thiếu module Viro. Chạy `npx expo run:ios` hoặc `npx expo run:android` rồi mở lại app.
          </Text>
        </View>
      ) : localModelUri ? (
        <Suspense
          fallback={
            <View style={styles.gateBackdrop}>
              <ActivityIndicator color="#a78bfa" size="large" />
              <Text style={styles.gateSub}>Đang khởi động AR…</Text>
            </View>
          }
        >
          <WorldARScene
            modelUri={localModelUri}
            modelScale={0.25}
            onPlaced={() => setModelPlaced(true)}
            onLoadError={(msg) => setModelError(msg)}
          />
        </Suspense>
      ) : null}

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.pill}>
          <Ionicons name="sparkles" size={14} color="#ddd6fe" />
          <Text style={styles.pillText}>World AR</Text>
        </View>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <View style={styles.hud}>
        <Text style={styles.hudLabel}>Khoảng cách</Text>
        <Text style={styles.hudValue}>{distanceLabel}</Text>
      </View>

      {canStartAR && !modelPlaced && !IOS_SIMULATOR_AR_PREVIEW && !modelError && !modelLoading && (
        <View style={styles.scanHint} pointerEvents="none">
          <Text style={styles.scanHintText}>Di chuyển điện thoại quét sàn, rồi chạm vào mặt phẳng để đặt vật thể</Text>
        </View>
      )}

      <View style={styles.bottom}>
        {showUnlockCta ? (
          <TouchableOpacity onPress={handleUnlock} activeOpacity={0.9} style={styles.cta}>
            <Ionicons name="headset-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Mở voice ẩn</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.note}>
            <Ionicons
              name={modelPlaced ? "checkmark-circle-outline" : "scan-outline"}
              size={16}
              color="rgba(255,255,255,0.85)"
            />
            <Text style={styles.noteText}>
              {!canStartAR
                ? `Tới gần ≤ ${unlockRadius}m để bắt đầu AR`
                : modelPlaced
                  ? "Sẵn sàng mở voice"
                  : "Chạm mặt phẳng để đặt model"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  gateBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 12,
  },
  simulatorBackdrop: { backgroundColor: "#1a0f2e" },
  gateTitle: { color: "#fff", fontWeight: "900", fontSize: 17, textAlign: "center" },
  gateSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 21 },
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
  iconBtnPlaceholder: { width: 40, height: 40 },
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
  scanHint: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 100,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  scanHintText: { color: "rgba(255,255,255,0.92)", fontWeight: "700", fontSize: 13, textAlign: "center" },
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
    paddingHorizontal: 12,
  },
  noteText: { color: "rgba(255,255,255,0.88)", fontWeight: "900", flex: 1, textAlign: "center" },
});
