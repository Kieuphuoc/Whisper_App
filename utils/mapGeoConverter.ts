import { VoicePin } from "@/types";

export interface PinFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: VoicePin;
}

export interface PinFeatureCollection {
  type: "FeatureCollection";
  features: PinFeature[];
}

/**
 * Chuyển đổi danh sách VoicePin sang GeoJSON cho Mapbox
 * Lưu ý: Mapbox dùng [longitude, latitude]
 */
export const pinsToGeoJSON = (pins: VoicePin[]): PinFeatureCollection => {
  return {
    type: "FeatureCollection",
    features: pins.map((pin) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [pin.longitude, pin.latitude],
      },
      properties: pin,
    })),
  };
};
