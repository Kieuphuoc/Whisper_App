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
    Image,
    SectionList,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { Text } from '@/components/ui/text';
import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { theme } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────
interface Notification {
    id: number;
    type: string;
    isRead: boolean;
    data: any;
    createdAt: string;
    userId: number;
}

type TabType = 'all' | 'requests' | 'interactions';

// ─── Mock fallback data ───────────────────────────────────
const MOCK: Notification[] = [
    { 
        id: 1, 
        type: 'FRIEND_REQUEST', 
        isRead: false, 
        createdAt: new Date().toISOString(),
        userId: 1,
        data: { senderName: 'Minh Tú', senderAvatar: 'https://i.pravatar.cc/150?u=1', friendshipId: 101 }
    },
    { 
        id: 2, 
        type: 'NEW_REACTION', 
        isRead: false, 
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        userId: 1,
        data: { reactorName: 'Hoàng Yến', reactorAvatar: 'https://i.pravatar.cc/150?u=2', reactionType: 'LOVE', voicePinId: 5 }
    },
    { 
        id: 3, 
        type: 'NEW_COMMENT', 
        isRead: true, 
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        userId: 1,
        data: { commenterName: 'Tuấn Anh', commenterAvatar: 'https://i.pravatar.cc/150?u=3', snippet: 'Nhớ chỗ này lắm!', voicePinId: 5 }
    },
    { 
        id: 4, 
        type: 'FRIEND_ACCEPTED', 
        isRead: true, 
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        userId: 1,
        data: { accepterName: 'Lan Anh', accepterAvatar: 'https://i.pravatar.cc/150?u=4', friendshipId: 102 }
    },
    { 
        id: 5, 
        type: 'FRIEND_VOICEPIN', 
        isRead: false, 
        createdAt: new Date(Date.now() - 600000).toISOString(),
        userId: 1,
        data: { posterName: 'Quốc Bảo', posterAvatar: 'https://i.pravatar.cc/150?u=5', voicePinId: 10, voicePinContent: 'Phát hiện quán cafe này chill phết...' }
    },
];

// ─── Transition helpers ───────────────────────────────────
const NOTIF_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; colors: string[]; label: string }> = {
    FRIEND_REQUEST: { icon: 'person-add', colors: ['#8b5cf6', '#6d28d9'], label: 'Lời mời kết bạn' },
    FRIEND_ACCEPTED: { icon: 'people', colors: ['#10b981', '#059669'], label: 'Kết nối mới' },
    NEW_REACTION: { icon: 'heart', colors: ['#f87171', '#dc2626'], label: 'Cảm xúc mới' },
    NEW_COMMENT: { icon: 'chatbubble', colors: ['#60a5fa', '#2563eb'], label: 'Bình luận mới' },
    COMMENT_REPLY: { icon: 'arrow-undo', colors: ['#60a5fa', '#1d4ed8'], label: 'Phản hồi bình luận' },
    FRIEND_VOICEPIN: { icon: 'mic', colors: ['#f59e0b', '#d97706'], label: 'VoicePin từ bạn bè' },
    SYSTEM_MESSAGE: { icon: 'information-circle', colors: ['#9ca3af', '#4b5563'], label: 'Thông báo hệ thống' },
};

const DEFAULT_CONFIG = { icon: 'notifications' as keyof typeof Ionicons.glyphMap, colors: ['#9ca3af', '#4b5563'], label: 'Thông báo' };

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Vừa xong';
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ─── Components ───────────────────────────────────────────

const FilterTab = ({ label, active, onPress, isDark, theme }: { label: string, active: boolean, onPress: () => void, isDark: boolean, theme: any }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <MotiView
            animate={{
                backgroundColor: active ? (isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.1)') : 'transparent',
                borderColor: active ? theme.colors.primary : 'rgba(156, 163, 175, 0.2)',
                scale: active ? 1.05 : 1
            }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.tabItem}
        >
            <Text style={[styles.tabText, { color: active ? theme.colors.primary : '#9ca3af', fontWeight: active ? '800' : '600' }]}>
                {label}
            </Text>
            {active && (
                <MotiView
                    layout={undefined}
                    style={[styles.tabDot, { backgroundColor: theme.colors.primary }]}
                />
            )}
        </MotiView>
    </TouchableOpacity>
);

