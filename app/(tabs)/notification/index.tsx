import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
    Image,
    SectionList,
    Modal,
    Alert,
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
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

// ─── Transition helpers ───────────────────────────────────
const NOTIF_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; colors: string[]; label: string }> = {
    FRIEND_REQUEST: { icon: 'person-add', colors: ['#8b5cf6', '#6d28d9'], label: 'Lời mời kết bạn' },
    FRIEND_ACCEPTED: { icon: 'people', colors: ['#10b981', '#059669'], label: 'Kết nối mới' },
    NEW_REACTION: { icon: 'heart', colors: ['#f87171', '#dc2626'], label: 'Cảm xúc mới' },
    NEW_COMMENT: { icon: 'chatbubble', colors: ['#60a5fa', '#2563eb'], label: 'Bình luận mới' },
    COMMENT_REPLY: { icon: 'arrow-undo', colors: ['#60a5fa', '#1d4ed8'], label: 'Phản hồi bình luận' },
    FRIEND_VOICEPIN: { icon: 'mic', colors: ['#f59e0b', '#d97706'], label: 'VoicePin từ bạn bè' },
    SYSTEM_MESSAGE: { icon: 'information-circle', colors: ['#9ca3af', '#4b5563'], label: 'Thông báo hệ thống' },
    NEW_MESSAGE: { icon: 'chatbubbles', colors: ['#10b981', '#3b82f6'], label: 'Tin nhắn mới' },
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
    onNavigate,
    isDark,
    theme,
    onDelete,
}: {
    item: Notification;
    onRead: (id: number) => void;
    onAction: (id: number, action: string, data: any) => void;
    onNavigate: (item: Notification) => void;
    isDark: boolean;
    theme: any;
    onDelete: (id: number) => void;
}) {
    const config = NOTIF_CONFIG[item.type] ?? DEFAULT_CONFIG;
    const { data } = item;

    const renderRightActions = () => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => onDelete(item.id)}
                activeOpacity={0.7}
            >
                <Ionicons name="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
        );
    };

    const avatarUri = useMemo(() => {
        const url = data?.senderAvatar || data?.reactorAvatar || data?.commenterAvatar || data?.replierAvatar || data?.posterAvatar;
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }, [data]);

    const REACTION_MAP: Record<string, string> = {
        'LIKE': '👍',
        'LOVE': '❤️',
        'LAUGH': '😂',
        'SAD': '😢',
        'ANGRY': '😡'
    };

    const getMessage = () => {
        const nameStyle = [styles.boldText, { color: isDark ? '#fff' : '#111827' }];
        const italicStyle = [styles.italicText, { color: isDark ? '#9ca3af' : '#64748b' }];

        switch (item.type) {
            case 'FRIEND_REQUEST':
                return (
                    <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#e2e8f0' : '#4b5563' }]}>
                        <Text style={nameStyle}>{data?.senderName || 'Ai đó'}</Text> đã gửi lời mời kết bạn.
                    </Text>
                );
            case 'FRIEND_ACCEPTED':
                return (
                    <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#e2e8f0' : '#4b5563' }]}>
                        <Text style={nameStyle}>{data?.accepterName || 'Ai đó'}</Text> đã chấp nhận lời mời.
                    </Text>
                );
            case 'NEW_REACTION':
                const emoji = REACTION_MAP[data?.reactionType] || '❤️';
                return (
                    <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#e2e8f0' : '#4b5563' }]}>
                        <Text style={nameStyle}>{data?.reactorName || 'Ai đó'}</Text> đã thả {emoji} vào bài đăng của bạn.
                    </Text>
                );
            case 'NEW_COMMENT':
                return (
                    <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#e2e8f0' : '#4b5563' }]}>
                        <Text style={nameStyle}>{data?.commenterName || 'Ai đó'}</Text> đã bình luận: <Text style={italicStyle}>"{data?.snippet || '...'}"</Text>
                    </Text>
                );
            case 'COMMENT_REPLY':
                return (
                    <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#e2e8f0' : '#4b5563' }]}>
                        <Text style={nameStyle}>{data?.replierName || 'Ai đó'}</Text> đã phản hồi: <Text style={italicStyle}>"{data?.snippet || '...'}"</Text>
                    </Text>
                );
            case 'FRIEND_VOICEPIN':
                return (
                    <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#e2e8f0' : '#4b5563' }]}>
                        <Text style={nameStyle}>{data?.posterName || 'Bạn bè'}</Text> vừa đăng: <Text style={italicStyle}>"{data?.voicePinContent || '...'}"</Text>
                    </Text>
                );
            case 'NEW_MESSAGE':
                return (
                    <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#e2e8f0' : '#4b5563' }]}>
                        <Text style={nameStyle}>{data?.senderName || 'Ai đó'}</Text>: <Text style={italicStyle}>"{data?.content || data?.snippet || 'đã gửi một tin nhắn'}"</Text>
                    </Text>
                );
            case 'SYSTEM_MESSAGE':
                return (
                    <View style={styles.systemMessageContainer}>
                        <Ionicons name="shield-checkmark" size={14} color={isDark ? '#fbbf24' : '#d97706'} style={{ marginRight: 6 }} />
                        <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#fbbf24' : '#d97706', fontWeight: '600' }]}>
                            {data?.message || 'Thông báo từ hệ thống.'}
                        </Text>
                    </View>
                );
            default:
                return <Text style={styles.messageText}>Bạn có thông báo mới.</Text>;
        }
    };

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, translateX: -width }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.itemWrapper}
        >
            <Swipeable
                renderRightActions={renderRightActions}
                friction={2}
                rightThreshold={40}
                onSwipeableOpen={() => onDelete(item.id)}
            >
                <TouchableOpacity
                    onPress={() => { onRead(item.id); onNavigate(item); }}
                    activeOpacity={0.9}
                    style={[
                        styles.itemContainer,
                        {
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)'
                        }
                    ]}
                >
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

                        <View>
                            {getMessage()}
                        </View>

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
            </Swipeable>
        </MotiView>
    );
}

