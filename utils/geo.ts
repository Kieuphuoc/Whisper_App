export type LatLng = { latitude: number; longitude: number };

/** Expand a bounding box around its center (factor 2 = twice the lat/lng span). */
export function expandBoundingBox(
  b: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  factor: number
) {
  const midLat = (b.minLat + b.maxLat) / 2;
  const midLng = (b.minLng + b.maxLng) / 2;
  const halfLat = ((b.maxLat - b.minLat) / 2) * factor;
  const halfLng = ((b.maxLng - b.minLng) / 2) * factor;
  return {
    minLat: midLat - halfLat,
    maxLat: midLat + halfLat,
    minLng: midLng - halfLng,
    maxLng: midLng + halfLng,
  };
}

export function pointInBoundingBox(
  lat: number,
  lng: number,
  box: { minLat: number; maxLat: number; minLng: number; maxLng: number }
) {
  return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;
}

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function normalizeAngleDegrees(angle: number) {
  // Normalize to [-180, 180)
  let a = ((angle + 180) % 360 + 360) % 360 - 180;
  // handle -180 edge to keep it stable
  if (a === -180) a = 180;
  return a;
}

export function haversineDistanceMeters(a: LatLng, b: LatLng) {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = lat2 - lat1;
  const dLng = toRad(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export function initialBearingDegrees(from: LatLng, to: LatLng) {
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLng = toRad(to.longitude - from.longitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return ((brng % 360) + 360) % 360; // [0, 360)
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

