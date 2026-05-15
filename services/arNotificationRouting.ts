import type { Router } from "expo-router";

type NotificationData = {
  type?: string;
  pinId?: string | number;
  voicePinId?: string | number;
};

/** Navigate to Voice AR hunt when user taps a geofence / AR notification. */
export function routeArNotification(router: Router, data: NotificationData | undefined) {
  if (!data) return false;
  const isAr =
    data.type === "AR_PIN_NEARBY" || data.type === "ar_pin_nearby" || data.pinId != null;
  if (!isAr) return false;

  const rawId = data.pinId ?? data.voicePinId;
  if (rawId == null || String(rawId).trim() === "") return false;

  router.push({ pathname: "/voice-ar/hunt", params: { pinId: String(rawId) } });
  return true;
}
