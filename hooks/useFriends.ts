import { useState, useEffect, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '@/configs/Apis';
import { MyUserContext } from '@/configs/Context';

export interface FriendUser {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
    hasNewPost?: boolean;
    lastPostLocation?: {
        latitude: number;
        longitude: number;
    };
}

export interface PendingRequest {
    id: number;
    status: 'PENDING';
    sender?: FriendUser;
    receiver?: FriendUser;
    createdAt: string;
    _dir?: 'received' | 'sent';
}

export function useFriends() {
    const user = useContext(MyUserContext);
    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            
            const [fRes, pRes] = await Promise.all([
                api.get(endpoints.friendList(user.id)),
                api.get(endpoints.friendPending),
            ]);

            const fData = fRes.data?.data ?? fRes.data ?? [];
            // For now, let's mock 'hasNewPost' randomly to show the visual enhancement
            const enrichedFriends = (Array.isArray(fData) ? fData : []).map((f: any) => ({
                ...f,
                hasNewPost: Math.random() > 0.7, // Mocking
            }));
            setFriends(enrichedFriends);

            const pData = pRes.data?.data ?? pRes.data ?? [];
            if (Array.isArray(pData)) {
                setPending(pData);
            } else if (pData && typeof pData === 'object') {
                const received = (pData.received ?? []).map((r: any) => ({ ...r, _dir: 'received' }));
                const sent = (pData.sent ?? []).map((r: any) => ({ ...r, _dir: 'sent' }));
                setPending([...received, ...sent]);
            }
        } catch (e) {
            console.error('useFriends error:', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const receivedCount = pending.filter(r => r._dir === 'received' || r.sender?.id !== user?.id).length;

    return {
        friends,
        pending,
        receivedCount,
        loading,
        refetch: load,
    };
}
