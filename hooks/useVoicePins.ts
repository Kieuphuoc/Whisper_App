import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import Apis, { authApis, endpoints } from '../configs/Apis';
import { Visibility, VoicePin } from '../types';

export function useVoicePins(visibility: Visibility) {
    const [pins, setPins] = useState<VoicePin[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPins = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let data: VoicePin[] = [];

            if (visibility === 'PUBLIC') {
                // Public pins - no auth needed
                const res = await Apis.get(endpoints.voicePublic);
                data = res.data?.data ?? [];
            } else {
                // Friends and Private pins need auth
                const token = await AsyncStorage.getItem('token');
                if (!token) return;
                const api = authApis(token);

                if (visibility === 'FRIENDS') {
                    const res = await api.get(endpoints.voiceFriends);
                    data = res.data?.data ?? [];
                } else if (visibility === 'PRIVATE') {
                    // User's own pins
                    const res = await api.get(endpoints.voice);
                    data = res.data?.data ?? [];
                }
            }

            setPins(data);
        } catch (err) {
            console.error('Failed to fetch voice pins:', err);
            setError('Could not load voice pins');
        } finally {
            setLoading(false);
        }
    }, [visibility]);

    useEffect(() => {
        fetchPins();
    }, [fetchPins]);

    return { pins, loading, error, refetch: fetchPins };
}
