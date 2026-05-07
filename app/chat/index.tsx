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
import { authApis, endpoints, BASE_URL } from '@/configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/Theme';
import { PageHeader } from '@/components/ui/PageHeader';

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
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRooms = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const [roomsRes, friendsRes] = await Promise.all([
                api.get(endpoints.chatRooms),
                api.get(endpoints.friendList(user?.id))
            ]);

            // Deduplicate rooms: Only show one conversation per user (the most recent one)
            const rawRooms = roomsRes.data.data || [];
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
            setFriends(friendsRes.data?.data || friendsRes.data || []);
        } catch (error: any) {
            console.error('Error fetching chat rooms:', error.message || error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    const { useFocusEffect } = require('expo-router');
    useFocusEffect(
        useCallback(() => {
            fetchRooms();
        }, [fetchRooms])
    );

    const renderRoomItem = ({ item, index }: { item: any; index: number }) => {
        const otherMember = item.members.find((m: any) => m.userId !== user?.id)?.user;
        const lastMessage = item.lastMessage;
        const isUnread = item.unreadCount > 0;
        const nameStyle = [styles.boldText, { color: isDark ? '#fff' : '#111827' }];

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
                                : 'rgba(255, 255, 255, 0.7)',
                        },
                    ]}
                    onPress={() => router.push({
                        pathname: '/chat/[id]',
                        params: { id: String(item.id) }
                    })}
                    activeOpacity={0.9}
                >
                    {/* Left Column - Avatar & Status */}
                    <View style={styles.leftCol}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={otherMember?.avatar
                                    ? { uri: otherMember.avatar.startsWith('http') ? otherMember.avatar : `${BASE_URL}${otherMember.avatar.startsWith('/') ? '' : '/'}${otherMember.avatar}` }
                                    : require('@/assets/images/avatar.png')
                                }
                                style={styles.avatar}
                            />
                            {/* Top right dot - Purple/Pink for unread (matches Notif page) */}
                            {isUnread && (
                                <View style={[styles.unreadDot, { backgroundColor: '#c084fc' }]} />
                            )}
                            {/* Bottom right dot - Green for chat type */}
                            <View style={[styles.miniTypeIcon, { backgroundColor: '#10b981' }]}>
                                <Ionicons name="chatbubbles" size={10} color="#fff" />
                            </View>
                        </View>
                    </View>

                    {/* Right Column - Info */}
                    <View style={styles.rightCol}>
                        <View style={styles.nameRow}>
                            <Text
                                style={[
                                    styles.roomName,
                                    { color: isDark ? '#fff' : '#111827' },
                                    isUnread && styles.boldText
                                ]}
                                numberOfLines={1}
                            >
                                {otherMember?.displayName || otherMember?.username || 'Người dùng'}
                            </Text>
                            <Text style={styles.timeText}>{timeAgo(item.updatedAt)}</Text>
                        </View>
                        <Text
                            style={[
                                styles.lastMessage,
                                {
                                    color: isDark
                                        ? isUnread ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)'
                                        : isUnread ? '#4b5563' : 'rgba(17,24,39,0.45)',
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
            <PageHeader
                title="Tin nhắn"
                subtitle="Lịch sử trò chuyện"
                rightIcon="create-outline"
                onRightPress={() => router.push('/friends?mode=select')}
            />

            {/* ONLINE FRIENDS SECTION */}
            {!loading && friends.length > 0 && (
                <MotiView
                    from={{ opacity: 0, translateY: -10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 100 }}
                    style={styles.onlineSection}
                >
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionDash, { backgroundColor: currentTheme.colors.primary }]} />
                        <Text style={styles.sectionTitle}>Đang hoạt động</Text>
                        <View style={styles.activeCountBadge}>
                            <Text style={styles.activeCountText}>{friends.length}</Text>
                        </View>
                    </View>
                    <FlatList
                        horizontal
                        data={friends}
                        keyExtractor={(f) => `online-${f.id}`}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.onlineListContent}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={styles.onlineItem}
                                onPress={() => router.push({
                                    pathname: '/user/[id]',
                                    params: { id: String(item.id) }
                                })}
                            >
                                <View style={styles.onlineAvatarWrapper}>
                                    <Image
                                        source={item.avatar
                                            ? { uri: item.avatar.startsWith('http') ? item.avatar : `${BASE_URL}${item.avatar.startsWith('/') ? '' : '/'}${item.avatar}` }
                                            : require('@/assets/images/avatar.png')
                                        }
                                        style={styles.onlineAvatar}
                                    />
                                    <View style={styles.onlineIndicator} />
                                </View>
                                <Text style={styles.onlineName} numberOfLines={1}>
                                    {(item.displayName || item.username).split(' ')[0]}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </MotiView>
            )}

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
        backgroundColor: 'rgba(0,0,0,0.05)',
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
    rightCol: { flex: 1, gap: 2, justifyContent: 'center' },
    nameRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 2,
    },
    timeText: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
    roomName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.2,
        marginRight: 10,
    },
    boldText: { fontWeight: '800' },
    lastMessage: {
        fontSize: 13,
        fontWeight: '500',
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
    // ── Online Section ──────────────────────────────────────
    onlineSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 15,
        marginTop: 10,
        gap: 10,
    },
    sectionDash: {
        width: 3,
        height: 14,
        borderRadius: 2,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#9ca3af',
    },
    activeCountBadge: {
        backgroundColor: '#10b98120',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeCountText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10b981',
    },
    onlineListContent: {
        paddingHorizontal: 20,
        gap: 15,
    },
    onlineItem: {
        alignItems: 'center',
        width: 70,
    },
    onlineAvatarWrapper: {
        position: 'relative',
        marginBottom: 8,
        width: 58,
        height: 58,
    },
    onlineAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#fff',
    },
    onlineName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
        textAlign: 'center',
    },
});
