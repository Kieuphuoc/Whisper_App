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
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, {
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    Extrapolate,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import VoicePinCarouselLegacy from '@/components/memory/VoicePinCarouselLegacy';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * (2 / 3);

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

    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [friendship, setFriendship] = useState<{ status: FriendshipStatus; friendshipId: number | null }>({ status: 'none', friendshipId: null });
    const [publicPins, setPublicPins] = useState<VoicePin[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const scrollY = useSharedValue(0);
    const shimmerProgress = useSharedValue(0);
    const buttonGlow = useSharedValue(0);

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

            setUser(pRes.data?.data);
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

        shimmerProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withDelay(4500, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );

        buttonGlow.value = withRepeat(
            withSequence(
                withDelay(8000, withTiming(1, { duration: 1000 })),
                withTiming(0, { duration: 1000 })
            ),
            -1,
            false
        );
    }, [id]);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(shimmerProgress.value, [0, 1], [-200, 400]) },
            { skewX: '-20deg' }
        ],
        opacity: interpolate(shimmerProgress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: buttonGlow.value * 0.5,
        transform: [{ scale: interpolate(buttonGlow.value, [0, 1], [1, 1.05]) }]
    }));

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const handleFriendAction = async (action: 'request' | 'accept' | 'reject' | 'cancel' | 'remove') => {
        setActionLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);

            const successMessages: Record<string, string> = {
                request: 'Đã gửi lời mời kết bạn!',
                accept: 'Đã chấp nhận kết bạn!',
                reject: 'Đã từ chối lời mời kết bạn.',
                cancel: 'Đã hủy lời mời kết bạn.',
                remove: 'Đã hủy kết bạn thành công.',
            };

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

            Alert.alert('Thành công', successMessages[action]);
        } catch (e: any) {
            console.error('Friend action error:', e);
            Alert.alert('Lỗi', e.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartChat = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập để nhắn tin');
                return;
            }

            const api = authApis(token);
            const res = await api.post(endpoints.chatPrivate(id as string));
            const roomData = res.data?.data ?? res.data;
            const roomId = roomData?.id ?? roomData?.roomId;

            if (!roomId) {
                Alert.alert('Lỗi', 'Không thể mở cuộc trò chuyện');
                return;
            }

            router.push(`/chat/${roomId}`);
        } catch (e: any) {
            console.error('Start chat error:', e);
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể bắt đầu cuộc trò chuyện');
        }
    };

    const avatarUri = useMemo(() => {
        if (!user?.avatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
        if (user.avatar.startsWith('http')) return user.avatar;
        return `${BASE_URL}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
    }, [user]);

    const coverUri = useMemo(() => {
        if (!user?.cover) return null;
        if (user.cover.startsWith('http')) return user.cover;
        return `${BASE_URL}${user.cover.startsWith('/') ? '' : '/'}${user.cover}`;
    }, [user]);

    const joinDate = useMemo(() => {
        if (!user?.createdAt) return 'Vô định';
        const date = new Date(user.createdAt);
        return `Tham gia vào: ${date.getMonth() + 1}/${date.getFullYear()}`;
    }, [user]);

    const contentAnim = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(scrollY.value, [0, BANNER_HEIGHT], [0, -40], Extrapolate.CLAMP),
                },
            ],
        };
    });

    if (loading && !refreshing) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: currentTheme.colors.background }]}>
                <ActivityIndicator size="large" color={currentTheme.colors.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: currentTheme.colors.background }]}>
                <Text style={{ color: currentTheme.colors.text }}>Không tìm thấy người dùng</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: currentTheme.colors.primary }}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderFriendButton = () => {
        if (friendship.status === 'self') {
            return (
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/profile/edit-profile')}
                    style={styles.glassMainButton}
                    activeOpacity={0.9}
                >
                    <Animated.View style={[StyleSheet.absoluteFill, glowStyle, { backgroundColor: currentTheme.colors.primary, borderRadius: 20, filter: 'blur(15px)' } as any]} />
                    
                    <LinearGradient colors={['#7c3aed', '#4338ca']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

                    {/* PERIODIC SHIMMER FLASH */}
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                width: 100,
                                backgroundColor: 'rgba(255,255,255,0.4)',
                            },
                            shimmerStyle
                        ]}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>

                    <View style={styles.buttonInner}>
                        <Ionicons name="pencil" size={20} color="#fff" style={{ marginRight: 10 }} />
                        <Text style={styles.mainActionText}>Chỉnh sửa</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        if (actionLoading) {
            return (
                <View style={[styles.glassMainButton, { opacity: 0.7 }]}>
                    <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={StyleSheet.absoluteFill} />
                    <ActivityIndicator size="small" color="#fff" />
                </View>
            );
        }

        switch (friendship.status) {
            case 'none':
            case 'rejected':
                return (
                    <TouchableOpacity
                        style={styles.glassMainButton}
                        onPress={() => handleFriendAction('request')}
                        activeOpacity={0.9}
                    >
                        <Animated.View style={[StyleSheet.absoluteFill, glowStyle, { backgroundColor: currentTheme.colors.primary, borderRadius: 20, filter: 'blur(15px)' } as any]} />
                        <LinearGradient colors={['#7c3aed', '#4338ca']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                        
                        {/* PERIODIC SHIMMER FLASH */}
                        <Animated.View
                            style={[
                                {
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    width: 100,
                                    backgroundColor: 'rgba(255,255,255,0.4)',
                                },
                                shimmerStyle
                            ]}
                        >
                            <LinearGradient
                                colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>

                        <View style={styles.buttonInner}>
                            <Ionicons name="person-add" size={20} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.mainActionText}>Kết bạn</Text>
                        </View>
                    </TouchableOpacity>
                );
            case 'pending_sent':
                return (
                    <TouchableOpacity
                        style={styles.glassMainButton}
                        onPress={() => handleFriendAction('cancel')}
                    >
                        <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                        <View style={styles.buttonInner}>
                            <Ionicons name="close-circle" size={20} color={isDark ? "#fff" : currentTheme.colors.text} style={{ marginRight: 10 }} />
                            <Text style={[styles.mainActionText, { color: isDark ? "#fff" : currentTheme.colors.text }]}>Hủy yêu cầu</Text>
                        </View>
                    </TouchableOpacity>
                );
            case 'pending_received':
                return (
                    <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
                        <TouchableOpacity
                            style={[styles.glassMainButton, { flex: 1.5 }]}
                            onPress={() => handleFriendAction('accept')}
                        >
                            <LinearGradient colors={['#10b981', '#059669']} style={StyleSheet.absoluteFill} />
                            <Text style={styles.mainActionText}>Chấp nhận</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.glassMainButton, { flex: 1 }]}
                            onPress={() => handleFriendAction('reject')}
                        >
                            <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                            <Text style={[styles.mainActionText, { color: isDark ? "#fff" : currentTheme.colors.text }]}>Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'friends':
                return (
                    <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
                        <TouchableOpacity
                            style={[styles.glassMainButton, { flex: 1.5 }]}
                            onPress={() => {
                                Alert.alert('Hủy kết bạn', `Bạn có chắc chắn muốn hủy kết bạn với ${user.displayName || user.username}?`, [
                                    { text: 'Hủy', style: 'cancel' },
                                    { text: 'Xóa bạn', style: 'destructive', onPress: () => handleFriendAction('remove') }
                                ]);
                            }}
                        >
                            <LinearGradient colors={['#10b981', '#059669']} style={StyleSheet.absoluteFill} />
                            <View style={styles.buttonInner}>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.mainActionText}>Bạn bè</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.glassSettingsButton, { width: 60, height: 60, borderRadius: 20 }]}
                            onPress={handleStartChat}
                        >
                            <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                            <Ionicons name="chatbubble-outline" size={22} color={isDark ? "#fff" : currentTheme.colors.text} />
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

            {/* FULL SCREEN BACKGROUND IMAGE */}
            <View style={StyleSheet.absoluteFill}>
                {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.fullscreenBackground} />
                ) : (
                    <LinearGradient
                        colors={[currentTheme.colors.primary, currentTheme.colors.background]}
                        style={styles.fullscreenBackground}
                    />
                )}
                <LinearGradient
                    colors={isDark ?
                        ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)'] :
                        ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.7)']}
                    locations={[0, 0.4, 0.7, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* BACK BUTTON */}
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.floatingBackButton}
                activeOpacity={0.8}
            >
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.backBlur}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : currentTheme.colors.text} />
                </BlurView>
            </TouchableOpacity>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={currentTheme.colors.primary} />
                }
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.topEmptyGap} />

                {/* AVATAR & ASYMMETRIC NAME PANEL */}
                <Animated.View style={[styles.profileContent, contentAnim]}>
                    <View style={styles.avatarRow}>
                        <MotiView
                            from={{ scale: 0, rotate: '-15deg' }}
                            animate={{ scale: 1, rotate: '0deg' }}
                            transition={{ type: 'spring', damping: 15 }}
                            style={[styles.avatarOuter, { borderColor: isDark ? '#1a1a1a' : '#fff' }]}
                        >
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            <MotiView
                                from={{ rotate: '-45deg', scale: 0 }}
                                animate={{ rotate: '-15deg', scale: 1 }}
                                transition={{ delay: 500, type: 'spring' }}
                                style={[styles.levelCapsule, { backgroundColor: currentTheme.colors.primary }]}
                            >
                                <Text style={styles.levelText}>Lv. {user.level || 1}</Text>
                            </MotiView>
                        </MotiView>

                        <View style={styles.bubblesContainer}>
                            <MotiView
                                from={{ scale: 0, translateX: 20 }}
                                animate={{ scale: 1, translateX: 0 }}
                                transition={{ delay: 300 }}
                                style={[styles.statBubble, styles.bubbleLarge]}
                            >
                                <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[StyleSheet.absoluteFill, { backgroundColor: currentTheme.colors.primary + (isDark ? '50' : '20') }]} />
                                <Text style={[styles.bubbleValue, { color: isDark ? '#fff' : currentTheme.colors.primary }]}>{stats?.totalListens || 0}</Text>
                                <Text style={[styles.bubbleLabel, { color: isDark ? '#fff' : currentTheme.colors.textMuted }]}>Listens</Text>
                            </MotiView>

                            <MotiView
                                from={{ scale: 0, translateY: 20 }}
                                animate={{ scale: 1, translateY: 0 }}
                                transition={{ delay: 450 }}
                                style={[styles.statBubble, styles.bubbleMedium, { bottom: -5, left: -35 }]}
                            >
                                <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[StyleSheet.absoluteFill, { backgroundColor: currentTheme.colors.secondary + (isDark ? '50' : '20') }]} />
                                <Text style={[styles.bubbleValueMedium, { color: isDark ? '#fff' : currentTheme.colors.secondary }]}>{stats?.voicePinCount || 0}</Text>
                                <Text style={[styles.bubbleLabelMedium, { color: isDark ? '#fff' : currentTheme.colors.textMuted }]}>Voices</Text>
                            </MotiView>

                            <MotiView
                                from={{ scale: 0, translateY: -20 }}
                                animate={{ scale: 1, translateY: 0 }}
                                transition={{ delay: 600 }}
                                style={[styles.statBubble, styles.bubbleSmall, { right: -10, top: -35 }]}
                            >
                                <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[StyleSheet.absoluteFill, { backgroundColor: '#10b981' + (isDark ? '50' : '20') }]} />
                                <Text style={[styles.bubbleValueSmall, { color: isDark ? '#fff' : '#059669' }]}>{stats?.friendCount || 0}</Text>
                                <Text style={[styles.bubbleLabelSmall, { color: isDark ? '#fff' : currentTheme.colors.textMuted }]}>Friends</Text>
                            </MotiView>
                        </View>
                    </View>

                    {/* GLASS VIBE SECTION */}
                    <View style={styles.glassRow}>
                        {[
                            { icon: "search", label: `${stats?.discoveredVoicesCount || 0} Khám phá` },
                            { icon: "time-outline", label: joinDate }
                        ].map((item, i) => (
                            <MotiView
                                key={i}
                                from={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 700 + i * 150 }}
                                style={[styles.glassStrangeCard, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                            >
                                <BlurView intensity={25} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                                <Ionicons name={item.icon as any} size={14} color={isDark ? "#fff" : currentTheme.colors.primary} />
                                <Text style={[styles.glassStrangeText, { color: isDark ? "#fff" : currentTheme.colors.text }]}>{item.label}</Text>
                            </MotiView>
                        ))}
                    </View>

                    {/* MAIN PROFILE CARD */}
                    <MotiView
                        from={{ opacity: 0, translateY: 40 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 300 }}
                        style={[styles.mainGlassCard, {
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                            borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)'
                        }]}
                    >
                        <BlurView intensity={isDark ? 10 : 5} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                        <View style={styles.nameHeader}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.glassDisplayName, { color: isDark ? '#fff' : currentTheme.colors.text }]}>
                                        {user.displayName || user.username}
                                    </Text>
                                    <Ionicons name="checkmark-circle" size={24} color="#10b981" style={{ marginLeft: 8 }} />
                                </View>
                                <Text style={[styles.glassUsername, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>@{user.username}</Text>
                            </View>
                        </View>

                        <View style={styles.bioBox}>
                            <Text style={[styles.glassBioText, { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }]}>
                                {user.bio || 'Khám phá thế giới qua những âm thanh ẩn giấu.'}
                            </Text>
                        </View>

                        <View style={styles.actionGrid}>
                            {renderFriendButton()}
                        </View>
                    </MotiView>

                    {/* PUBLIC PINS SECTION */}
                    <MotiView
                        from={{ opacity: 0, translateY: 40 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 500 }}
                        style={styles.sectionContainer}
                    >
                        <VoicePinCarouselLegacy
                            title="Ký ức công khai"
                            pins={publicPins}
                            onSelectPin={(pin) => router.push({ pathname: '/voiceDetail', params: { id: pin.id.toString() } })}
                            onSeeAll={() => router.push({ pathname: '/(tabs)/memory/grid', params: { title: 'Ký ức công khai', userId: id } })}
                            currentTheme={currentTheme}
                            icon="mic"
                            iconColor={currentTheme.colors.primary}
                            emptyText="Chưa có ký ức công khai nào"
                        />
                    </MotiView>
                </Animated.View>

                <View style={{ height: 120 }} />
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fullscreenBackground: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    floatingBackButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 1000,
        overflow: 'hidden',
        borderRadius: 20,
    },
    backBlur: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    scrollContent: { paddingBottom: 100 },
    topEmptyGap: { height: height * 0.25 },
    profileContent: { paddingHorizontal: 20, zIndex: 10 },
    avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 25 },
    avatarOuter: {
        width: 120,
        height: 120,
        borderRadius: 36,
        borderWidth: 4,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'visible',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 32 },
    levelCapsule: {
        position: 'absolute',
        top: -8,
        right: -15,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    levelText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    bubblesContainer: { width: 140, height: 110, position: 'relative' },
    statBubble: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    bubbleLarge: { width: 85, height: 85, right: 0, top: 0 },
    bubbleMedium: { width: 70, height: 70 },
    bubbleSmall: { width: 65, height: 65 },
    bubbleValue: { fontSize: 20, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    bubbleLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#fff', opacity: 0.9 },
    bubbleValueMedium: { fontSize: 18, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    bubbleLabelMedium: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: '#fff', opacity: 0.9 },
    bubbleValueSmall: { fontSize: 16, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    bubbleLabelSmall: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: '#fff', opacity: 0.9 },
    glassRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, paddingHorizontal: 4 },
    glassStrangeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        gap: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    glassStrangeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    mainGlassCard: {
        padding: 24,
        borderRadius: 32,
        marginBottom: 35,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    nameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    glassDisplayName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    glassUsername: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    bioBox: { marginBottom: 25 },
    glassBioText: { fontSize: 15, lineHeight: 22, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },
    actionGrid: { flexDirection: 'row', gap: 12 },
    glassMainButton: {
        flex: 1,
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 15,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        position: 'relative',
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
    mainActionText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    glassSettingsButton: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    sectionContainer: { marginTop: 10 },
});
