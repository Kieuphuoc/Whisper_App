import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    useColorScheme,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MyUserContext } from '@/configs/Context';
import { authApis, endpoints } from '@/configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/Theme';

const { width } = Dimensions.get('window');

function timeAgo(dateStr: string) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Vừa xong';
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}p`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}g`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}ng`;
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function ChatListScreen() {
    const user = useContext(MyUserContext);
    const router = useRouter();
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];

    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRooms = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await authApis(token).get(endpoints.chatRooms);

            // Deduplicate rooms: Only show one conversation per user (the most recent one)
            const rawRooms = res.data.data || [];
            const uniqueRoomsMap = new Map();

            rawRooms.forEach((room: any) => {
                const otherMember = room.members.find((m: any) => m.userId !== user?.id);
                if (!otherMember) return;

                const existingRoom = uniqueRoomsMap.get(otherMember.userId);
                if (!existingRoom || new Date(room.updatedAt) > new Date(existingRoom.updatedAt)) {
                    uniqueRoomsMap.set(otherMember.userId, room);
                }
            });

            // Sort by latest activity
            const sortedRooms = Array.from(uniqueRoomsMap.values()).sort(
                (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            setRooms(sortedRooms);
        } catch (error: any) {
            console.error('Error fetching chat rooms:', error.message || error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const renderRoomItem = ({ item, index }: { item: any; index: number }) => {
        const otherMember = item.members.find((m: any) => m.userId !== user?.id)?.user;
        const lastMessage = item.lastMessage;
        const isUnread = item.unreadCount > 0;

        return (
            <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                    delay: index * 60,
                    type: 'spring',
                    damping: 18,
                    stiffness: 120,
                }}
                style={styles.itemWrapper}
            >
                <TouchableOpacity
                    style={[
                        styles.itemContainer,
                        {
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.03)'
                                : 'rgba(255, 255, 255, 0.75)',
                        },
                    ]}
                    onPress={() => router.push(`/chat/${item.id}`)}
                    activeOpacity={0.88}
                >
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {otherMember?.avatar ? (
                            <Image source={{ uri: otherMember.avatar }} style={styles.avatar} />
                        ) : (
                            <LinearGradient
                                colors={['#8b5cf6', '#6d28d9']}
                                style={styles.avatarPlaceholder}
                            >
                                <Ionicons name="person" size={20} color="#fff" />
                            </LinearGradient>
                        )}
                        {(otherMember?.isOnline || otherMember?.isActive) && (
                            <View style={styles.onlineStatus} />
                        )}
                        {isUnread && (
                            <View style={[styles.unreadDot, { backgroundColor: currentTheme.colors.primary }]} />
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.rightCol}>
                        <View style={styles.itemMeta}>
                            <Text
                                style={[
                                    styles.roomName,
                                    { color: isDark ? '#fff' : '#111827' },
                                    isUnread && styles.boldText,
                                ]}
                                numberOfLines={1}
                            >
                                {otherMember?.displayName || otherMember?.username || 'Người dùng'}
                            </Text>
                            <Text style={styles.timeText}>
                                {timeAgo(item.updatedAt)}
                            </Text>
                        </View>

                        <View style={styles.lastMsgRow}>
                            <Text
                                style={[
                                    styles.lastMessage,
                                    {
                                        color: isDark
                                            ? isUnread ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)'
                                            : isUnread ? '#374151' : 'rgba(17,24,39,0.45)',
                                    },
                                    isUnread && styles.boldText,
                                ]}
                                numberOfLines={1}
                            >
                                {lastMessage
                                    ? lastMessage.type === 'VOICE'
                                        ? '🎤 Tin nhắn thoại'
                                        : lastMessage.content
                                    : 'Bắt đầu cuộc trò chuyện...'}
                            </Text>

                            {isUnread && (
                                <View style={[styles.unreadBadge, { backgroundColor: currentTheme.colors.primary }]}>
                                    <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </MotiView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* AURA BACKGROUND - matches Notification page */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={isDark ? ['#1e1b4b', '#000'] : ['#f5f3ff', '#fff']}
                    style={StyleSheet.absoluteFill}
                />
                <MotiView
                    from={{ opacity: 0.2, scale: 1 }}
                    animate={{ opacity: 0.4, scale: 1.5 }}
                    transition={{ loop: true, type: 'timing', duration: 15000, repeatReverse: true }}
                    style={[
                        styles.auraCircle,
                        { backgroundColor: isDark ? '#4338ca' : '#ddd6fe', top: -50, right: -100 },
                    ]}
                />
                <BlurView
                    intensity={isDark ? 100 : 60}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* HEADER - exactly matching Notification page */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[
                        styles.backButton,
                        {
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        },
                    ]}
                >
                    <Ionicons name="chevron-back" size={22} color={isDark ? '#fff' : '#111827'} />
                </TouchableOpacity>

                <View style={styles.headerTitleBlock}>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>Tin nhắn</Text>
                    <Text style={styles.subtitle}>Lịch sử trò chuyện</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.headerIconBtn,
                        { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                    ]}
                >
                    <Ionicons name="create-outline" size={20} color={currentTheme.colors.primary} />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator color={currentTheme.colors.primary} size="large" />
                    <Text style={{ marginTop: 15, color: '#9ca3af', fontWeight: '600' }}>
                        Đang tải tin nhắn...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    renderItem={renderRoomItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchRooms(true)}
                            tintColor={currentTheme.colors.primary}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MotiView
                                from={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', delay: 200 }}
                                style={styles.emptyIconBox}
                            >
                                <Ionicons
                                    name="chatbubbles"
                                    size={60}
                                    color={isDark ? 'rgba(255,255,255,0.5)' : '#f3f4f6'}
                                />
                            </MotiView>
                            <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào.</Text>
                            <Text style={styles.emptySubText}>
                                Kết nối với bạn bè để bắt đầu chia sẻ.
                            </Text>
                        </View>
                    }
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
    },
    // ── Header (mirrors Notification page exactly) ──────────
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 70,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerTitleBlock: {
        flex: 1,
        marginLeft: 14,
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
    // ── List ─────────────────────────────────────────────────
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
        paddingTop: 4,
    },
    // ── Room Card (mirrors NotifItem) ─────────────────────────
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
        alignItems: 'center',
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
    onlineStatus: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 2.5,
        borderColor: '#fff',
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
    rightCol: { flex: 1, gap: 4 },
    itemMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
        letterSpacing: -0.2,
    },
    boldText: { fontWeight: '800' },
    timeText: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
    lastMsgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    lastMessage: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    unreadCountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    // ── States ────────────────────────────────────────────────
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.02)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptySubText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 6,
        opacity: 0.7,
    },
});
