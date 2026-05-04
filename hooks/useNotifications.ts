import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '@/configs/Apis';
import { useFocusEffect } from 'expo-router';

export function useNotifications() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const res = await api.get(endpoints.notificationsUnread);
            setUnreadCount(res.data?.unreadCount || 0);
        } catch (e) {
            console.error('[useNotifications] Fetch unread count error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Re-fetch when screen focused
    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
        }, [fetchUnreadCount])
    );

    return {
        unreadCount,
        loading,
        refetch: fetchUnreadCount,
        setUnreadCount, // Allow manual override if needed
    };
}
