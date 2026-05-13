import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useLocationContext } from "@/contexts/LocationContext";
import { Text } from "@/components/ui/text";
import Apis, { endpoints } from "@/configs/Apis";
import axios from "axios";
import { VoicePin } from "@/types";
import { parseVoicePinFromDetailResponse } from "@/utils/parseVoiceDetail";
import {
  haversineDistanceMeters,
  initialBearingDegrees,
  normalizeAngleDegrees,
  lerp,
} from "@/utils/geo";

type Params = { pinId?: string | string[] };

function normalizeRouteParam(v: string | string[] | undefined): string | undefined {
  if (v == null || v === "") return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = typeof s === "string" ? s.trim() : String(s).trim();
  return t === "" ? undefined : t;
}

/** Gợi ý tiếng Việt từ body lỗi API voice detail (lỗi Prisma / geometry từ server). */
function userFacingVoiceDetailFailure(apiBody: unknown): string | null {
  const msg =
    apiBody &&
    typeof apiBody === "object" &&
    "message" in apiBody &&
    typeof (apiBody as { message: unknown }).message === "string"
      ? (apiBody as { message: string }).message
      : "";
  if (msg.includes("geometry") && (msg.includes("Prisma") || msg.includes("$queryRaw"))) {
    return "Máy chủ đang lỗi khi đọc dữ liệu bản đồ (geometry). Đây không phải lỗi mạng trên điện thoại — cần sửa API/backend (Prisma/query).";
  }
  return null;
}

export default function VoiceARHuntScreen() {
  const scheme = useColorScheme() || "light";
  const isDark = scheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const pinId = normalizeRouteParam(params.pinId);

  const { permissionStatus: locationPermission } = useLocationContext();
  const [pin, setPin] = useState<VoicePin | null>(null);
  const [pinStatus, setPinStatus] = useState<"absent" | "loading" | "ready" | "failed">("absent");
  const [pinFailureHint, setPinFailureHint] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [deltaDeg, setDeltaDeg] = useState<number | null>(null);

  const posSubRef = useRef<Location.LocationSubscription | null>(null);
  const headSubRef = useRef<Location.LocationSubscription | null>(null);
  const headingRef = useRef<number | null>(null);
  const smoothedDeltaRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    if (!pinId) {
      setPinStatus("absent");
      setPin(null);
      setPinFailureHint(null);
      return;
    }
    setPinStatus("loading");
    setPin(null);
    setPinFailureHint(null);
    (async () => {
      if (!/^\d+$/.test(pinId)) {
        if (!cancelled) {
          setPin(null);
          setPinStatus("failed");
          setPinFailureHint("Mã pin không hợp lệ.");
        }
        return;
      }

      const detailPath = endpoints.voiceDetail(pinId);
      try {
        const res = await Apis.get(detailPath, { signal: controller.signal });
        const data = parseVoicePinFromDetailResponse(res);
        if (cancelled) return;
        if (data) {
          setPin(data);
          setPinStatus("ready");
        } else {
          setPin(null);
          setPinStatus("failed");
          setPinFailureHint("Dữ liệu pin từ máy chủ không đọc được.");
        }
      } catch (e) {
        if (axios.isCancel(e) || (e as { code?: string }).code === "ERR_CANCELED") return;
        const ax = e as { message?: string; response?: { status?: number; data?: unknown } };
        if (!cancelled) {
          setPin(null);
          setPinStatus("failed");
          const hint = userFacingVoiceDetailFailure(ax.response?.data);
          setPinFailureHint(hint);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pinId]);

  const unlockRadius = pin?.unlockRadius ?? 15;

  const directionLabel = useMemo(() => {
    if (pinStatus === "loading") return "Đang tải pin…";
    if (pinStatus === "failed" || pinStatus === "absent") return "—";
    if (!pin) return "—";
    if (distance == null) return "Đang định vị…";
    if (deltaDeg == null) return "Chưa có la bàn — đi bộ vài bước";
    if (deltaDeg > 15) return "Sang phải";
    if (deltaDeg < -15) return "Qua trái";
    return "Đi thẳng";
  }, [pinStatus, pin, distance, deltaDeg]);

  const distanceLabel = useMemo(() => {
    if (distance == null) return "—";
    if (distance < 10) return `${distance.toFixed(1)}m`;
    return `${Math.round(distance)}m`;
  }, [distance]);

  const proximityLabel = useMemo(() => {
    if (pinStatus === "loading") return "Đang tải dữ liệu pin…";
    if (pinStatus === "failed" || pinStatus === "absent") {
      if (pinStatus === "failed" && pinFailureHint) return "Không tải được pin — xem thông báo bên dưới.";
      return "Cần pin hợp lệ để dò hướng.";
    }
    if (distance == null) return "Đang định vị…";
    if (distance <= unlockRadius) return "Rất gần rồi — bật camera để mở!";
    if (distance <= 30) return "Đang rất gần…";
    if (distance <= 80) return "Tiếp tục tiến lại gần";
    return "Đi theo hướng dẫn";
  }, [distance, unlockRadius, pinStatus, pinFailureHint]);

  // Chỉ bắt đầu high-accuracy watcher khi permission đã được cấp (từ LocationContext)
  useEffect(() => {
    if (locationPermission !== "granted") return;

    let cancelled = false;
    (async () => {
      posSubRef.current?.remove();
      headSubRef.current?.remove();

      headSubRef.current = await Location.watchHeadingAsync((h) => {
        const t = h.trueHeading;
        const m = h.magHeading;
        headingRef.current = t >= 0 ? t : m >= 0 ? m : null;
      });

      posSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1500, distanceInterval: 8 },
        (loc) => {
          if (cancelled || !pin) return;
          const me = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const target = { latitude: pin.latitude, longitude: pin.longitude };
          const d = haversineDistanceMeters(me, target);
          setDistance(d);

          const compass = headingRef.current;
          const course = loc.coords.heading;
          const speed = loc.coords.speed ?? 0;
          const courseUsable =
            course != null && Number.isFinite(course) && course >= 0 && speed > 0.35;
          const deviceDeg = compass ?? (courseUsable ? course : null);
          if (deviceDeg == null) return;

          const bearing = initialBearingDegrees(me, target);
          const delta = normalizeAngleDegrees(bearing - deviceDeg);

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
  }, [locationPermission, pin]);

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
        {pinStatus === "failed" && (
          <Text style={styles.warn}>
            {pinFailureHint ??
              "Không tải được dữ liệu pin. Bạn có thể quay lại và thử lại khi mạng ổn định."}
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

