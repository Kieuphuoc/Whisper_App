/**
 * FriendsModal — shows list of friends and pending requests.
 * Accessible via a button in the Profile or Home screen.
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { authApis, endpoints } from '@/configs/Apis';
import { MyUserContext } from '@/configs/Context';
import { useContext } from 'react';

// ─── Types ────────────────────────────────────────────────
interface FriendUser {
    id: number;
    username: string;
    name?: string;
    avatar?: string;
}
interface PendingRequest {
    id: number;
    status: 'PENDING';
    sender?: FriendUser;
    receiver?: FriendUser;
    createdAt: string;
}

// ─── Avatar helper ─────────────────────────────────────────
function Avatar({ user, size = 44 }: { user: FriendUser; size?: number }) {
    const initials = (user.name ?? user.username).slice(0, 2).toUpperCase();
    return user.avatar ? (
        <Image source={{ uri: user.avatar }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    ) : (
        <View style={[avStyle.circle, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[avStyle.init, { fontSize: size * 0.35 }]}>{initials}</Text>
        </View>
    );
}
const avStyle = StyleSheet.create({
    circle: { backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
    init: { color: '#8b5cf6', fontWeight: '700' },
});

// ─── Main Modal ───────────────────────────────────────────
type Tab = 'friends' | 'requests';

interface Props { visible: boolean; onClose: () => void; }

export default function FriendsModal({ visible, onClose }: Props) {
    const user = useContext(MyUserContext);
    const [tab, setTab] = useState<Tab>('friends');
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

            // Friends: expect array
            const fData = fRes.data?.data ?? fRes.data ?? [];
            setFriends(Array.isArray(fData) ? fData : []);

            // Pending: BE may return flat array OR { received: [], sent: [] }
            const pData = pRes.data?.data ?? pRes.data ?? [];
            if (Array.isArray(pData)) {
                setPending(pData);
            } else if (pData && typeof pData === 'object') {
                // Merge received + sent into one flat list with direction info
                const received: PendingRequest[] = (pData.received ?? []).map((r: any) => ({ ...r, _dir: 'received' }));
                const sent: PendingRequest[] = (pData.sent ?? []).map((r: any) => ({ ...r, _dir: 'sent' }));
                setPending([...received, ...sent]);
            } else {
                setPending([]);
            }
        } catch (e) {
            console.error('FriendsModal load error:', e);
            setFriends([]);
            setPending([]);
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
            await load(); // refresh
        } catch {
            Alert.alert('Lỗi', 'Không thể phản hồi lời mời. Thử lại sau.');
        }
    };

    const removeFriend = async (friendId: number) => {
        Alert.alert('Xoá bạn bè', 'Bạn có chắc muốn xoá người này khỏi danh sách bạn bè?', [
            { text: 'Huỷ', style: 'cancel' },
            {
                text: 'Xoá', style: 'destructive', onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        if (!token) return;
                        await authApis(token).delete(endpoints.friendRemove, { data: { friendId } });
                        setFriends(prev => prev.filter(f => f.id !== friendId));
                    } catch {
                        Alert.alert('Lỗi', 'Không thể xoá bạn bè. Thử lại sau.');
                    }
                }
            }
        ]);
    };

    // Pending received (not the ones I sent)
    const safeP = Array.isArray(pending) ? pending : [];
    const received = safeP.filter((r: any) => r._dir === 'received' || r.sender?.id !== user?.id);
    const sent = safeP.filter((r: any) => r._dir === 'sent' || r.sender?.id === user?.id);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Bạn bè</Text>
                    <View style={{ width: 34 }} />
                </View>

                {/* Tab bar */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'friends' && styles.tabBtnActive]}
                        onPress={() => setTab('friends')}
                    >
                        <Ionicons name="people-outline" size={16} color={tab === 'friends' ? '#8b5cf6' : '#9ca3af'} />
                        <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
                            Bạn bè ({friends.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'requests' && styles.tabBtnActive]}
                        onPress={() => setTab('requests')}
                    >
                        <Ionicons name="person-add-outline" size={16} color={tab === 'requests' ? '#8b5cf6' : '#9ca3af'} />
                        <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
                            Lời mời {received.length > 0 ? `(${received.length})` : ''}
                        </Text>
                        {received.length > 0 && (
                            <View style={styles.badge}><Text style={styles.badgeText}>{received.length}</Text></View>
                        )}
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color="#8b5cf6" size="large" />
                    </View>
                ) : tab === 'friends' ? (
                    /* ── Friends list ── */
                    <FlatList
                        data={friends}
                        keyExtractor={f => String(f.id)}
                        contentContainerStyle={{ padding: 16 }}
                        renderItem={({ item }) => (
                            <View style={styles.row}>
                                <Avatar user={item} />
                                <View style={styles.rowInfo}>
                                    <Text style={styles.rowName}>{item.name ?? item.username}</Text>
                                    <Text style={styles.rowSub}>@{item.username}</Text>
                                </View>
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeFriend(item.id)}>
                                    <Ionicons name="person-remove-outline" size={18} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>
                        )}
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Ionicons name="people-outline" size={52} color="#e5e7eb" />
                                <Text style={styles.emptyText}>Chưa có bạn bè nào</Text>
                            </View>
                        }
                    />
                ) : (
                    /* ── Requests list ── */
                    <FlatList
                        data={[
                            ...received.map(r => ({ ...r, direction: 'received' as const })),
                            ...sent.map(r => ({ ...r, direction: 'sent' as const })),
                        ]}
                        keyExtractor={r => `${r.direction}-${r.id}`}
                        contentContainerStyle={{ padding: 16 }}
                        renderItem={({ item }) => {
                            const who = item.direction === 'received' ? item.sender! : item.receiver!;
                            return (
                                <View style={styles.row}>
                                    <Avatar user={who} />
                                    <View style={styles.rowInfo}>
                                        <Text style={styles.rowName}>{who.name ?? who.username}</Text>
                                        <Text style={styles.rowSub}>
                                            {item.direction === 'received' ? 'Gửi lời mời cho bạn' : 'Đang chờ phản hồi'}
                                        </Text>
                                    </View>
                                    {item.direction === 'received' ? (
                                        <View style={styles.reqActions}>
                                            <TouchableOpacity style={styles.acceptBtn} onPress={() => respondRequest(item.id, 'ACCEPTED')}>
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.rejectBtn} onPress={() => respondRequest(item.id, 'REJECTED')}>
                                                <Ionicons name="close" size={18} color="#6b7280" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <Text style={styles.pendingLabel}>Đang chờ</Text>
                                    )}
                                </View>
                            );
                        }}
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Ionicons name="person-add-outline" size={52} color="#e5e7eb" />
                                <Text style={styles.emptyText}>Không có lời mời nào</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fafafa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    backBtn: { padding: 6 },
    title: { fontSize: 22, fontWeight: '800', color: '#111827' },

    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        padding: 4,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
    },
    tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
    tabText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
    tabTextActive: { color: '#8b5cf6' },
    badge: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    rowSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    removeBtn: { padding: 8 },

    reqActions: { flexDirection: 'row', gap: 8 },
    acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
    rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
    pendingLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '500' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40, minHeight: 200 },
    emptyText: { color: '#9ca3af', fontSize: 15 },
});
