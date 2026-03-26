import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { theme } from '@/constants/Theme';
import { User, VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
    useColorScheme,
    Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, { 
    FadeInDown, 
    useAnimatedScrollHandler, 
    useAnimatedStyle, 
    useSharedValue, 
    interpolate, 
    Extrapolate 
} from 'react-native-reanimated';
import { MotiView } from 'moti';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.45;

const formatDate = (dateStr: string | Date) => {
    try {
        const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch (e) {
        return typeof dateStr === 'string' ? dateStr : '';
    }
};

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked_by_you' | 'blocked' | 'rejected' | 'self';

export default function UserProfileScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [profile, setProfile] = useState<User | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [friendship, setFriendship] = useState<{ status: FriendshipStatus; friendshipId: number | null }>({ status: 'none', friendshipId: null });
    const [publicPins, setPublicPins] = useState<VoicePin[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const scrollY = useSharedValue(0);

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

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const headerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(scrollY.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [-HEADER_HEIGHT / 2, 0, 0], Extrapolate.CLAMP),
                },
                {
                    scale: interpolate(scrollY.value, [-HEADER_HEIGHT, 0], [2, 1], Extrapolate.CLAMP),
                },
            ],
        };
    });

    const avatarStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT * 0.5], [1, 0], Extrapolate.CLAMP),
            transform: [
                {
                    scale: interpolate(scrollY.value, [0, HEADER_HEIGHT * 0.5], [1, 0.8], Extrapolate.CLAMP),
                },
            ],
        };
    });

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
            const fRes = await api.get(endpoints.friendStatus(id as string));
            setFriendship(fRes.data?.data);

            const sRes = await api.get(endpoints.userStats(id as string));
            setStats(sRes.data?.data);
        } catch (e: any) {
            console.error('Friend action error:', e);
            Alert.alert('Lỗi', e.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const avatarUri = useMemo(() => {
        if (!profile?.avatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
        if (profile.avatar.startsWith('http')) return profile.avatar;
        return `${BASE_URL}${profile.avatar.startsWith('/') ? '' : '/'}${profile.avatar}`;
    }, [profile]);

    const coverUri = useMemo(() => {
        if (!profile?.cover) return null;
        if (profile.cover.startsWith('http')) return profile.cover;
        return `${BASE_URL}${profile.cover.startsWith('/') ? '' : '/'}${profile.cover}`;
    }, [profile]);

    if (loading && !refreshing) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: currentTheme.colors.background }]}>
                <ActivityIndicator size="large" color={currentTheme.colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: currentTheme.colors.background }]}>
                <Text style={{ color: currentTheme.colors.text }}>Không tìm thấy người dùng</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: currentTheme.colors.primary }}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const displayName = profile.displayName || profile.username || 'User';
    const bio = profile.bio || 'Chưa có tiểu sử';
    const level = profile.level || 1;

    const renderFriendButton = () => {
        if (friendship.status === 'self') {
            return (
                <TouchableOpacity 
                    onPress={() => router.push('/(tabs)/profile/edit-profile')}
                    style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
                >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Chỉnh sửa hồ sơ</Text>
                </TouchableOpacity>
            );
        }

        if (actionLoading) {
            return (
                <View style={[styles.actionButton, { opacity: 0.7, backgroundColor: currentTheme.colors.icon + '20' }]}>
                    <ActivityIndicator size="small" color={currentTheme.colors.primary} />
                    <Text style={[styles.actionButtonText, { color: currentTheme.colors.primary }]}>Đang xử lý...</Text>
                </View>
            );
        }

        switch (friendship.status) {
            case 'none':
            case 'rejected':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
                        onPress={() => handleFriendAction('request')}
                    >
                        <Ionicons name="person-add-outline" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Kết bạn</Text>
                    </TouchableOpacity>
                );
            case 'pending_sent':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: currentTheme.colors.icon + '20' }]}
                        onPress={() => handleFriendAction('cancel')}
                    >
                        <Ionicons name="close-circle-outline" size={20} color={currentTheme.colors.text} />
                        <Text style={[styles.actionButtonText, { color: currentTheme.colors.text }]}>Hủy yêu cầu</Text>
                    </TouchableOpacity>
                );
            case 'pending_received':
                return (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#10b981', flex: 1.5 }]}
                            onPress={() => handleFriendAction('accept')}
                        >
                            <Text style={styles.actionButtonText}>Chấp nhận</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: currentTheme.colors.icon + '20', flex: 1 }]}
                            onPress={() => handleFriendAction('reject')}
                        >
                            <Text style={[styles.actionButtonText, { color: currentTheme.colors.text }]}>Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'friends':
                return (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#10b981', flex: 1.5 }]}
                            onPress={() => {
                                Alert.alert('Hủy kết bạn', `Bạn có chắc chắn muốn hủy kết bạn với ${displayName}?`, [
                                    { text: 'Hủy', style: 'cancel' },
                                    { text: 'Xóa bạn', style: 'destructive', onPress: () => handleFriendAction('remove') }
                                ]);
                            }}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Bạn bè</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: currentTheme.colors.icon + '20', flex: 1 }]}
                            onPress={() => Alert.alert('Tính năng', 'Tính năng nhắn tin đang phát triển')}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color={currentTheme.colors.text} />
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            {/* Dynamic Header */}
            <Animated.View style={[styles.header, headerStyle]}>
                <Image
                    source={{ uri: coverUri || avatarUri }}
                    style={styles.headerImage}
                    blurRadius={coverUri ? 0 : (Platform.OS === 'ios' ? 0 : 10)}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'transparent', isDark ? currentTheme.colors.background : 'rgba(255,255,255,0.9)', currentTheme.colors.background]}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={currentTheme.colors.primary} />
                }
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.topSpace} />

                {/* Profile Card */}
                <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={styles.profileCard}>
                    {/* Back Button Overlay */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={currentTheme.colors.text} />
                    </TouchableOpacity>

                    {/* Avatar Container */}
                    <Animated.View style={[styles.avatarContainer, avatarStyle]}>
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        <View style={[styles.levelBadge, { backgroundColor: currentTheme.colors.primary }]}>
                            <Text style={styles.levelText}>Lv.{level}</Text>
                        </View>
                    </Animated.View>

                    <View style={styles.mainInfo}>
                        <View style={styles.nameSection}>
                            <Text style={[styles.nameText, { color: currentTheme.colors.text }]}>{displayName}</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" style={{ marginLeft: 6 }} />
                        </View>
                        <Text style={[styles.usernameText, { color: currentTheme.colors.icon }]}>@{profile.username}</Text>
                        
                        <Text style={[styles.bioText, { color: currentTheme.colors.text }]} numberOfLines={3}>
                            {bio}
                        </Text>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{stats?.voicePinCount || 0}</Text>
                                <Text style={[styles.statLabel, { color: currentTheme.colors.icon }]}>Voices</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{stats?.totalListens || 0}</Text>
                                <Text style={[styles.statLabel, { color: currentTheme.colors.icon }]}>Listens</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{stats?.friendCount || 0}</Text>
                                <Text style={[styles.statLabel, { color: currentTheme.colors.icon }]}>Friends</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionRow}>
                            {renderFriendButton()}
                        </View>
                    </View>
                </Animated.View>

                {/* Recent Activities Section */}
                <View style={styles.contentSection}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Ký ức công khai</Text>
                    
                    {publicPins && publicPins.length > 0 ? (
                        <View style={styles.activityList}>
                            {publicPins.map((pin, index) => (
                                <MotiView
                                    key={pin.id}
                                    from={{ opacity: 0, translateY: 20 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ delay: 400 + index * 100 }}
                                >
                                    <TouchableOpacity 
                                        onPress={() => router.push({ pathname: '/(tabs)/home/voiceDetail', params: { id: pin.id.toString() } })}
                                        style={[styles.activityCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                    >
                                        <View style={[styles.activityIcon, { backgroundColor: currentTheme.colors.primary + '20' }]}>
                                            <Ionicons name="mic" size={24} color={currentTheme.colors.primary} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                                            <Text style={[styles.activityTitle, { color: currentTheme.colors.text }]} numberOfLines={1}>
                                                {pin.content || 'Bản ghi không lời'}
                                            </Text>
                                            <Text style={[styles.activityTime, { color: currentTheme.colors.icon }]}>
                                                {formatDate(pin.createdAt)}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={currentTheme.colors.icon} />
                                    </TouchableOpacity>
                                </MotiView>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyActivity}>
                            <Ionicons name="mic-off-outline" size={48} color={currentTheme.colors.icon + '40'} />
                            <Text style={[styles.emptyText, { color: currentTheme.colors.icon }]}>Chưa có ký ức công khai nào</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_HEIGHT,
        zIndex: 0,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    scrollContent: { paddingBottom: 40 },
    topSpace: { height: HEADER_HEIGHT * 0.4 },
    profileCard: {
        backgroundColor: 'transparent',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    backButton: {
        position: 'absolute',
        top: -30,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    avatarContainer: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
        borderColor: '#fff',
        backgroundColor: '#eee',
        marginBottom: 20,
        position: 'relative',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    avatar: { width: '100%', height: '100%', borderRadius: 65 },
    levelBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    levelText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    mainInfo: { width: '100%' },
    nameSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    nameText: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
    usernameText: { fontSize: 16, fontWeight: '500', marginBottom: 16 },
    bioText: { fontSize: 15, lineHeight: 22, marginBottom: 24, opacity: 0.8 },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        marginBottom: 24,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    statDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)' },
    actionRow: { width: '100%' },
    actionButton: {
        height: 54,
        borderRadius: 27,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    contentSection: { paddingHorizontal: 24, marginTop: 32 },
    sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    activityList: { gap: 12 },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    activityIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityTitle: { fontSize: 16, fontWeight: '700' },
    activityTime: { fontSize: 13, marginTop: 2 },
    emptyActivity: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, opacity: 0.5 },
    emptyText: { marginTop: 12, fontSize: 15, fontWeight: '500' },
});
