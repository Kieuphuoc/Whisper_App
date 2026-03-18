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

export function useVoicePins(visibility: Visibility, bbox?: BoundingBox) {
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
                data = res.data?.data ?? [];
            } else {
                // Legacy / List fetching
                if (visibility === 'PUBLIC') {
                    const res = await api.get(endpoints.voicePublic, { signal });
                    data = res.data?.data ?? [];
                } else if (token) {
                    const res = await api.get(
                        visibility === 'FRIENDS' ? endpoints.voiceFriends : endpoints.voice,
                        { signal }
                    );
                    data = res.data?.data ?? [];
                }
            }

            return data;
        },
        enabled: true, // queryFn handles all visibility/bbox combinations internally
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        placeholderData: keepPreviousData, // Maintain markers while loading
    });
}
