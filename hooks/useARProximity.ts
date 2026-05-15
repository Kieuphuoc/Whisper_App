import { useEffect, useMemo, useRef, useState } from "react";
import { VoicePin, VoiceType } from "@/types";
import { haversineDistanceMeters } from "@/utils/geo";
import { canPromptAR } from "@/storage/voiceARProgress";
import { useLocationContext } from "@/contexts/LocationContext";
import { GeofenceService } from "@/services/GeofenceService";

type Result = {
  location: ReturnType<typeof useLocationContext>["location"];
  nearbyPin: VoicePin | null;
  distanceMeters: number | null;
  isReady: boolean;
};

const TRIGGER_RADIUS_METERS = 100;
const SIGNIFICANT_MOVE_METERS = 30; // Chỉ tính toán lại nếu di chuyển > 30m

export function useARProximity(pins: VoicePin[]): Result {
  const { location, isReady: locationReady } = useLocationContext();

  const [nearbyPin, setNearbyPin] = useState<VoicePin | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const pinsAR = useMemo(
    () => pins.filter((p) => p.type === VoiceType.HIDDEN_AR || p.type?.toString?.() === "HIDDEN_AR"),
    [pins]
  );

  // Đăng ký Geofencing khi danh sách Pin thay đổi
  useEffect(() => {
    if (pinsAR.length > 0) {
      GeofenceService.registerNearbyPins(pinsAR);
    }
    return () => {
      // Không nên stopAll ở đây vì có thể app vẫn cần tracking ngầm khi unmount hook này (về home)
    };
  }, [pinsAR]);

  const evaluatingRef = useRef(false);
  const lastSelectedPinIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    if (!location || pinsAR.length === 0) {
      setNearbyPin(null);
      setDistanceMeters(null);
      return;
    }

    const currentCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
    
    // Tối ưu: Kiểm tra nếu người dùng chưa di chuyển đủ xa thì bỏ qua loop tính toán
    if (lastCoordsRef.current) {
      const moved = haversineDistanceMeters(lastCoordsRef.current, currentCoords);
      if (moved < SIGNIFICANT_MOVE_METERS && nearbyPin) {
          // Vẫn cập nhật khoảng cách cho Pin hiện tại nếu đang ở gần để UI mượt, nhưng không loop lại toàn bộ
          const d = haversineDistanceMeters(currentCoords, { latitude: nearbyPin.latitude, longitude: nearbyPin.longitude });
          setDistanceMeters(d);
          return;
      }
    }

    if (evaluatingRef.current) return;
    evaluatingRef.current = true;

    const run = async () => {
      let best: { pin: VoicePin; d: number } | null = null;
      for (const pin of pinsAR) {
        const d = haversineDistanceMeters(currentCoords, { latitude: pin.latitude, longitude: pin.longitude });
        if (d <= TRIGGER_RADIUS_METERS && (!best || d < best.d)) {
          best = { pin, d };
        }
      }

      lastCoordsRef.current = currentCoords;

      if (!best) {
        lastSelectedPinIdRef.current = null;
        setNearbyPin(null);
        setDistanceMeters(null);
        return;
      }

      // Avoid flicker: keep previous if same pin
      const bestId = best.pin.id;
      const canPrompt = await canPromptAR(bestId);
      if (!canPrompt) {
        if (lastSelectedPinIdRef.current === bestId) {
          setDistanceMeters(best.d);
        } else {
          lastSelectedPinIdRef.current = null;
          setNearbyPin(null);
          setDistanceMeters(null);
        }
        return;
      }

      lastSelectedPinIdRef.current = bestId;
      setNearbyPin(best.pin);
      setDistanceMeters(best.d);
    };

    run().finally(() => {
      evaluatingRef.current = false;
    });
  }, [location, pinsAR, nearbyPin]);

  return { location, nearbyPin, distanceMeters, isReady: locationReady };
}
