import { authApis, endpoints } from '@/configs/Apis';
import { User, VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    FlatList,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MemoryCard } from '../(tabs)/memory/index';

const { width, height } = Dimensions.get('window');

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked_by_you' | 'blocked' | 'rejected' | 'self';

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [profile, setProfile] = useState<User | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [friendship, setFriendship] = useState<{ status: FriendshipStatus; friendshipId: number | null }>({ status: 'none', friendshipId: null });
    const [publicPins, setPublicPins] = useState<VoicePin[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);

            const [pRes, sRes, fRes, vRes] = await Promise.all([
                api.get(endpoints.userProfile(id as string)),
                api.get(endpoints.userStats(id as string)).catch(() => ({ data: { data: {} } })),
                api.get(endpoints.friendStatus(id as string)).catch(() => ({ data: { data: { status: 'none', friendshipId: null } } })),
                api.get(endpoints.voicePublicByUser(id as string)).catch(() => ({ data: { data: [] } })),
            ]);

            setProfile(pRes.data?.data);
            setStats(sRes.data?.data);
            setFriendship(fRes.data?.data);
            setPublicPins(vRes.data?.data || []);
        } catch (e) {
            console.error('Fetch other user profile error:', e);
            Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handleFriendAction = async (action: 'request' | 'accept' | 'reject' | 'cancel' | 'remove') => {
        setActionLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);

            switch (action) {
                case 'request':
                    await api.post(endpoints.friendRequest, { receiverId: parseInt(id as string) });
                    break;
                case 'accept':
                    if (friendship.friendshipId) await api.post(endpoints.friendRespond(friendship.friendshipId), { action: 'accept' });
                    break;
                case 'reject':
                    if (friendship.friendshipId) await api.post(endpoints.friendRespond(friendship.friendshipId), { action: 'reject' });
                    break;
                case 'cancel':
                    if (friendship.friendshipId) await api.delete(endpoints.friendCancel(friendship.friendshipId));
                    break;
                case 'remove':
                    await api.delete(endpoints.friendRemove, { data: { otherUserId: parseInt(id as string) } });
                    break;
            }
            // Re-fetch status after action
            const fRes = await api.get(endpoints.friendStatus(id as string));
            setFriendship(fRes.data?.data);

            // Also refresh stats if friend count changed
            const sRes = await api.get(endpoints.userStats(id as string));
            setStats(sRes.data?.data);
        } catch (e: any) {
            console.error('Friend action error:', e);
            Alert.alert('Lỗi', e.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const getAvatarUri = (avatar?: string) => {
        if (!avatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
        if (avatar.startsWith('http')) return avatar;
        return `http://10.5.1.149:5000${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Không tìm thấy người dùng</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#8b5cf6' }}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const avatarUri = getAvatarUri(profile.avatar);
    const displayName = profile.displayName || profile.username || 'User';
    const bio = profile.bio || 'Chưa có tiểu sử';
    const level = profile.level || 1;

    const renderFriendButton = () => {
        if (friendship.status === 'self') return null;

        if (actionLoading) {
            return (
                <View style={[styles.followButton, { opacity: 0.7 }]}>
                    <ActivityIndicator size="small" color="#1e293b" />
                </View>
            );
        }

        switch (friendship.status) {
            case 'none':
            case 'rejected':
                return (
                    <TouchableOpacity style={styles.followButton} onPress={() => handleFriendAction('request')}>
                        <Text style={styles.followButtonText}>Kết bạn +</Text>
                    </TouchableOpacity>
                );
            case 'pending_sent':
                return (
                    <TouchableOpacity style={[styles.followButton, { backgroundColor: '#fef3c7' }]} onPress={() => handleFriendAction('cancel')}>
                        <Text style={[styles.followButtonText, { color: '#d97706' }]}>Hủy yêu cầu</Text>
                    </TouchableOpacity>
                );
            case 'pending_received':
                return (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={[styles.followButton, { backgroundColor: '#10b981' }]} onPress={() => handleFriendAction('accept')}>
                            <Text style={[styles.followButtonText, { color: '#fff' }]}>Chấp nhận</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.followButton, { backgroundColor: '#ef4444' }]} onPress={() => handleFriendAction('reject')}>
                            <Text style={[styles.followButtonText, { color: '#fff' }]}>Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'friends':
                return (
                    <TouchableOpacity
                        style={[styles.followButton, { backgroundColor: '#f1f5f9' }]}
                        onLongPress={() => {
                            Alert.alert('Hủy kết bạn', `Bạn có chắc chắn muốn hủy kết bạn với ${displayName}?`, [
                                { text: 'Hủy', style: 'cancel' },
                                { text: 'Xóa bạn', style: 'destructive', onPress: () => handleFriendAction('remove') }
                            ]);
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                            <Text style={styles.followButtonText}>Bạn bè</Text>
                        </View>
                    </TouchableOpacity>
                );
            case 'blocked_by_you':
                return (
                    <View style={[styles.followButton, { backgroundColor: '#1e293b' }]}>
                        <Text style={[styles.followButtonText, { color: '#fff' }]}>Đã chặn</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#8b5cf6" />
                }
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: avatarUri }} style={styles.heroImage} resizeMode="cover" />

                    <View style={styles.topIconsRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>Lv.{level}</Text>
                        </View>
                    </View>

                    <LinearGradient colors={['transparent', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,1)']} style={styles.gradientOverlay}>
                        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.infoContent}>
                            <View style={styles.nameRow}>
                                <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                            </View>

                            <Text style={styles.bioText}>{bio}</Text>

                            <View style={styles.cardBottomRow}>
                                <View style={styles.statsInline}>
                                    <View style={styles.statInlineItem}>
                                        <Ionicons name="person-outline" size={20} color="#64748b" />
                                        <Text style={styles.statInlineValue}>{stats?.friendCount || 0}</Text>
                                    </View>
                                    <View style={styles.statInlineItem}>
                                        <Ionicons name="mic-outline" size={20} color="#64748b" />
                                        <Text style={styles.statInlineValue}>{stats?.voicePinCount || 0}</Text>
                                    </View>
                                </View>

                                {renderFriendButton()}
                            </View>
                        </Animated.View>
                    </LinearGradient>
                </View>

                {/* Public Voice Pins Feed */}
                <View style={styles.feedSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ký ức công khai</Text>
                        <Text style={styles.sectionCount}>{publicPins.length}</Text>
                    </View>

                    {publicPins.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                        >
                            {publicPins.map((pin, index) => (
                                <MemoryCard
                                    key={pin.id}
                                    pin={pin}
                                    onPress={() => router.push({ pathname: '/(tabs)/home/voiceDetail', params: { id: pin.id } })}
                                    customWidth={width * 0.7}
                                    customMarginRight={15}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyFeed}>
                            <Ionicons name="musical-notes-outline" size={48} color="#e2e8f0" />
                            <Text style={styles.emptyText}>Chưa có ký ức công khai nào</Text>
                        </View>
                    )}
                </View>

                {/* Extra Stats */}
                <View style={styles.extraSection}>
                    <View style={styles.extraStatsRow}>
                        <View style={styles.extraStatBox}>
                            <Text style={styles.extraStatValue}>{stats?.totalListens || 0}</Text>
                            <Text style={styles.extraStatLabel}>Lượt nghe</Text>
                        </View>
                        <View style={[styles.extraStatBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9' }]}>
                            <Text style={styles.extraStatValue}>{stats?.achievementCount || 0}</Text>
                            <Text style={styles.extraStatLabel}>Thành tựu</Text>
                        </View>
                        <View style={styles.extraStatBox}>
                            <Text style={styles.extraStatValue}>{stats?.discoveredVoicesCount || 0}</Text>
                            <Text style={styles.extraStatLabel}>Khám phá</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    heroContainer: { width, height: height * 0.7, backgroundColor: '#f1f5f9' },
    heroImage: { width: '100%', height: '100%' },
    topIconsRow: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.9)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    levelText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 30,
    },
    infoContent: { width: '100%' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    nameText: { fontSize: 32, fontWeight: '800', color: '#1e293b', marginRight: 10 },
    verifiedBadge: {
        backgroundColor: '#10b981',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bioText: { fontSize: 17, color: '#475569', lineHeight: 26, marginBottom: 25 },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statsInline: { flexDirection: 'row', gap: 20 },
    statInlineItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statInlineValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    followButton: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
    },
    followButtonText: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
    feedSection: { marginTop: 20 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        marginBottom: 15
    },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    sectionCount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8b5cf6',
        backgroundColor: '#ede9fe',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12
    },
    emptyFeed: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { marginTop: 10, color: '#94a3b8', fontSize: 14, fontWeight: '500' },
    extraSection: { paddingHorizontal: 20, marginTop: 10 },
    extraStatsRow: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 28,
        paddingVertical: 25,
    },
    extraStatBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    extraStatValue: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 5 },
    extraStatLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
});