// ─── Main Screen ──────────────────────────────────────────
export default function NotificationScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const themeContext = theme[colorScheme];
    const router = useRouter();
    const { from } = useLocalSearchParams<{ from?: string }>();

    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const res = await api.get(endpoints.notifications);
            const data = res.data?.notifications || res.data?.data || [];
            setNotifs(data);
        } catch (e) {
            console.error('Load notifications error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleNavigate = (item: Notification) => {
        const { data } = item;
        setShowDetail(false);

        switch (item.type) {
            case 'NEW_REACTION':
            case 'NEW_COMMENT':
            case 'COMMENT_REPLY':
            case 'FRIEND_VOICEPIN':
                if (data?.voicePinId) {
                    router.push({ pathname: '/voiceDetail', params: { id: String(data.voicePinId) } });
                }
                break;
            case 'FRIEND_REQUEST':
                if (data?.senderId) {
                    router.push({ pathname: '/user/[id]', params: { id: String(data.senderId) } });
                }
                break;
            case 'FRIEND_ACCEPTED':
                if (data?.accepterId) {
                    router.push({ pathname: '/user/[id]', params: { id: String(data.accepterId) } });
                }
                break;
            case 'NEW_MESSAGE':
                if (data?.roomId) {
                    router.push({ pathname: `/chat/${data.roomId}` });
                }
                break;
            default:
                break;
        }
    };

    const handlePressNotif = (item: Notification) => {
        handleRead(item.id);
        setSelectedNotif(item);
        setShowDetail(true);
    };

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
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) await authApis(token).put(endpoints.notificationRead(id));
        } catch { /* Silent */ }
    };

    const handleAction = async (id: number, action: string, data: any) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);

            if (action === 'ACCEPT_FRIEND' || action === 'REJECT_FRIEND') {
                const friendAction = action === 'ACCEPT_FRIEND' ? 'accept' : 'reject';
                await api.post(endpoints.friendRespond(data.friendshipId), { action: friendAction });
                handleRead(id);
                load(true);
            }
        } catch (e: any) {
            alert(e.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const markAllRead = async () => {
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) await authApis(token).put(endpoints.notificationsReadAll);
        } catch { /* Silent */ }
    };

    const clearAll = () => {
        Alert.alert(
            'Xóa tất cả',
            'Bạn có chắc chắn muốn xóa tất cả thông báo không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa tất cả',
                    style: 'destructive',
                    onPress: () => setNotifs([])
                }
            ]
        );
    };

    const handleDelete = (id: number) => {
        setNotifs(prev => prev.filter(n => n.id !== id));
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor: themeContext.colors.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

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
                    <BlurView
                        intensity={isDark ? 100 : 60}
                        tint={isDark ? "dark" : "light"}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            onPress={() => {
                                if (from === 'home') {
                                    router.replace('/(tabs)/home');
                                } else if (from === 'profile') {
                                    router.replace('/(tabs)/profile');
                                } else if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace('/(tabs)/home');
                                }
                            }}
                            style={[styles.headerIconBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={20} color={themeContext.colors.primary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>Thông báo</Text>
                            <Text style={styles.subtitle}>Xem các hoạt động mới nhất</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={markAllRead}
                            style={[styles.headerIconBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        >
                            <Ionicons name="checkmark-done" size={20} color={themeContext.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.tabContainer}>
                    <FilterTab label="Tất cả" active={activeTab === 'all'} onPress={() => setActiveTab('all')} isDark={isDark} theme={themeContext} />
                    <FilterTab label="Lời mời" active={activeTab === 'requests'} onPress={() => setActiveTab('requests')} isDark={isDark} theme={themeContext} />
                    <FilterTab label="Tương tác" active={activeTab === 'interactions'} onPress={() => setActiveTab('interactions')} isDark={isDark} theme={themeContext} />
                </View>

                {loading && !refreshing ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={themeContext.colors.primary} size="large" />
                        <Text style={{ marginTop: 15, color: '#9ca3af', fontWeight: '600' }}>Đang tải thông báo...</Text>
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
                                onNavigate={handlePressNotif}
                                onDelete={handleDelete}
                                isDark={isDark}
                                theme={themeContext}
                            />
                        )}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionHeaderLeft}>
                                    <View style={[styles.sectionDash, { backgroundColor: themeContext.colors.primary }]} />
                                    <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }]}>
                                        {title}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={clearAll}
                                    style={styles.sectionClearBtn}
                                    activeOpacity={0.6}
                                >
                                    <Ionicons name="close-outline" size={20} color={isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af'} />
                                </TouchableOpacity>
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
                                <Text style={styles.emptyText}>Hiện tại chưa có thông báo mới.</Text>
                            </View>
                        }
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    />
                )}

                <Modal
                    visible={showDetail}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDetail(false)}
                >
                    <View style={styles.modalOverlay}>
                        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowDetail(false)} />

                        <AnimatePresence>
                            {showDetail && selectedNotif && (
                                <MotiView
                                    from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, translateY: 20 }}
                                    style={[styles.modalContent, { backgroundColor: isDark ? '#1e1e2e' : '#fff' }]}
                                >
                                    <View style={styles.modalHeader}>
                                        <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#111827' }]}>Chi tiết thông báo</Text>
                                        <TouchableOpacity onPress={() => setShowDetail(false)}>
                                            <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.modalBody}>
                                        <View style={styles.modalIconBox}>
                                            <LinearGradient
                                                colors={(NOTIF_CONFIG[selectedNotif.type] || DEFAULT_CONFIG).colors as any}
                                                style={styles.modalIconGradient}
                                            >
                                                <Ionicons name={(NOTIF_CONFIG[selectedNotif.type] || DEFAULT_CONFIG).icon} size={32} color="#fff" />
                                            </LinearGradient>
                                        </View>

                                        <Text style={[styles.modalTime, { color: '#9ca3af' }]}>
                                            {new Date(selectedNotif.createdAt).toLocaleString('vi-VN')}
                                        </Text>

                                        <Text style={[styles.modalMessage, { color: isDark ? '#e2e8f0' : '#334155' }]}>
                                            {selectedNotif.type === 'SYSTEM_MESSAGE'
                                                ? selectedNotif.data?.message
                                                : selectedNotif.type === 'NEW_COMMENT' || selectedNotif.type === 'COMMENT_REPLY'
                                                    ? `${(selectedNotif.data?.commenterName || selectedNotif.data?.replierName)} đã để lại nội dung: "${selectedNotif.data?.snippet}"`
                                                    : selectedNotif.type === 'NEW_REACTION'
                                                        ? `${selectedNotif.data?.reactorName} đã thả cảm xúc vào bài đăng của bạn.`
                                                        : selectedNotif.type === 'FRIEND_VOICEPIN'
                                                            ? `${selectedNotif.data?.posterName} vừa đăng nội dung mới: "${selectedNotif.data?.voicePinContent}"`
                                                            : selectedNotif.type === 'NEW_MESSAGE'
                                                                ? `${selectedNotif.data?.senderName} đã nhắn cho bạn: "${selectedNotif.data?.content || selectedNotif.data?.snippet}"`
                                                                : 'Bạn có một tương tác mới trên hệ thống.'
                                            }
                                        </Text>

                                        {selectedNotif.type !== 'SYSTEM_MESSAGE' && (
                                            <Text style={[styles.modalHint, { color: '#9ca3af' }]}>
                                                Nhấn nút bên dưới để xem chi tiết đối tượng liên quan.
                                            </Text>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.modalActionBtn, { backgroundColor: themeContext.colors.primary }]}
                                        onPress={() => handleNavigate(selectedNotif)}
                                    >
                                        <Text style={styles.modalActionBtnText}>
                                            {selectedNotif.type === 'FRIEND_REQUEST' ? 'Xem trang cá nhân' : 'Xem chi tiết bài viết'}
                                        </Text>
                                    </TouchableOpacity>
                                </MotiView>
                            )}
                        </AnimatePresence>
                    </View>
                </Modal>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    auraCircle: {
        position: 'absolute',
        width: width,
        height: width,
        borderRadius: width / 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 70,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
        justifyContent: 'space-between',
        marginTop: 25,
        marginBottom: 15,
        paddingRight: 4,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionClearBtn: {
        padding: 4,
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
        borderRadius: 15,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
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
    italicText: { fontStyle: 'italic' },
    systemMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        padding: 8,
        borderRadius: 12,
        marginTop: 4,
    },
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    modalBody: {
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
    },
    modalIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalIconGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTime: {
        fontSize: 12,
        fontWeight: '600',
    },
    modalMessage: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        fontWeight: '500',
    },
    modalHint: {
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    modalActionBtn: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalActionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteAction: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 28,
        marginLeft: 10,
    },
});
