import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '../configs/Apis';
import { VoicePin } from '../types';

export function useDiscovery() {
    const [isScanning, setIsScanning] = useState(false);
    const [discoveredPin, setDiscoveredPin] = useState<VoicePin | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRandomVoice = useCallback(async (lat: number, lng: number) => {
        try {
            setError(null);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('Bạn cần đăng nhập để khám phá');
                return;
            }

            const api = authApis(token);
            // radius set to 5km by default
            const res = await api.get(endpoints.voiceRandom, {
                params: { lat, lng, radius: 5 }
            });

            if (res.data?.data) {
                setDiscoveredPin(res.data.data);
            }
        } catch (err: any) {
            console.error('Failed to discover voice:', err);
            if (err.response?.status === 404) {
                setError('Không tìm thấy giọng nói nào quanh đây. Hãy thử lại sau!');
            } else {
                setError('Có lỗi xảy ra khi quét bản đồ');
            }
        }
    }, []);

    const triggerScan = useCallback(async (lat: number, lng: number) => {
        setIsScanning(true);
        setDiscoveredPin(null);
        setError(null);

        // Simulate scan duration
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await fetchRandomVoice(lat, lng);
        setIsScanning(false);
    }, [fetchRandomVoice]);

    const resetDiscovery = useCallback(() => {
        setDiscoveredPin(null);
        setError(null);
        setIsScanning(false);
    }, []);

    return {
        isScanning,
        discoveredPin,
        error,
        triggerScan,
        resetDiscovery,
    };
}
