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
const BANNER_HEIGHT = height * 0.45;

export default function OtherUserProfileScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
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
            await authApis(token).post(endpoints.friendRequest, { receiverId: Number(id) });
            setFriendStatus('pending_sent');
            Alert.alert('Thành công', 'Đã gửi lời mời kết bạn.');
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể gửi lời mời kết bạn.');
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
            const res = await authApis(token).post(endpoints.chatPrivate(id as string));
            const roomId = res.data?.data?.id || res.data?.id;
            if (roomId) {
                router.push({ pathname: '/chat/[id]', params: { id: roomId.toString() } });
            }
        } catch (e) {
            console.error('Chat error:', e);
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
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
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

                <View style={styles.profileContent}>
                    <View style={styles.avatarRow}>
                        <MotiView
                            from={{ scale: 0, rotate: '-15deg' }}
                            animate={{ scale: 1, rotate: '0deg' }}
                            transition={{ type: 'spring', damping: 15 }}
                            style={[styles.avatarOuter, { borderColor: '#fff' }]}
                        >
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            <View style={[styles.levelCapsule, { backgroundColor: currentTheme.colors.primary }]}>
                                <Text style={styles.levelText}>XP {user.level || 1}</Text>
                            </View>
                        </MotiView>

                        <View style={styles.bubblesContainer}>
                            <View style={[styles.statBubble, styles.bubbleLarge]}>
                                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(124, 58, 237, 0.3)' }]} />
                                <Text style={styles.bubbleValue}>{stats?.totalListens || 0}</Text>
                                <Text style={styles.bubbleLabel}>Listens</Text>
                            </View>
                            <View style={[styles.statBubble, styles.bubbleMedium, { bottom: -5, left: -35 }]}>
                                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(99, 102, 241, 0.3)' }]} />
                                <Text style={styles.bubbleValueMedium}>{stats?.voicePinCount || 0}</Text>
                                <Text style={styles.bubbleLabelMedium}>Voices</Text>
                            </View>
                            <View style={[styles.statBubble, styles.bubbleSmall, { right: -10, top: -35 }]}>
                                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16, 185, 129, 0.3)' }]} />
                                <Text style={styles.bubbleValueSmall}>{stats?.friendCount || 0}</Text>
                                <Text style={styles.bubbleLabelSmall}>Friends</Text>
                            </View>
                        </View>
                    </View>

                    <MotiView
                        from={{ opacity: 0, translateY: 40 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 300 }}
                        style={[styles.mainGlassCard, { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.2)' }]}
                    >
                        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.nameHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.glassDisplayName}>{user.displayName || user.username}</Text>
                                <Text style={styles.glassUsername}>@{user.username}</Text>
                            </View>
                        </View>

                        <View style={styles.bioBox}>
                            <Text style={styles.glassBioText}>
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
                                <View style={[styles.glassMainButton, { opacity: 0.7 }]}>
                                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                    <View style={styles.buttonInner}>
                                        <Ionicons name="time" size={20} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.mainActionText}>Đã gửi lời mời</Text>
                                    </View>
                                </View>
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

                    <View style={styles.tabHeaderContainer}>
                        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.tabHeader}>
                            {[
                                { id: 'voices', icon: 'mic', label: 'VoicePin' },
                                { id: 'achievements', icon: 'trophy', label: 'Thành tựu' }
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.id}
                                    onPress={() => setActiveTab(tab.id as any)}
                                    style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
                                >
                                    <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)'} />
                                    <Text style={[styles.tabLabel, { color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)' }]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.tabContent}>
                        {tabLoading ? (
                            <ActivityIndicator size="small" color="#fff" style={{ marginTop: 20 }} />
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
                                                    <View style={[styles.badgeIconBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                                        <Image source={mascotIcon} style={styles.badgeIcon} />
                                                    </View>
                                                    <Text style={styles.badgeName} numberOfLines={1}>{item.achievement?.name}</Text>
                                                </MotiView>
                                            );
                                        }) : (
                                            <View style={styles.emptyContainer}>
                                                <Ionicons name="trophy-outline" size={48} color="rgba(255,255,255,0.2)" />
                                                <Text style={styles.emptyText}>Chưa có thành tựu nào</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
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
    scrollContent: { paddingBottom: 40 },
    topEmptyGap: { height: BANNER_HEIGHT },
    profileContent: { paddingHorizontal: 20, marginTop: -60 },
    avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
    avatarOuter: { width: 120, height: 120, borderRadius: 30, borderWidth: 6, position: 'relative', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    avatar: { width: '100%', height: '100%', borderRadius: 24 },
    levelCapsule: { position: 'absolute', bottom: -10, right: -10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, elevation: 5 },
    levelText: { color: '#fff', fontWeight: '900', fontSize: 11 },
    bubblesContainer: { flex: 1, height: 120, marginLeft: 20, position: 'relative' },
    statBubble: { position: 'absolute', borderRadius: 50, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    bubbleLarge: { width: 85, height: 85, top: 0, right: 10 },
    bubbleMedium: { width: 65, height: 65 },
    bubbleSmall: { width: 55, height: 55 },
    bubbleValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
    bubbleLabel: { fontSize: 10, color: '#fff', fontWeight: '600', opacity: 0.8 },
    bubbleValueMedium: { fontSize: 16, fontWeight: '800', color: '#fff' },
    bubbleLabelMedium: { fontSize: 9, color: '#fff', fontWeight: '600', opacity: 0.8 },
    bubbleValueSmall: { fontSize: 14, fontWeight: '800', color: '#fff' },
    bubbleLabelSmall: { fontSize: 8, color: '#fff', fontWeight: '600', opacity: 0.8 },
    mainGlassCard: { padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 15, overflow: 'hidden' },
    nameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    glassDisplayName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    glassUsername: { fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
    bioBox: { marginTop: 15 },
    glassBioText: { fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
    actionGrid: { flexDirection: 'row', marginTop: 25, gap: 12 },
    glassMainButton: { flex: 1, height: 56, borderRadius: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    buttonInner: { flexDirection: 'row', alignItems: 'center' },
    mainActionText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    tabHeaderContainer: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginBottom: 15 },
    tabHeader: { flexDirection: 'row', padding: 6 },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 8 },
    activeTabItem: { backgroundColor: 'rgba(255,255,255,0.15)' },
    tabLabel: { fontSize: 13, fontWeight: '700' },
    tabContent: { minHeight: 200 },
    achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    achievementBadge: {
        width: (width - 64) / 3,
        alignItems: 'center',
        marginBottom: 15,
    },
    badgeIconBg: {
        width: 95,
        height: 95,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    badgeIcon: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    badgeName: {
        fontSize: 11,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginTop: 2,
    },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 14, textAlign: 'center' },
});
