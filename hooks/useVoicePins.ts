import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Apis, { authApis, endpoints } from '../configs/Apis';
import { Visibility, VoicePin } from '../types';

export interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

/** BBox list đôi khi trả id dưới dạng snake_case / string — chuẩn hoá để tránh String(undefined) khi mở hunt. */
function normalizeBBoxVoicePins(list: unknown): VoicePin[] {
    if (!Array.isArray(list)) return [];
    const out: VoicePin[] = [];
    for (const raw of list) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        const idRaw = o.id ?? o.voice_pin_id ?? o.voicePinId;
        const latRaw = o.latitude ?? o.lat;
        const lngRaw = o.longitude ?? o.lng ?? o.lon;
        const idNum =
            typeof idRaw === "number" && Number.isFinite(idRaw)
                ? idRaw
                : typeof idRaw === "string" && idRaw.trim() !== "" && Number.isFinite(Number(idRaw))
                  ? Number(idRaw)
                  : NaN;
        const latNum = typeof latRaw === "number" ? latRaw : Number(latRaw);
        const lngNum = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);
        if (!Number.isFinite(idNum) || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) continue;
        out.push({ ...(raw as object), id: idNum, latitude: latNum, longitude: lngNum } as VoicePin);
    }
    return out;
}

export function useVoicePins(visibility: Visibility, bbox?: BoundingBox, options: { enabled?: boolean } = {}) {
    // 1. Quantize BBox for Query Key Stability (4 decimal places ~ 11m)
    const quantizedBBox = bbox ? {
        minLat: parseFloat(bbox.minLat.toFixed(4)),
        maxLat: parseFloat(bbox.maxLat.toFixed(4)),
        minLng: parseFloat(bbox.minLng.toFixed(4)),
        maxLng: parseFloat(bbox.maxLng.toFixed(4)),
    } : null;

    const queryKey = ['voicePins', visibility, quantizedBBox];

    return useQuery({
        queryKey,
        queryFn: async ({ signal }) => {
            let data: VoicePin[] = [];
            const token = await AsyncStorage.getItem('token');
            const api = token ? authApis(token) : Apis;

            if (bbox) {
                // Use BBox fetching with safeguards
                const res = await api.get(endpoints.voiceBBox, {
                    params: {
                        minLat: bbox.minLat,
                        maxLat: bbox.maxLat,
                        minLng: bbox.minLng,
                        maxLng: bbox.maxLng,
                        visibility
                    },
                    signal // Axios support for AbortController via TanStack Query signal
                });
                const raw = res.data?.data ?? res.data;
                data = normalizeBBoxVoicePins(Array.isArray(raw) ? raw : []);
            }

            return data;
        },
        enabled: options.enabled ?? true, // queryFn handles all visibility/bbox combinations internally
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        gcTime: 1000 * 60 * 2, // drop inactive bbox queries sooner — many pan/zoom keys otherwise stay in memory
        placeholderData: keepPreviousData, // Maintain markers while loading
    });
}
