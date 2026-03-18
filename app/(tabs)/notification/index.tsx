import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { authApis, endpoints } from '@/configs/Apis';

// ─── Types ────────────────────────────────────────────────
interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedId?: number;
}

// ─── Mock fallback data ───────────────────────────────────
const MOCK: Notification[] = [
    { id: 1, type: 'FRIEND_REQUEST', title: 'Lời mời kết bạn', message: 'Minh Tú đã gửi lời mời kết bạn cho bạn', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, type: 'REACTION', title: 'Cảm xúc mới', message: 'Hoàng Yến đã thả tim vào giọng nói của bạn', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, type: 'COMMENT', title: 'Bình luận mới', message: 'Tuấn Anh đã bình luận: "Nhớ chỗ này lắm!"', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, type: 'FRIEND_ACCEPTED', title: 'Kết bạn thành công', message: 'Lan Anh đã chấp nhận lời mời kết bạn của bạn', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 5, type: 'VOICE_NEARBY', title: 'Giọng nói gần bạn', message: 'Có một giọng nói ẩn cách bạn 50m!', isRead: false, createdAt: new Date(Date.now() - 300000).toISOString() },
];

// ─── Helpers ──────────────────────────────────────────────
const NOTIF_ICON: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
    FRIEND_REQUEST: { name: 'person-add-outline', color: '#8b5cf6', bg: '#f5f3ff' },
    FRIEND_ACCEPTED: { name: 'people-outline', color: '#10b981', bg: '#ecfdf5' },
    REACTION: { name: 'heart-outline', color: '#f87171', bg: '#fff1f2' },
    COMMENT: { name: 'chatbubble-outline', color: '#60a5fa', bg: '#eff6ff' },
    VOICE_NEARBY: { name: 'location-outline', color: '#facc15', bg: '#fffbeb' },
};
const DEFAULT_ICON = { name: 'notifications-outline' as keyof typeof Ionicons.glyphMap, color: '#9ca3af', bg: '#f3f4f6' };

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    return `${Math.floor(h / 24)} ngày trước`;
}

// ─── Notification Item ────────────────────────────────────
function NotifItem({ item, onRead }: { item: Notification; onRead: (id: number) => void }) {
    const meta = NOTIF_ICON[item.type] ?? DEFAULT_ICON;
    return (
        <TouchableOpacity
            style={[styles.item, !item.isRead && styles.itemUnread]}
            onPress={() => !item.isRead && onRead(item.id)}
            activeOpacity={0.8}
        >
            <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.name} size={20} color={meta.color} />
            </View>
            <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, !item.isRead && styles.titleBold]}>{item.title}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.itemMsg} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────
export default function NotificationScreen() {
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [usedMock, setUsedMock] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) { setNotifs(MOCK); setUsedMock(true); return; }
            const api = authApis(token);
            const res = await api.get(endpoints.notifications);
            // Response may be { data: [...] } or a direct array
            const raw = res.data?.data ?? res.data ?? [];
            const data: Notification[] = Array.isArray(raw) ? raw : [];
            if (data.length === 0) { setNotifs(MOCK); setUsedMock(true); }
            else { setNotifs(data); setUsedMock(false); }
        } catch {
            setNotifs(MOCK);
            setUsedMock(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const markRead = async (id: number) => {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        if (usedMock) return;
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) await authApis(token).put(endpoints.notificationRead(id));
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
        if (usedMock) return;
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) await authApis(token).put(endpoints.notificationsReadAll);
        } catch { /* silent */ }
    };

    const unread = (Array.isArray(notifs) ? notifs : []).filter(n => !n.isRead).length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Thông báo</Text>
                    {unread > 0 && <Text style={styles.subtitle}>{unread} chưa đọc</Text>}
                </View>
                {unread > 0 && (
                    <TouchableOpacity style={styles.readAllBtn} onPress={markAllRead}>
                        <Ionicons name="checkmark-done-outline" size={16} color="#8b5cf6" />
                        <Text style={styles.readAllText}>Đọc tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>

            {usedMock && (
                <View style={styles.mockBanner}>
                    <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
                    <Text style={styles.mockText}>Đang hiển thị dữ liệu mẫu</Text>
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#8b5cf6" size="large" />
                </View>
            ) : (
                <FlatList
                    data={notifs}
                    keyExtractor={n => String(n.id)}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#8b5cf6" />}
                    renderItem={({ item }) => <NotifItem item={item} onRead={markRead} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="notifications-off-outline" size={52} color="#d1d5db" />
                            <Text style={styles.emptyText}>Không có thông báo nào</Text>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fafafa' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#fafafa',
    },
    title: { fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 3 },
    readAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#f5f3ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    readAllText: { color: '#8b5cf6', fontSize: 12, fontWeight: '600' },
    mockBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: '#f9fafb',
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    mockText: { color: '#9ca3af', fontSize: 12 },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    itemUnread: {
        borderLeftWidth: 3,
        borderLeftColor: '#8b5cf6',
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: { flex: 1, gap: 3 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    itemTitle: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1 },
    titleBold: { fontWeight: '700', color: '#111827' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8b5cf6' },
    itemMsg: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
    itemTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
    emptyText: { color: '#9ca3af', fontSize: 15 },
});
