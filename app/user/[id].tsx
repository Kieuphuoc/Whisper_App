import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { theme } from '@/constants/Theme';
import { User, VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
    ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, {
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import VoicePinCarousel from '@/components/memory/VoicePinCarousel';
import VoicePinTurntable from '@/components/home/VoicePinCard';

const MASCOT_ICONS: { [key: string]: any } = {
    first_voice: require('@/assets/images/achievements/first_voice.png'),
    voice_collector: require('@/assets/images/achievements/voice_collector.png'),
    social_butterfly: require('@/assets/images/achievements/social_butterfly.png'),
    explorer: require('@/assets/images/achievements/explorer.png'),
    commenter: require('@/assets/images/achievements/commenter.png'),
    popular_voice: require('@/assets/images/achievements/popular_voice.png'),
};

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * (2 / 3);

export default function OtherUserProfileScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme as 'light' | 'dark'];
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [friendStatus, setFriendStatus] = useState<string>('none'); 
    const [friendshipId, setFriendshipId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'voices' | 'achievements'>('voices');
    const [userVoices, setUserVoices] = useState<VoicePin[]>([]);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);

    const scrollY = useSharedValue(0);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!id) return;
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const api = authApis(token || undefined);

            const [uRes, sRes, fRes] = await Promise.all([
                api.get(endpoints.userProfile(id as string)),
                api.get(endpoints.userStats(id as string)).catch(() => ({ data: { data: {} } })),
                api.get(endpoints.friendStatus(id as string)).catch(() => ({ data: { data: { status: 'none' } } })),
            ]);

            setUser(uRes.data?.data || uRes.data);
            setStats(sRes.data?.data || sRes.data || {});
            setFriendStatus(fRes.data?.data?.status || 'none');
            setFriendshipId(fRes.data?.data?.friendshipId || null);

            fetchTabData(activeTab);
        } catch (e) {
            console.error('Fetch other profile error:', e);
            Alert.alert('Lỗi', 'Không thể tải thông tin người dùng.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, activeTab]);

    const fetchTabData = async (tab: string) => {
        if (!id) return;
        setTabLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const api = authApis(token || undefined);

            if (tab === 'voices') {
                const res = await api.get(endpoints.voicePublicByUser(id as string));
                setUserVoices(res.data?.data || []);
            } else if (tab === 'achievements') {
                const res = await api.get(endpoints.userAchievements(id as string));
                setAchievements(res.data?.data || []);
            }
        } catch (e) {
            console.error(`Fetch other ${tab} error:`, e);
        } finally {
            setTabLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        if (!loading && user) {
            fetchTabData(activeTab);
        }
    }, [activeTab]);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const handleAddFriend = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để kết bạn.');
                return;
            }
            const res = await authApis(token).post(endpoints.friendRequest, { receiverId: user.id });
            const newFriendshipId = res.data?.data?.id || res.data?.id;
            setFriendStatus('pending_sent');
            if (newFriendshipId) setFriendshipId(newFriendshipId);
            Alert.alert('Thành công', 'Đã gửi lời mời kết bạn.');
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể gửi lời mời kết bạn.');
        }
    };

    const handleCancelRequest = async () => {
        if (!friendshipId) return;
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            await authApis(token).delete(endpoints.friendCancel(friendshipId));
            setFriendStatus('none');
            setFriendshipId(null);
            Alert.alert('Thành công', 'Đã thu hồi lời mời kết bạn.');
        } catch (e: any) {
            Alert.alert('Lỗi', 'Không thể thu hồi lời mời.');
        }
    };

    const handleRespond = async (action: 'accept' | 'reject') => {
        if (!friendshipId) return;
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            await authApis(token).post(endpoints.friendRespond(friendshipId), { action });
            setFriendStatus(action === 'accept' ? 'friends' : 'none');
            Alert.alert('Thành công', action === 'accept' ? 'Đã chấp nhận kết bạn.' : 'Đã từ chối lời mời.');
        } catch (e) {
            console.error('Respond error:', e);
            Alert.alert('Lỗi', 'Không thể phản hồi lời mời.');
        }
    };

    const handleChat = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await authApis(token).post(endpoints.chatPrivate(user.id.toString()));
            const roomId = res.data?.data?.id || res.data?.id;
            if (roomId) {
                router.push({ pathname: '/chat/[id]', params: { id: roomId.toString() } });
            }
        } catch (e) {
            console.error('Chat error:', e);
        }
    };

    const avatarSource = useMemo(() => {
        if (!user?.avatar) return require('@/assets/images/avatar.png');
        const uri = user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
        return { uri };
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

    const bannerAnim = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(scrollY.value, [-height, 0, height], [-height / 2, 0, 0], Extrapolate.CLAMP),
                },
                {
                    scale: interpolate(scrollY.value, [-height, 0], [2.5, 1], Extrapolate.CLAMP),
                },
            ],
        };
    });

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

    if (!user) return null;

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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

            {/* HEADER NAVIGATION */}
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <BlurView intensity={30} tint="dark" style={styles.navIconBlur}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#fff" />
                }
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.topEmptyGap} />

                <Animated.View style={[styles.profileContent, contentAnim]}>
                    <View style={styles.avatarRow}>
                        <MotiView
                            from={{ scale: 0, rotate: '-15deg' }}
                            animate={{ scale: 1, rotate: '0deg' }}
                            transition={{ type: 'spring', damping: 15 }}
                            style={[styles.avatarOuter, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }]}
                        >
                            <Image source={avatarSource} style={styles.avatar} />
                            <View style={[styles.levelCapsule, { backgroundColor: currentTheme.colors.primary }]}>
                                <Text style={styles.levelText}>XP {user.level || 1}</Text>
                            </View>
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

                    <View style={styles.glassRow}>
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 700 }}
                            style={[styles.glassStrangeCard, {
                                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                            }]}
                        >
                            <BlurView intensity={isDark ? 30 : 20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                            <Ionicons name="time-outline" size={14} color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'} />
                            <Text style={[styles.glassStrangeText, { fontSize: 15, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }]}>{joinDate}</Text>
                        </MotiView>
                    </View>

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
                                <Text style={[styles.glassDisplayName, { color: isDark ? '#fff' : currentTheme.colors.text }]}>
                                    {user.displayName || user.username}
                                </Text>
                                <Text style={[styles.glassUsername, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>@{user.username}</Text>
                            </View>
                        </View>

                        <View style={styles.bioBox}>
                            <Text style={[styles.glassBioText, { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }]}>
                                {user.bio || 'Khám phá thế giới qua những âm thanh ẩn giấu.'}
                            </Text>
                        </View>

                        <View style={styles.actionGrid}>
                            {friendStatus === 'friends' ? (
                                <TouchableOpacity onPress={handleChat} style={styles.glassMainButton} activeOpacity={0.9}>
                                    <LinearGradient colors={['#7c3aed', '#4338ca']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                                    <View style={styles.buttonInner}>
                                        <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.mainActionText}>Nhắn tin</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : friendStatus === 'pending_sent' ? (
                                <TouchableOpacity onPress={handleCancelRequest} style={[styles.glassMainButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} activeOpacity={0.8}>
                                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                    <View style={styles.buttonInner}>
                                        <Ionicons name="close-circle" size={20} color="#f87171" style={{ marginRight: 10 }} />
                                        <Text style={[styles.mainActionText, { color: '#f87171' }]}>Thu hồi lời mời</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : friendStatus === 'pending_received' ? (
                                <>
                                    <TouchableOpacity 
                                        onPress={() => handleRespond('accept')} 
                                        style={[styles.glassMainButton, { flex: 2 }]} 
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                                        <View style={styles.buttonInner}>
                                            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 10 }} />
                                            <Text style={styles.mainActionText}>Chấp nhận</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleRespond('reject')} 
                                        style={[styles.glassMainButton, { flex: 1, marginLeft: 10, backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} 
                                        activeOpacity={0.9}
                                    >
                                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                        <View style={styles.buttonInner}>
                                            <Ionicons name="close-circle" size={20} color="#f87171" />
                                        </View>
                                    </TouchableOpacity>
                                </>
                            ) : friendStatus === 'self' ? null : (
                                <TouchableOpacity onPress={handleAddFriend} style={styles.glassMainButton} activeOpacity={0.9}>
                                    <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                                    <View style={styles.buttonInner}>
                                        <Ionicons name="person-add" size={20} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.mainActionText}>Kết bạn</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </MotiView>

                    <View style={[styles.tabHeaderContainer, {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                        borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)'
                    }]}>
                        <BlurView intensity={isDark ? 10 : 5} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                        <View style={styles.tabHeader}>
                            {[
                                { id: 'voices', icon: 'mic', label: 'VoicePin' },
                                { id: 'achievements', icon: 'trophy', label: 'Thành tựu' }
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.id}
                                    onPress={() => setActiveTab(tab.id as any)}
                                    style={[
                                        styles.tabItem,
                                        activeTab === tab.id && [
                                            styles.activeTabItem,
                                            {
                                                borderColor: currentTheme.colors.primary,
                                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.primary + '15'
                                            }
                                        ]
                                    ]}
                                >
                                    <Ionicons
                                        name={tab.icon as any}
                                        size={18}
                                        color={activeTab === tab.id ? currentTheme.colors.primary : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')}
                                    />
                                    <Text style={[
                                        styles.tabLabel,
                                        { color: activeTab === tab.id ? currentTheme.colors.primary : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') },
                                        activeTab === tab.id && styles.activeTabLabel
                                    ]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.tabContent}>
                        {tabLoading ? (
                            <ActivityIndicator size="small" color={currentTheme.colors.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <>
                                {activeTab === 'voices' && (
                                    <VoicePinCarousel
                                        pins={userVoices}
                                        onSelectPin={(p) => setSelectedPin(p)}
                                        currentTheme={currentTheme}
                                        emptyText="Người dùng chưa có VoicePin công khai"
                                        fallbackAuraUrl={coverUri}
                                    />
                                )}

                                {activeTab === 'achievements' && (
                                    <View style={styles.achievementsGrid}>
                                        {achievements.length > 0 ? achievements.map((item) => {
                                            let mascotIcon = { uri: item.achievement?.iconUrl };
                                            const name = item.achievement?.name || "";
                                            if (name.includes("Lời nói đầu tiên")) mascotIcon = MASCOT_ICONS.first_voice;
                                            else if (name.includes("sưu tầm")) mascotIcon = MASCOT_ICONS.voice_collector;
                                            else if (name.includes("bạn") || name.toLowerCase().includes("giao thiệp")) mascotIcon = MASCOT_ICONS.social_butterfly;
                                            else if (name.includes("thám hiểm")) mascotIcon = MASCOT_ICONS.explorer;
                                            else if (name.includes("bình luận")) mascotIcon = MASCOT_ICONS.commenter;
                                            else if (name.includes("phổ biến")) mascotIcon = MASCOT_ICONS.popular_voice;

                                            return (
                                                <MotiView key={item.achievementId} from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={styles.achievementBadge}>
                                                    <View style={[styles.badgeIconBg, { backgroundColor: currentTheme.colors.primary + '20' }]}>
                                                        <Image source={mascotIcon} style={styles.badgeIcon} />
                                                    </View>
                                                    <Text style={[styles.badgeName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>{item.achievement?.name}</Text>
                                                </MotiView>
                                            );
                                        }) : (
                                            <View style={styles.emptyContainer}>
                                                <Ionicons name="trophy-outline" size={48} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} />
                                                <Text style={[styles.emptyText, { color: currentTheme.colors.textMuted }]}>Chưa có thành tựu nào</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </Animated.View>
                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {selectedPin && (
                <VoicePinTurntable
                    pin={selectedPin}
                    onClose={() => setSelectedPin(null)}
                    autoPlay={true}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fullscreenBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    navHeader: { position: 'absolute', top: 50, left: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    navIconBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 100 },
    topEmptyGap: { height: height * 0.25 },
    profileContent: { paddingHorizontal: 20, zIndex: 10 },
    avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 25 },
    avatarOuter: {
        width: 120,
        height: 120,
        borderRadius: 36,
        borderWidth: 3,
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
        left: -15,
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
        backgroundColor: 'transparent',
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
        textShadowRadius: 4,
    },
    tabHeaderContainer: {
        padding: 6,
        borderRadius: 20,
        marginBottom: 25,
        borderWidth: 1.5,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    tabHeader: {
        flexDirection: 'row',
        gap: 8,
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTabItem: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    activeTabLabel: {
        fontWeight: '800',
    },
    tabContent: {
        minHeight: 300,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    achievementBadge: {
        width: (width - 64) / 3,
        alignItems: 'center',
        marginBottom: 20,
    },
    badgeIconBg: {
        width: 95,
        height: 95,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    badgeIcon: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    badgeName: {
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
