/**
 * FriendsScreen — redesigned with a modern glassmorphism aesthetic.
 * Now a standalone page for better routing and performance.
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState, useContext, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    Dimensions,
    useColorScheme,
    TextInput,
    RefreshControl,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { BlurView } from 'expo-blur';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { PageHeader } from '@/components/ui/PageHeader';
import { authApis, endpoints } from '@/configs/Apis';
import { MyUserContext } from '@/configs/Context';
import { theme } from '@/constants/Theme';
import { Avatar as GlobalAvatar } from '@/components/ui/Avatar';

const { width, height } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────
interface FriendUser {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
    level?: number;
}
interface PendingRequest {
    id: number;
    status: 'PENDING';
    sender?: FriendUser;
    receiver?: FriendUser;
    createdAt: string;
    _dir?: 'received' | 'sent';
}


// ─── Main Screen ───────────────────────────────────────────
type Tab = 'friends' | 'requests';

// ─── Tabs Component ──────────────────────────────────────
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

export default function FriendsScreen() {
    const { mode } = useLocalSearchParams<{ mode?: string }>();
    const isSelectMode = mode === 'select';
    const user = useContext(MyUserContext);
    const router = useRouter();
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme as 'light' | 'dark'];
    const isDark = colorScheme === 'dark';

    const [tab, setTab] = useState<Tab>('friends');
    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);

    const navigateToProfile = (userId: number) => {
        router.push(`/user/${userId}`);
    };

    const handleClose = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/home');
        }
    };



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
            const fList = Array.isArray(fData) ? fData : [];
            setFriends(fList);

            const pData = pRes.data?.data ?? pRes.data ?? [];
            if (Array.isArray(pData)) {
                setPending(pData);
            } else if (pData && typeof pData === 'object') {
                const received: PendingRequest[] = (pData.received ?? []).map((r: any) => ({ ...r, _dir: 'received' }));
                const sent: PendingRequest[] = (pData.sent ?? []).map((r: any) => ({ ...r, _dir: 'sent' }));
                setPending([...received, ...sent]);
            } else {
                setPending([]);
            }
        } catch (e) {
            console.error('FriendsModal load error:', e);
        } finally {
            setLoading(false);
        }
    }, [user, user?.id]);

    useEffect(() => {
        load();
    }, [load]);




    const sendRequest = async (targetUserId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await authApis(token).post(endpoints.friendRequest, { receiverId: targetUserId });
            const newRequest = res.data?.data || res.data;
            if (newRequest) {
                setPending(prev => [...prev, newRequest]);
            }
            Alert.alert('Thành công', 'Đã gửi lời mời kết bạn.');
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi lời mời.');
        }
    };

    const respondRequest = async (reqId: number, action: 'accept' | 'reject') => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await authApis(token).post(endpoints.friendRespond(reqId), { action });
            const updated = res.data?.data || res.data;

            setPending(prev => prev.filter(p => p.id !== reqId));
            if (action === 'accept' && updated) {
                // If accepted, move to friends list
                const newFriend = updated.senderId === user?.id ? updated.receiver : updated.sender;
                if (newFriend) setFriends(prev => [...prev, newFriend]);
            }
        } catch {
            Alert.alert('Lỗi', 'Không thể phản hồi lời mời. Thử lại sau.');
        }
    };

    const cancelRequest = async (reqId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            await authApis(token).delete(endpoints.friendCancel(reqId));
            setPending(prev => prev.filter(p => p.id !== reqId));
        } catch {
            Alert.alert('Lỗi', 'Không thể thu hồi lời mời.');
        }
    };

    const handleStartChat = async (targetId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await authApis(token).post(endpoints.chatPrivate(targetId));
            const roomId = res.data?.data?.id || res.data?.id;
            if (roomId) {
                router.push({
                    pathname: '/chat/[id]',
                    params: { id: String(roomId) }
                });
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Lỗi', 'Không thể bắt đầu cuộc trò chuyện.');
        }
    };

    const removeFriend = (friendId: number) => {
        Alert.alert('Xoá bạn bè', 'Người này sẽ không còn thấy các hoạt động riêng tư của bạn. Bạn chắc chứ?', [
            { text: 'Huỷ', style: 'cancel' },
            {
                text: 'Xoá', style: 'destructive', onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        if (!token) return;
                        await authApis(token).delete(endpoints.friendRemove, { data: { otherUserId: friendId } });
                        setFriends(prev => prev.filter(f => f.id !== friendId));
                    } catch {
                        Alert.alert('Lỗi', 'Không thể xoá bạn bè.');
                    }
                }
            }
        ]);
    };

    // ─── Derived Data ───────────────────────────────────────
    const { received, sent, safeFriends } = useMemo(() => {
        const safeP = Array.isArray(pending) ? pending : [];
        const f = Array.isArray(friends) ? friends : [];

        // Robust filtering even if _dir is missing
        const r = safeP.filter((req: any) => {
            if (req._dir === 'received') return true;
            if (req._dir === 'sent') return false;
            // Fallback: check senderId with Number() cast for safety
            const sId = Number(req.senderId || req.sender?.id);
            const myId = Number(user?.id);
            return sId !== myId;
        });

        const s = safeP.filter((req: any) => {
            if (req._dir === 'sent') return true;
            if (req._dir === 'received') return false;
            // Fallback: check senderId with Number() cast for safety
            const sId = Number(req.senderId || req.sender?.id);
            const myId = Number(user?.id);
            return sId === myId;
        });

        return {
            received: r,
            sent: s,
            safeFriends: f
        };
    }, [pending, friends, user?.id]);

    // Extra safety: refresh data if tab is switched to 'requests' and it's empty
    useEffect(() => {
        if (tab === 'requests' && received.length === 0 && sent.length === 0 && !loading) {
            // Only refresh if we haven't just refreshed (simple debounce/throttle)
            load();
        }
    }, [tab]);

    const isPending = (targetId: number) => {
        return (Array.isArray(pending) ? pending : []).some(p => p.sender?.id === targetId || p.receiver?.id === targetId || p.senderId === targetId || p.receiverId === targetId);
    };

    const isFriend = (targetId: number) => {
        return safeFriends.some(f => f.id === targetId);
    };

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

                {/* AURA BACKGROUND - matches Chat/Notification page */}
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

                {/* Content Container */}
                <View style={styles.content}>
                    {/* HEADER - using PageHeader for sync */}
                    <PageHeader 
                        title="Bạn bè"
                        subtitle="Gợi ý & kết nối"
                        backIcon="chevron-back"
                        onBack={handleClose}
                    />

                    {/* TABS - exactly matching Notification page */}
                    <View style={styles.tabContainer}>
                        <FilterTab label="Tất cả" active={tab === 'friends'} onPress={() => setTab('friends')} isDark={isDark} theme={currentTheme} />
                        <FilterTab label="Lời mời" active={tab === 'requests'} onPress={() => setTab('requests')} isDark={isDark} theme={currentTheme} />
                    </View>


                    <AnimatePresence>
                        {loading ? (
                            <MotiView
                                key="loading"
                                from={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={styles.centered}
                            >
                                <ActivityIndicator color="#8b5cf6" size="large" />
                            </MotiView>
                        ) : tab === 'friends' ? (
                            <MotiView
                                key="friends-list"
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                style={{ flex: 1 }}
                            >
                                <FlatList
                                    data={safeFriends}
                                    keyExtractor={f => String(f.id)}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                    refreshControl={
                                        <RefreshControl
                                            refreshing={loading}
                                            onRefresh={load}
                                            tintColor="#8b5cf6"
                                            colors={['#8b5cf6']}
                                        />
                                    }
                                    renderItem={({ item, index }) => (
                                        <MotiView
                                            from={{ opacity: 0, scale: 0.9, translateX: -20 }}
                                            animate={{ opacity: 1, scale: 1, translateX: 0 }}
                                            transition={{ delay: index * 50, type: 'timing' }}
                                            style={styles.friendCardWrap}
                                        >
                                            <TouchableOpacity
                                                style={styles.glassCard}
                                                onPress={() => navigateToProfile(item.id)}
                                                activeOpacity={0.9}
                                            >
                                                <GlobalAvatar uri={item.avatar} size={48} />
                                                <View style={styles.cardInfo}>
                                                    <Text style={styles.cardName}>{item.displayName ?? item.username}</Text>
                                                    <Text style={styles.cardSub}>@{item.username}</Text>
                                                </View>
                                                {isSelectMode ? (
                                                    <TouchableOpacity
                                                        style={[styles.smallActionBtn, { backgroundColor: currentTheme.colors.primary }]}
                                                        onPress={async (e) => {
                                                            e.stopPropagation();
                                                            handleStartChat(item.id);
                                                        }}
                                                    >
                                                        <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                                                    </TouchableOpacity>
                                                ) : (
                                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                                        <TouchableOpacity
                                                            style={[styles.smallActionBtn, { backgroundColor: currentTheme.colors.primary + '20' }]}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                handleStartChat(item.id);
                                                            }}
                                                        >
                                                            <Ionicons name="chatbubble-ellipses" size={18} color={currentTheme.colors.primary} />
                                                        </TouchableOpacity>
                                                        
                                                        <TouchableOpacity
                                                            style={styles.actionBtn}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                removeFriend(item.id);
                                                            }}
                                                        >
                                                            <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        </MotiView>
                                    )}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>Bạn chưa có ai trong danh sách</Text>
                                        </View>
                                    }
                                />
                            </MotiView>
                        ) : (
                            <MotiView
                                key="requests-list"
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                style={{ flex: 1 }}
                            >
                                <FlatList
                                    data={[
                                        ...(received.length > 0 ? [{ isHeader: true, title: 'Lời mời đã nhận', count: received.length }] : []),
                                        ...received.map(r => ({ ...r, direction: 'received' as const })),
                                        ...(sent.length > 0 ? [{ isHeader: true, title: 'Yêu cầu đã gửi', count: sent.length }] : []),
                                        ...sent.map(r => ({ ...r, direction: 'sent' as const })),
                                    ]}
                                    keyExtractor={r => r.isHeader ? `header-${r.title}` : `${r.direction || 'req'}-${r.id}`}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                    refreshControl={
                                        <RefreshControl
                                            refreshing={loading}
                                            onRefresh={load}
                                            tintColor="#8b5cf6"
                                            colors={['#8b5cf6']}
                                        />
                                    }
                                    renderItem={({ item, index }) => {
                                        if (item.isHeader) {
                                            return (
                                                <MotiView
                                                    from={{ opacity: 0, translateX: -10 }}
                                                    animate={{ opacity: 1, translateX: 0 }}
                                                    style={styles.sectionHeaderContainer}
                                                >
                                                    <Text style={styles.sectionHeaderTitle}>{item.title}</Text>
                                                    <View style={styles.sectionHeaderBadge}>
                                                        <Text style={styles.sectionHeaderBadgeText}>{item.count}</Text>
                                                    </View>
                                                </MotiView>
                                            );
                                        }

                                        const direction = item.direction || (item.senderId === user?.id ? 'sent' : 'received');
                                        const who = direction === 'received' ? item.sender : item.receiver;
                                        if (!who) return null;
                                        return (
                                            <MotiView
                                                from={{ opacity: 0, scale: 0.9, translateX: 20 }}
                                                animate={{ opacity: 1, scale: 1, translateX: 0 }}
                                                transition={{ delay: index * 50, type: 'timing' }}
                                                style={styles.friendCardWrap}
                                            >
                                                <TouchableOpacity
                                                    style={styles.glassCard}
                                                    onPress={() => navigateToProfile(who.id)}
                                                    activeOpacity={0.9}
                                                >
                                                    <GlobalAvatar uri={who.avatar} size={48} />
                                                    <View style={styles.cardInfo}>
                                                        <Text style={styles.cardName}>{who.displayName ?? who.username}</Text>
                                                        <Text style={styles.cardSub}>
                                                            {direction === 'received' ? 'Gửi lời mời kết bạn' : 'Đã gửi lời mời'}
                                                        </Text>
                                                    </View>

                                                    {direction === 'received' ? (
                                                        <View style={styles.reqRowActions}>
                                                            <TouchableOpacity
                                                                style={[styles.smallActionBtn, styles.acceptBtn]}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    respondRequest(item.id, 'accept');
                                                                }}
                                                            >
                                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.smallActionBtn, styles.rejectBtn]}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    respondRequest(item.id, 'reject');
                                                                }}
                                                            >
                                                                <Ionicons name="close" size={18} color="#64748b" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <TouchableOpacity
                                                            style={styles.pendingBadge}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                cancelRequest(item.id);
                                                            }}
                                                        >
                                                            <Text style={[styles.pendingBadgeText, { color: '#ef4444' }]}>Thu hồi</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </TouchableOpacity>
                                            </MotiView>
                                        );
                                    }}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <MotiView
                                                from={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ type: 'spring', delay: 200 }}
                                                style={styles.emptyIconBox}
                                            >
                                                <Ionicons
                                                    name="mail"
                                                    size={60}
                                                    color={isDark ? 'rgba(255,255,255,0.2)' : '#f3f4f6'}
                                                />
                                            </MotiView>
                                            <Text style={styles.emptyText}>Hộp thư đang trống</Text>
                                            <Text style={styles.emptySubText}>
                                                Bạn sẽ nhận được thông báo khi có lời mời mới.
                                            </Text>
                                        </View>
                                    }
                                />
                            </MotiView>
                        )}
                    </AnimatePresence>
                </View>
            </View>
        );
    }

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingTop: 0,
    },
    auraCircle: {
        position: 'absolute',
        width: width,
        height: width,
        borderRadius: width / 2,
    },
    // ── Header (mirrors Chat page) ──────────
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


    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 12,
    },
    friendCardWrap: {
        marginBottom: 12,
    },
    glassCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1.2,
    },
    cardInfo: {
        flex: 1,
        marginLeft: 15,
    },
    cardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    cardSub: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    actionBtn: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },

    reqRowActions: {
        flexDirection: 'row',
        gap: 10,
    },
    smallActionBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: '#8b5cf6',
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    rejectBtn: {
        backgroundColor: '#f1f5f9',
    },
    pendingBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    pendingBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
    },

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: 20,
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
        maxWidth: 200,
    },

    // Suggestion styles
    suggestionSection: {
        width: '100%',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 12,
        paddingHorizontal: 4,
        gap: 8,
    },
    sectionHeaderTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionHeaderBadge: {
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    sectionHeaderBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
    },
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    suggestionTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    suggestionCard: {
        marginBottom: 10,
    },
    suggestionInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    suggestionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    suggestionName: {
        fontSize: 14,
        fontWeight: '700',
    },
    suggestionSub: {
        fontSize: 12,
        color: '#94a3b8',
    },
    miniAddBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
