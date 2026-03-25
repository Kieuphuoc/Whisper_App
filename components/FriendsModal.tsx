/**
 * FriendsModal — redesigned with a modern glassmorphism aesthetic.
 * Uses BlurView for depth and Moti for subtle animations.
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useContext } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    useColorScheme,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { authApis, endpoints } from '@/configs/Apis';
import { MyUserContext } from '@/configs/Context';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';
import theme from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────
interface FriendUser {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
}
interface PendingRequest {
    id: number;
    status: 'PENDING';
    sender?: FriendUser;
    receiver?: FriendUser;
    createdAt: string;
    _dir?: 'received' | 'sent';
}

// ─── Avatar Component ──────────────────────────────────────
function Avatar({ user, size = 48 }: { user: FriendUser; size?: number }) {
    const initials = (user.displayName ?? user.username).slice(0, 2).toUpperCase();
    return (
        <View style={[avStyle.avatarContainer, { width: size, height: size }]}>
            {user.avatar ? (
                <Image 
                    source={{ uri: user.avatar }} 
                    style={{ width: size, height: size, borderRadius: size / 2.2 }}
                    transition={500}
                />
            ) : (
                <LinearGradient
                    colors={['#8b5cf6', '#6366f1']}
                    style={[avStyle.circle, { width: size, height: size, borderRadius: size / 2.2 }]}
                >
                    <Text style={[avStyle.init, { fontSize: size * 0.35 }]}>{initials}</Text>
                </LinearGradient>
            )}
        </View>
    );
}

const avStyle = StyleSheet.create({
    avatarContainer: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    circle: { justifyContent: 'center', alignItems: 'center' },
    init: { color: '#fff', fontWeight: '800' },
});

// ─── Main Modal ───────────────────────────────────────────
type Tab = 'friends' | 'requests';

interface Props { visible: boolean; onClose: () => void; }

export default function FriendsModal({ visible, onClose }: Props) {
    const user = useContext(MyUserContext);
    const router = useRouter();
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme as 'light' | 'dark'];

    const [tab, setTab] = useState<Tab>('friends');
    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);

    const navigateToProfile = (userId: number) => {
        onClose();
        router.push(`/user/${userId}`);
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
            setFriends(Array.isArray(fData) ? fData : []);

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
    }, [user]);

    useEffect(() => { if (visible) load(); }, [visible, load]);

    const respondRequest = async (reqId: number, action: 'ACCEPTED' | 'REJECTED') => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            await authApis(token).post(endpoints.friendRespond(reqId), { action });
            load();
        } catch {
            Alert.alert('Lỗi', 'Không thể phản hồi lời mời. Thử lại sau.');
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
                        await authApis(token).delete(endpoints.friendRemove, { data: { friendId } });
                        setFriends(prev => prev.filter(f => f.id !== friendId));
                    } catch {
                        Alert.alert('Lỗi', 'Không thể xoá bạn bè.');
                    }
                }
            }
        ]);
    };

    const safeP = Array.isArray(pending) ? pending : [];
    const received = safeP.filter((r: any) => r._dir === 'received' || (r.sender?.id !== user?.id && r.status === 'PENDING'));
    const sent = safeP.filter((r: any) => r._dir === 'sent' || (r.sender?.id === user?.id && r.status === 'PENDING'));

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <View style={[styles.modalContainer, { backgroundColor: currentTheme.colors.background }]}>
                {/* Content Container */}
                <View style={styles.content}>
                    {/* Header */}
                    <SettingTabHeader
                        title="Vòng kết nối"
                        onLeftPress={onClose}
                        leftIcon="chevron-down"
                    />

                    {/* Animated Tab Bar */}
                    <View style={styles.modernTabBar}>
                        <TouchableOpacity 
                            style={styles.tabItem} 
                            onPress={() => setTab('friends')}
                            activeOpacity={0.7}
                        >
                            <MotiView
                                animate={{
                                    backgroundColor: tab === 'friends' ? '#fff' : 'transparent',
                                    scale: tab === 'friends' ? 1 : 0.95,
                                }}
                                style={styles.tabBg}
                            />
                            <Text style={[styles.tabLabel, tab === 'friends' && styles.activeTabLabel]}>
                                Bạn bè ({friends.length})
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.tabItem} 
                            onPress={() => setTab('requests')}
                            activeOpacity={0.7}
                        >
                            <MotiView
                                animate={{
                                    backgroundColor: tab === 'requests' ? '#fff' : 'transparent',
                                    scale: tab === 'requests' ? 1 : 0.95,
                                }}
                                style={styles.tabBg}
                            />
                            <View style={styles.tabLabelContainer}>
                                <Text style={[styles.tabLabel, tab === 'requests' && styles.activeTabLabel]}>
                                    Lời mời
                                </Text>
                                {received.length > 0 && (
                                    <View style={styles.miniBadge} />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    <AnimatePresence exitBeforeEnter>
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
                                    data={friends}
                                    keyExtractor={f => String(f.id)}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
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
                                                <Avatar user={item} />
                                                <View style={styles.cardInfo}>
                                                    <Text style={styles.cardName}>{item.displayName ?? item.username}</Text>
                                                    <Text style={styles.cardSub}>@{item.username}</Text>
                                                </View>
                                                <TouchableOpacity 
                                                    style={styles.actionBtn}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        removeFriend(item.id);
                                                    }}
                                                >
                                                    <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
                                                </TouchableOpacity>
                                            </TouchableOpacity>
                                        </MotiView>
                                    )}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <View style={styles.emptyIconBlur}>
                                                <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                                            </View>
                                            <Text style={styles.emptyText}>Chưa có ai trong vòng kết nối</Text>
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
                                        ...received.map(r => ({ ...r, direction: 'received' as const })),
                                        ...sent.map(r => ({ ...r, direction: 'sent' as const })),
                                    ]}
                                    keyExtractor={r => `${r.direction}-${r.id}`}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                    renderItem={({ item, index }) => {
                                        const who = item.direction === 'received' ? item.sender! : item.receiver!;
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
                                                    <Avatar user={who} />
                                                    <View style={styles.cardInfo}>
                                                        <Text style={styles.cardName}>{who.displayName ?? who.username}</Text>
                                                        <Text style={styles.cardSub}>
                                                            {item.direction === 'received' ? 'Gửi lời mời kết bạn' : 'Đã gửi lời mời'}
                                                        </Text>
                                                    </View>
                                                    
                                                    {item.direction === 'received' ? (
                                                        <View style={styles.reqRowActions}>
                                                            <TouchableOpacity 
                                                                style={[styles.smallActionBtn, styles.acceptBtn]}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    respondRequest(item.id, 'ACCEPTED');
                                                                }}
                                                            >
                                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity 
                                                                style={[styles.smallActionBtn, styles.rejectBtn]}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    respondRequest(item.id, 'REJECTED');
                                                                }}
                                                            >
                                                                <Ionicons name="close" size={18} color="#64748b" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.pendingBadge}>
                                                            <Text style={styles.pendingBadgeText}>Chờ</Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            </MotiView>
                                        );
                                    }}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <View style={styles.emptyIconBlur}>
                                                <Ionicons name="mail-outline" size={48} color="#cbd5e1" />
                                            </View>
                                            <Text style={styles.emptyText}>Hộp thư đang trống</Text>
                                        </View>
                                    }
                                />
                            </MotiView>
                        )}
                    </AnimatePresence>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fafafa', // Adjusted for fall-back
    },
    content: {
        flex: 1,
        paddingTop: 0, // Since SettingTabHeader handles its own top padding
    },
    modernTabBar: {
        flexDirection: 'row',
        marginHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: 24,
        padding: 6,
        marginBottom: 16,
    },
    tabItem: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    tabBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    activeTabLabel: {
        color: '#8b5cf6',
    },
    tabLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    miniBadge: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ef4444',
    },

    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        gap: 12,
    },
    friendCardWrap: {
        marginBottom: 12,
    },
    glassCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // more solid
        borderColor: '#f1f5f9',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardInfo: {
        flex: 1,
        marginLeft: 16,
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
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
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
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIconBlur: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#f1f5f9',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
        textAlign: 'center',
    },
});
