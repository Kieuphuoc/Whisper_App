import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { Text } from '@/components/ui/text';
import { authApis, endpoints } from '@/configs/Apis';
import { theme } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

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
    { id: 1, type: 'FRIEND_REQUEST', title: 'Tiếp nhận tín hiệu', message: 'Minh Tú đã gửi lời mời kết bạn cho bạn', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, type: 'REACTION', title: 'Xung động mới', message: 'Hoàng Yến đã thả tim vào giọng nói của bạn', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, type: 'COMMENT', title: 'Phản hồi tần số', message: 'Tuấn Anh đã bình luận: "Nhớ chỗ này lắm!"', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, type: 'FRIEND_ACCEPTED', title: 'Kết nối thành công', message: 'Lan Anh đã chấp nhận lời mời kết bạn của bạn', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 5, type: 'VOICE_NEARBY', title: 'Tín hiệu lân cận', message: 'Có một giọng nói ẩn cách bạn 50m!', isRead: false, createdAt: new Date(Date.now() - 300000).toISOString() },
];

// ─── Helpers ──────────────────────────────────────────────
const NOTIF_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; colors: string[] }> = {
    FRIEND_REQUEST: { icon: 'person-add', colors: ['#8b5cf6', '#6d28d9'] },
    FRIEND_ACCEPTED: { icon: 'people', colors: ['#10b981', '#059669'] },
    REACTION: { icon: 'heart', colors: ['#f87171', '#dc2626'] },
    COMMENT: { icon: 'chatbubble', colors: ['#60a5fa', '#2563eb'] },
    VOICE_NEARBY: { icon: 'location', colors: ['#facc15', '#d97706'] },
};
const DEFAULT_CONFIG = { icon: 'notifications' as keyof typeof Ionicons.glyphMap, colors: ['#9ca3af', '#4b5563'] };

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return `${m} phút`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ`;
    return `${Math.floor(h / 24)} ngày`;
}

// ─── Notification Item ────────────────────────────────────
function NotifItem({ item, index, onRead, isDark }: { item: Notification; index: number; onRead: (id: number) => void; isDark: boolean }) {
    const config = NOTIF_CONFIG[item.type] ?? DEFAULT_CONFIG;

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ delay: index * 100, type: 'spring', damping: 12 }}
        >
            <TouchableOpacity
                style={[styles.itemWrapper]}
                onPress={() => !item.isRead && onRead(item.id)}
                activeOpacity={0.8}
            >
                <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={[styles.itemContainer, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }]}>
                    <View style={styles.iconContainer}>
                        <LinearGradient colors={config.colors} style={styles.iconGradient}>
                            <Ionicons name={config.icon} size={20} color="#fff" />
                        </LinearGradient>
                        {!item.isRead && (
                            <MotiView
                                from={{ scale: 0.8, opacity: 0.5 }}
                                animate={{ scale: 1.2, opacity: 1 }}
                                transition={{ loop: true, type: 'timing', duration: 1500 }}
                                style={styles.unreadPulse}
                            />
                        )}
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, { color: isDark ? '#fff' : '#111827' }, !item.isRead && styles.boldText]}>
                                {item.title}
                            </Text>
                            <Text style={styles.timeTag}>Tín hiệu {timeAgo(item.createdAt)}</Text>
                        </View>
                        <Text style={[styles.itemMsg, { color: isDark ? 'rgba(255,255,255,0.7)' : '#4b5563' }]} numberOfLines={2}>
                            {item.message}
                        </Text>
                    </View>
                </BlurView>
            </TouchableOpacity>
        </MotiView>
    );
}

// ─── Main Screen ──────────────────────────────────────────
export default function NotificationScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];

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
            const raw = res.data?.data ?? res.data?.notifications ?? res.data ?? [];
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

    const unreadCount = useMemo(() => notifs.filter(n => !n.isRead).length, [notifs]);

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* AURA BACKGROUND */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={isDark ? ['#1e1b4b', '#000'] : ['#f5f3ff', '#fff']}
                    style={StyleSheet.absoluteFill}
                />
                <MotiView
                    from={{ opacity: 0.3, scale: 1 }}
                    animate={{ opacity: 0.6, scale: 1.2 }}
                    transition={{ loop: true, type: 'timing', duration: 10000, reverse: true }}
                    style={[styles.auraCircle, { backgroundColor: isDark ? '#4338ca' : '#c4b5fd', top: -100, left: -50 }]}
                />
            </View>

            {/* HEADER */}
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>Tín Hiệu</Text>
                    {unreadCount > 0 && (
                        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.badgeRow}>
                            <View style={styles.unreadIndicator} />
                            <Text style={styles.subtitle}>{unreadCount} tín hiệu chưa nhận diện</Text>
                        </MotiView>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity style={[styles.readAllBtn, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} onPress={markAllRead}>
                        <Ionicons name="checkmark-done" size={16} color={currentTheme.colors.primary} />
                        <Text style={[styles.readAllText, { color: currentTheme.colors.primary }]}>Nhận diện tất cả</Text>
                    </TouchableOpacity>
                )}
            </BlurView>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={currentTheme.colors.primary} size="large" />
                    <Text style={{ marginTop: 10, color: '#9ca3af' }}>Đang dò tìm tín hiệu...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifs}
                    keyExtractor={n => String(n.id)}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={currentTheme.colors.primary} />}
                    renderItem={({ item, index }) => <NotifItem item={item} index={index} onRead={markRead} isDark={isDark} />}
                    ListHeaderComponent={usedMock ? (
                        <View style={[styles.mockBanner, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb' }]}>
                            <Ionicons name="information-circle" size={14} color="#9ca3af" />
                            <Text style={styles.mockText}>Chế độ mô phỏng - Dữ liệu ngoại tuyến</Text>
                        </View>
                    ) : null}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <MotiView
                                from={{ rotate: '0deg' }}
                                animate={{ rotate: '360deg' }}
                                transition={{ loop: true, duration: 20000, type: 'timing' }}
                            >
                                <Ionicons name="radio-outline" size={80} color={isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"} />
                            </MotiView>
                            <Text style={styles.emptyText}>Bầu trời tĩnh lặng. Không có tín hiệu nào.</Text>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    auraCircle: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width,
        filter: 'blur(80px)',
        opacity: 0.4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    unreadIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
    subtitle: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
    readAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    readAllText: { fontSize: 12, fontWeight: '700' },
    listContent: { padding: 20, paddingBottom: 100 },
    itemWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
        borderWidth: 1.5,
    },
    iconContainer: {
        position: 'relative',
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconGradient: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    unreadPulse: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#7c3aed',
        borderWidth: 2,
        borderColor: '#fff',
    },
    contentContainer: { flex: 1, gap: 4 },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemTitle: { fontSize: 15, fontWeight: '600' },
    boldText: { fontWeight: '800' },
    timeTag: { fontSize: 10, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' },
    itemMsg: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
    mockBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(156, 163, 175, 0.2)',
    },
    mockText: { color: '#9ca3af', fontSize: 11, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyText: { color: '#9ca3af', fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 20 },
});