function NotifItem({ 
    item, 
    onRead, 
    onAction,
    isDark, 
    theme 
}: { 
    item: Notification; 
    onRead: (id: number) => void; 
    onAction: (id: number, action: string, data: any) => void;
    isDark: boolean; 
    theme: any 
}) {
    const config = NOTIF_CONFIG[item.type] ?? DEFAULT_CONFIG;
    const { data } = item;

    // Resolve Avatar
    const avatarUri = useMemo(() => {
        const url = data?.senderAvatar || data?.reactorAvatar || data?.commenterAvatar || data?.replierAvatar || data?.posterAvatar;
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }, [data]);

    const getMessage = () => {
        switch(item.type) {
            case 'FRIEND_REQUEST': return `${data?.senderName || 'Ai đó'} đã gửi lời mời kết bạn.`;
            case 'FRIEND_ACCEPTED': return `${data?.accepterName || 'Ai đó'} đã chấp nhận lời mời.`;
            case 'NEW_REACTION': return `${data?.reactorName || 'Ai đó'} đã bày tỏ cảm xúc với VoicePin của bạn.`;
            case 'NEW_COMMENT': return `${data?.commenterName || 'Ai đó'}: "${data?.snippet || '...'}"`;
            case 'COMMENT_REPLY': return `${data?.replierName || 'Ai đó'} đã phản hồi bình luận của bạn: "${data?.snippet || '...'}"`;
            case 'FRIEND_VOICEPIN': return `${data?.posterName || 'Bạn bè'} vừa đăng: "${data?.voicePinContent || '...'}"`;
            default: return 'Bạn có thông báo mới.';
        }
    };

    return (
        <MotiView
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={styles.itemWrapper}
        >
            <TouchableOpacity
                onPress={() => onRead(item.id)}
                activeOpacity={0.9}
                style={[styles.itemContainer, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            >
                <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                
                <View style={styles.leftCol}>
                    <View style={styles.avatarContainer}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        ) : (
                            <LinearGradient colors={config.colors as any} style={styles.avatarPlaceholder}>
                                <Ionicons name={config.icon} size={20} color="#fff" />
                            </LinearGradient>
                        )}
                        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
                        
                        <View style={[styles.miniTypeIcon, { backgroundColor: config.colors[0] }]}>
                            <Ionicons name={config.icon} size={10} color="#fff" />
                        </View>
                    </View>
                </View>

                <View style={styles.rightCol}>
                    <View style={styles.itemMeta}>
                        <Text style={[styles.notifTypeLabel, { color: config.colors[0] }]}>{config.label}</Text>
                        <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    
                    <Text style={[styles.messageText, { color: isDark ? '#fff' : '#1f2937' }, !item.isRead && styles.boldText]}>
                        {getMessage()}
                    </Text>

                    {item.type === 'FRIEND_REQUEST' && !item.isRead && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                                onPress={() => onAction(item.id, 'ACCEPT_FRIEND', data)}
                            >
                                <Text style={styles.actionButtonText}>Chấp nhận</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.secondaryAction, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                onPress={() => onAction(item.id, 'REJECT_FRIEND', data)}
                            >
                                <Text style={[styles.actionButtonText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </MotiView>
    );
}

// ─── Main Screen ──────────────────────────────────────────
export default function NotificationScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const themeContext = theme[colorScheme];

    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [usedMock, setUsedMock] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) { setNotifs(MOCK); setUsedMock(true); return; }
            const api = authApis(token);
            const res = await api.get(endpoints.notifications);
            const data = res.data?.notifications || res.data?.data || [];
            
            if (data.length === 0) {
                setNotifs(MOCK);
                setUsedMock(true);
            } else {
                setNotifs(data);
                setUsedMock(false);
            }
        } catch (e) {
            console.error('Load notifications error:', e);
            setNotifs(MOCK);
            setUsedMock(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filteredNotifs = useMemo(() => {
        if (activeTab === 'all') return notifs;
        if (activeTab === 'requests') return notifs.filter(n => n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPTED');
        return notifs.filter(n => n.type !== 'FRIEND_REQUEST' && n.type !== 'FRIEND_ACCEPTED');
    }, [notifs, activeTab]);

    const sectionedData = useMemo(() => {
        const today: Notification[] = [];
        const yesterday: Notification[] = [];
        const older: Notification[] = [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);

        filteredNotifs.forEach(n => {
            const d = new Date(n.createdAt);
            if (d >= now) today.push(n);
            else if (d >= yest) yesterday.push(n);
            else older.push(n);
        });

        const result = [];
        if (today.length) result.push({ title: 'Hôm nay', data: today });
        if (yesterday.length) result.push({ title: 'Hôm qua', data: yesterday });
        if (older.length) result.push({ title: 'Cũ hơn', data: older });
        return result;
    }, [filteredNotifs]);

    const handleRead = async (id: number) => {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        if (usedMock) return;
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) await authApis(token).put(endpoints.notificationRead(id));
        } catch { /* Silent */ }
    };

    const handleAction = async (id: number, action: string, data: any) => {
        if (usedMock) {
            alert(`Tính năng này yêu cầu kết nối máy chủ (Action: ${action})`);
            return;
        }
        
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);

            if (action === 'ACCEPT_FRIEND' || action === 'REJECT_FRIEND') {
                const status = action === 'ACCEPT_FRIEND' ? 'ACCEPTED' : 'REJECTED';
                await api.post(endpoints.friendRespond(data.friendshipId), { status });
                // Mark original notification as read and remove from UI list if needed
                handleRead(id);
                load(true); // reload to get updated status
            }
        } catch (e: any) {
            alert(e.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const markAllRead = async () => {
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
        if (usedMock) return;
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) await authApis(token).put(endpoints.notificationsReadAll);
        } catch { /* Silent */ }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeContext.colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            {/* AURA BACKGROUND */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={isDark ? ['#1e1b4b', '#000'] : ['#f5f3ff', '#fff']}
                    style={StyleSheet.absoluteFill}
                />
                <MotiView
                    from={{ opacity: 0.2, scale: 1 }}
                    animate={{ opacity: 0.4, scale: 1.5 }}
                    transition={{ loop: true, type: 'timing', duration: 15000, repeatReverse: true }}
                    style={[styles.auraCircle, { backgroundColor: isDark ? '#4338ca' : '#ddd6fe', top: -50, right: -100 }]}
                />
            </View>

            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>Tín Hiệu</Text>
                    <Text style={styles.subtitle}>Kết nối từ tần số của bạn</Text>
                </View>
                <TouchableOpacity 
                    onPress={markAllRead}
                    style={[styles.headerIconBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                >
                    <Ionicons name="checkmark-done" size={20} color={themeContext.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* TABS */}
            <View style={styles.tabContainer}>
                <FilterTab label="Tất cả" active={activeTab === 'all'} onPress={() => setActiveTab('all')} isDark={isDark} theme={themeContext} />
                <FilterTab label="Lời mời" active={activeTab === 'requests'} onPress={() => setActiveTab('requests')} isDark={isDark} theme={themeContext} />
                <FilterTab label="Tương tác" active={activeTab === 'interactions'} onPress={() => setActiveTab('interactions')} isDark={isDark} theme={themeContext} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator color={themeContext.colors.primary} size="large" />
                    <Text style={{ marginTop: 15, color: '#9ca3af', fontWeight: '600' }}>Đang quét dải tần...</Text>
                </View>
            ) : (
                <SectionList
                    sections={sectionedData}
                    keyExtractor={item => String(item.id)}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={themeContext.colors.primary} />
                    }
                    renderItem={({ item }) => (
                        <NotifItem 
                            item={item} 
                            onRead={handleRead} 
                            onAction={handleAction}
                            isDark={isDark} 
                            theme={themeContext} 
                        />
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDash, { backgroundColor: themeContext.colors.primary }]} />
                            <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }]}>
                                {title}
                            </Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MotiView
                                from={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring' }}
                                style={styles.emptyIconBox}
                            >
                                <Ionicons name="radio" size={60} color={isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"} />
                            </MotiView>
                            <Text style={styles.emptyText}>Bầu trời tĩnh lặng. Không có tín hiệu nào mới.</Text>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    auraCircle: {
        position: 'absolute',
        width: width,
        height: width,
        borderRadius: width / 2,
        filter: 'blur(100px)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 70,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    title: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
    subtitle: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginTop: -2 },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 10,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabText: { fontSize: 13 },
    tabDot: { width: 4, height: 4, borderRadius: 2, marginLeft: 6 },
    listContent: { paddingHorizontal: 20, paddingBottom: 120 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 15,
        gap: 10,
    },
    sectionDash: { width: 3, height: 14, borderRadius: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    itemWrapper: {
        borderRadius: 28,
        overflow: 'hidden',
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 18,
        gap: 15,
        borderWidth: 1.2,
        borderRadius: 28,
    },
    leftCol: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 54,
        height: 54,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadDot: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    miniTypeIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    rightCol: { flex: 1, gap: 4 },
    itemMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    notifTypeLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeText: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
    messageText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    boldText: { fontWeight: '800' },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryAction: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    actionButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.02)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { color: '#9ca3af', fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
