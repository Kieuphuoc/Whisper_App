import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { authApis, endpoints } from '../configs/Apis';
import { VoicePin } from '../types';

/** Fetch all voice pins owned by the currently logged-in user. */
export function useMyPins() {
    const [pins, setPins] = useState<VoicePin[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPins = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const res = await api.get(endpoints.voice);
            setPins(res.data?.data ?? []);
        } catch (err) {
            console.error('useMyPins error:', err);
            setError('Không thể tải ký ức của bạn');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPins(); }, [fetchPins]);

    return { pins, loading, error, refetch: fetchPins };
}
