import { useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { VoicePin, VoiceType } from "@/types";
import { haversineDistanceMeters } from "@/utils/geo";
import { canPromptAR } from "@/storage/voiceARProgress";

type Result = {
  location: Location.LocationObject | null;
  nearbyPin: VoicePin | null;
  distanceMeters: number | null;
  isReady: boolean;
};

const TRIGGER_RADIUS_METERS = 100;

export function useARProximity(pins: VoicePin[]) : Result {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyPin, setNearbyPin] = useState<VoicePin | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  const pinsAR = useMemo(
    () => pins.filter((p) => p.type === VoiceType.HIDDEN_AR || p.type?.toString?.() === "HIDDEN_AR"),
    [pins]
  );

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const evaluatingRef = useRef(false);
  const lastSelectedPinIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== "granted") {
        setIsReady(true);
        return;
      }

      try {
        const loc = await Location.getLastKnownPositionAsync({});
        if (!cancelled && loc) setLocation(loc);
      } catch {
        // ignore
      }

      watchRef.current?.remove();
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 25,
          mayShowUserSettingsDialog: true,
        },
        (loc) => {
          setLocation(loc);
        }
      );
      if (!cancelled) setIsReady(true);
    })();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!location || pinsAR.length === 0) {
      setNearbyPin(null);
      setDistanceMeters(null);
      return;
    }

    if (evaluatingRef.current) return;
    evaluatingRef.current = true;

    const run = async () => {
      const me = { latitude: location.coords.latitude, longitude: location.coords.longitude };

      let best: { pin: VoicePin; d: number } | null = null;
      for (const pin of pinsAR) {
        const d = haversineDistanceMeters(me, { latitude: pin.latitude, longitude: pin.longitude });
        if (d <= TRIGGER_RADIUS_METERS && (!best || d < best.d)) {
          best = { pin, d };
        }
      }

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
  }, [location, pinsAR]);

  return { location, nearbyPin, distanceMeters, isReady };
}

