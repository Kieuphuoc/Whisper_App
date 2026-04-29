import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { theme } from '@/constants/Theme';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useMemo, useContext, useCallback } from 'react';
import { MyDispatchContext } from '@/configs/Context';
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
    Share,
    ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VoicePin } from '@/types';
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
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import VoicePinCarousel from '@/components/memory/VoicePinCarousel';
import VoicePinTurntable from '@/components/home/VoicePinCard';
import FriendsModal from '@/components/FriendsModal';

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


export default function ProfileScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const dispatch = useContext(MyDispatchContext);

    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingImage, setUpdatingImage] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeTab, setActiveTab] = useState<'voices' | 'achievements' | 'discovered'>('voices');
    const [myVoices, setMyVoices] = useState<VoicePin[]>([]);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [discoveredVoices, setDiscoveredVoices] = useState<any[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);
    const [friendsVisible, setFriendsVisible] = useState(false);

    const scrollY = useSharedValue(0);
    const shimmerProgress = useSharedValue(0);
    const buttonGlow = useSharedValue(0);


    const EMPTY_STATS = {
        totalListens: 0,
        voicePinCount: 0,
        friendCount: 0,
        discoveredVoicesCount: 0,
    };

    const EMPTY_USER: User = {
        id: 0,
        username: "User",
        displayName: "User",
        level: 1,
        xp: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bio: "",
        avatar: "",
    };

    const fetchData = async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setStats(EMPTY_STATS);
                setUser(EMPTY_USER);
                return;
            }
            const api = authApis(token);

            const [uRes, sRes] = await Promise.all([
                api.get(endpoints.userMe).catch(() => ({ data: { data: EMPTY_USER } })),
                api.get(endpoints.meStats).catch(() => ({ data: { data: EMPTY_STATS } })),
            ]);

            const userData = uRes.data?.data || EMPTY_USER;
            setUser(userData);
            setStats(sRes.data?.data || EMPTY_STATS);

            if (dispatch) {
                dispatch({ type: 'SET_USER', payload: userData });
                await AsyncStorage.setItem('user', JSON.stringify(userData));
            }

            // Fetch current tab data
            fetchTabData(activeTab, token);
        } catch (e) {
            console.error('Fetch profile error:', e);
            setStats(EMPTY_STATS);
            setUser(EMPTY_USER);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchTabData = async (tab: string, token: string | null = null) => {
        setTabLoading(true);
        try {
            const authToken = token || await AsyncStorage.getItem('token');
            if (!authToken) return;
            const api = authApis(authToken);

            if (tab === 'voices') {
                const res = await api.get(endpoints.voicePublicByUser(user?.id || 'me'));
                setMyVoices(res.data?.data || []);
            } else if (tab === 'achievements') {
                const res = await api.get(endpoints.myAchievements);
                setAchievements(res.data?.data || []);
            } else if (tab === 'discovered') {
                const res = await api.get(endpoints.myDiscovered);
                setDiscoveredVoices(res.data?.data || []);
            }
        } catch (e) {
            console.error(`Fetch ${tab} error:`, e);
        } finally {
            setTabLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && user) {
            fetchTabData(activeTab);
        }
    }, [activeTab]);

    const fetchUnreadCount = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const res = await api.get(endpoints.notificationsUnread);
            setUnreadCount(res.data?.unreadCount || 0);
        } catch (e) {
            console.error('Fetch unread count error:', e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
        }, [])
    );

    useEffect(() => {
        fetchData();

        // Start the periodic shimmer animation (every 6 seconds)
        shimmerProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withDelay(4500, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );

        // Start a subtle periodic glow (every 10 seconds)
        buttonGlow.value = withRepeat(
            withSequence(
                withDelay(8000, withTiming(1, { duration: 1000 })),
                withTiming(0, { duration: 1000 })
            ),
            -1,
            false
        );
    }, []);

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

    const handleUpdateImage = async (type: 'avatar' | 'cover') => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Quyền truy cập', 'Bạn cần cho phép truy cập thư viện ảnh để thay đổi ảnh.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: type === 'avatar',
            aspect: type === 'avatar' ? [1, 1] : [9, 16],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            setUpdatingImage(true);
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;
                const api = authApis(token);

                const formData = new FormData();
                const uri = result.assets[0].uri;
                const fileName = uri.split('/').pop() || 'image.jpg';
                const mimeMatch = /\.(\w+)$/.exec(fileName);
                const fileType = mimeMatch ? `image/${mimeMatch[1].toLowerCase()}` : 'image/jpeg';

                formData.append(type, {
                    uri,
                    name: fileName,
                    type: fileType,
                } as any);

                const endpoint = type === 'avatar' ? endpoints.userAvatar : endpoints.userCover;
                const res = await api.put(endpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const updatedUser = res.data?.data;
                if (dispatch && updatedUser) {
                    dispatch({ type: 'SET_USER', payload: updatedUser });
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }
                fetchData(true);
            } catch (e: any) {
                console.error('Update image error:', e);
                Alert.alert('Lỗi', e.response?.data?.message || 'Không thể cập nhật ảnh.');
            } finally {
                setUpdatingImage(false);
            }
        }
    };

    const handleShareProfile = async () => {
        try {
            await Share.share({
                message: `Khám phá hồ sơ của mình trên Whispery! @${user?.username}`,
                url: `https://whispery.app/user/${user?.username}`, // Mock URL for now
            });
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
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
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <FriendsModal visible={friendsVisible} onClose={() => setFriendsVisible(false)} />

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
                {/* Overlay to ensure readability */}
                <LinearGradient
                    colors={isDark ?
                        ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)'] :
                        ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.7)']}
                    locations={[0, 0.4, 0.7, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* FLOATING ACTION BUTTON FOR COVER */}
            <TouchableOpacity
                onPress={() => handleUpdateImage('cover')}
                style={styles.floatingEditAura}
                activeOpacity={0.8}
            >
                <MotiView
                    from={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1000, type: 'spring' }}
                >
                    <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.editAuraBlur, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}>
                        <LinearGradient
                            colors={isDark ? ['rgba(255,255,255,0.1)', 'transparent'] : ['rgba(0,0,0,0.05)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <Ionicons name="sparkles" size={16} color={isDark ? "#fff" : currentTheme.colors.primary} />
                        <Text style={[styles.editAuraText, { color: isDark ? "#fff" : currentTheme.colors.text }]}>Đổi Aura</Text>
                    </BlurView>
                </MotiView>
            </TouchableOpacity>

            {/* FLOATING NOTIFICATION BUTTON */}
            <TouchableOpacity
                onPress={() => router.push('/(tabs)/notification')}
                style={styles.floatingNotification}
                activeOpacity={0.8}
            >
                <MotiView
                    from={{ scale: 0.9, opacity: 0, translateX: -20 }}
                    animate={{ scale: 1, opacity: 1, translateX: 0 }}
                    transition={{ delay: 1100, type: 'spring' }}
                >
                    <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.notiBlur, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}>
                        <LinearGradient
                            colors={isDark ? ['rgba(255,255,255,0.1)', 'transparent'] : ['rgba(255,255,255,0.5)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                        />
                        <Ionicons name="notifications-outline" size={22} color={isDark ? "#fff" : currentTheme.colors.primary} />

                        {unreadCount > 0 && (
                            <MotiView
                                from={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={styles.badge}
                            >
                                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                            </MotiView>
                        )}
                    </BlurView>
                </MotiView>
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
                            style={[styles.avatarOuter, { borderColor: isDark ? '#fff' : '#1a1a1a' }]}
                        >
                            <TouchableOpacity onPress={() => handleUpdateImage('avatar')} activeOpacity={0.9}>
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                                <MotiView
                                    from={{ rotate: '45deg', scale: 0 }}
                                    animate={{ rotate: '-35deg', scale: 1 }}
                                    transition={{ delay: 500, type: 'spring' }}
                                    style={[styles.levelCapsule, { backgroundColor: currentTheme.colors.primary }]}
                                >
                                    <Text style={styles.levelText}>XP {user.level || 1}</Text>
                                </MotiView>
                            </TouchableOpacity>
                        </MotiView>

                        {/* FLOATING STATS BUBBLES - STRANGE ASYMMETRIC LAYOUT */}
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

                            <TouchableOpacity
                                onPress={() => setFriendsVisible(true)}
                                activeOpacity={0.7}
                            >
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
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* GLASS VIBE SECTION */}
                    <View style={styles.glassRow}>
                        {[
                            { icon: "time-outline", label: joinDate }
                        ].map((item, i) => (
                            <MotiView
                                key={i}
                                from={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 700 + i * 150 }}
                                style={[styles.glassStrangeCard, {
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                                }]}
                            >
                                <BlurView intensity={isDark ? 30 : 20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                                <Ionicons name={item.icon as any} size={14} color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'} />
                                <Text style={[styles.glassStrangeText, { fontSize: 15, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }]}>{item.label}</Text>
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
                                <Text style={[styles.glassDisplayName, { color: isDark ? '#fff' : currentTheme.colors.text }]}>
                                    {user.displayName || user.username}
                                </Text>
                                <Text style={[styles.glassUsername, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>@{user.username}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/profile/edit-profile')}
                                activeOpacity={0.7}
                            >
                                <MotiView
                                    from={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 900, type: 'spring' }}
                                    style={[styles.glassEditButton, { borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.1)' }]}
                                >
                                    <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                                    <LinearGradient
                                        colors={isDark ? ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)'] : ['rgba(0,0,0,0.05)', 'transparent']}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    <Ionicons name="pencil-outline" size={18} color={isDark ? "#fff" : currentTheme.colors.text} />
                                </MotiView>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.bioBox}>
                            <Text style={[styles.glassBioText, { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }]}>
                                {user.bio || 'Khám phá thế giới qua những âm thanh ẩn giấu.'}
                            </Text>
                        </View>

                        <View style={styles.actionGrid}>
                            <TouchableOpacity
                                onPress={handleShareProfile}
                                style={styles.glassMainButton}
                                activeOpacity={0.9}
                            >
                                {/* PERIODIC GLOW EFFECT */}
                                <Animated.View
                                    style={[
                                        {
                                            ...StyleSheet.absoluteFillObject,
                                            backgroundColor: currentTheme.colors.primary,
                                            borderRadius: 20,
                                            // filter: 'blur(15px)' // filter is not supported in style object directly sometimes depending on RN version, using simpler glow
                                        } as any,
                                        glowStyle,
                                    ]}
                                />

                                <LinearGradient
                                    colors={['#7c3aed', '#4338ca']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />

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
                                    <MotiView
                                        from={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 10 }}
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                    >
                                        <Ionicons name="share-social" size={20} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.mainActionText}>Chia sẻ</Text>
                                    </MotiView>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/profile/settings')}
                                style={[styles.glassSettingsButton, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }]}
                                activeOpacity={0.7}
                            >
                                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={isDark ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'] : ['rgba(0,0,0,0.05)', 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                />
                                <Ionicons name="settings-outline" size={20} color={isDark ? "#fff" : currentTheme.colors.text} />
                            </TouchableOpacity>
                        </View>
                    </MotiView>

                    {/* Hiding Level Bar temporarily as requested */}
                    {/* <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 500 }}
                        style={[styles.levelProgressContainer, {
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                            borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)',
                        }]}
                    >
                        <BlurView intensity={isDark ? 10 : 5} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                        <View style={{ padding: 20 }}>
                            <View style={styles.levelHeader}>
                                <Text style={[styles.levelLabel, { color: isDark ? '#fff' : currentTheme.colors.text }]}>Level {user.level || 1}</Text>
                                <Text style={[styles.xpText, { color: isDark ? 'rgba(255,255,255,0.6)' : currentTheme.colors.textMuted }]}>{user.xp || 0} / {((user.level || 1) * 1000)} XP</Text>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                <MotiView
                                    from={{ width: '0%' }}
                                    animate={{ width: `${Math.min(100, ((user.xp || 0) / ((user.level || 1) * 1000)) * 100)}%` }}
                                    transition={{ type: 'timing', duration: 1000, easing: Easing.out(Easing.quad) }}
                                    style={[styles.progressBarFill, { backgroundColor: currentTheme.colors.primary }]}
                                >
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.3)', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                </MotiView>
                            </View>
                        </View>
                    </MotiView> */}

                    {/* NEW: CONTENT FEED TABS */}
                    <View style={[styles.tabHeaderContainer, {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                        borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)'
                    }]}>
                        <BlurView intensity={isDark ? 10 : 5} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                        <View style={styles.tabHeader}>
                            {[
                                { id: 'voices', icon: 'mic', label: 'VoicePin' },
                                { id: 'discovered', icon: 'compass', label: 'AR đã khám phá' },
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

                    {/* TAB CONTENT */}
                    <View style={styles.tabContent}>
                        {tabLoading ? (
                            <ActivityIndicator size="small" color={currentTheme.colors.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <>
                                {activeTab === 'voices' && (
                                    <MotiView
                                        from={{ opacity: 0, translateY: 10 }}
                                        animate={{ opacity: 1, translateY: 0 }}
                                        transition={{ type: 'timing' }}
                                        key="voices"
                                    >
                                        <VoicePinCarousel
                                            pins={myVoices}
                                            onSelectPin={(p) => setSelectedPin(p)}
                                            currentTheme={currentTheme}
                                            emptyText="Bạn chưa có VoicePin nào"
                                            fallbackAuraUrl={coverUri}
                                        />
                                    </MotiView>
                                )}

                                {activeTab === 'discovered' && (
                                    <MotiView
                                        from={{ opacity: 0, translateY: 10 }}
                                        animate={{ opacity: 1, translateY: 0 }}
                                        transition={{ type: 'timing' }}
                                        key="discovered"
                                    >
                                        <VoicePinCarousel
                                            pins={discoveredVoices?.map(d => d.voicePin) || []}
                                            onSelectPin={(p) => setSelectedPin(p)}
                                            currentTheme={currentTheme}
                                            emptyText="Bạn chưa khám phá được AR nào"
                                            icon="sparkles"
                                            iconColor="#f59e0b"
                                            fallbackAuraUrl={coverUri}
                                        />
                                    </MotiView>
                                )}

                                {activeTab === 'achievements' && (
                                    <MotiView
                                        from={{ opacity: 0, translateY: 10 }}
                                        animate={{ opacity: 1, translateY: 0 }}
                                        transition={{ type: 'timing' }}
                                        key="achievements"
                                    >
                                        <View style={styles.achievementsGrid}>
                                            {achievements.length > 0 ? achievements.map((item) => {
                                                // Map to mascot icons
                                                let mascotIcon = { uri: item.achievement?.iconUrl };
                                                const name = item.achievement?.name || "";
                                                if (name.includes("Lời nói đầu tiên")) mascotIcon = MASCOT_ICONS.first_voice;
                                                else if (name.includes("sưu tầm")) mascotIcon = MASCOT_ICONS.voice_collector;
                                                else if (name.includes("bạn") || name.toLowerCase().includes("giao thiệp")) mascotIcon = MASCOT_ICONS.social_butterfly;
                                                else if (name.includes("thám hiểm")) mascotIcon = MASCOT_ICONS.explorer;
                                                else if (name.includes("bình luận")) mascotIcon = MASCOT_ICONS.commenter;
                                                else if (name.includes("phổ biến")) mascotIcon = MASCOT_ICONS.popular_voice;

                                                return (
                                                    <MotiView
                                                        key={item.achievementId}
                                                        from={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        style={styles.achievementBadge}
                                                    >
                                                        <View style={[styles.badgeIconBg, { backgroundColor: currentTheme.colors.primary + '20' }]}>
                                                            <Image source={mascotIcon} style={styles.badgeIcon} />
                                                        </View>
                                                        <Text style={[styles.badgeName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                                                            {item.achievement?.name}
                                                        </Text>
                                                    </MotiView>
                                                );
                                            }) : (
                                                <View style={styles.emptyContainer}>
                                                    <Ionicons name="trophy-outline" size={48} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} />
                                                    <Text style={[styles.emptyText, { color: currentTheme.colors.textMuted }]}>Tiếp tục khám phá để nhận thưởng</Text>
                                                </View>
                                            )}
                                        </View>
                                    </MotiView>
                                )}
                            </>
                        )}
                    </View>
                </Animated.View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {updatingImage && (
                <View style={StyleSheet.absoluteFill}>
                    <View style={styles.overlay} />
                    <ActivityIndicator size="large" color="#fff" style={styles.absCenter} />
                </View>
            )}

            {selectedPin && (
                <View style={StyleSheet.absoluteFill}>
                    <VoicePinTurntable
                        pin={selectedPin!}
                        onClose={() => setSelectedPin(null)}
                    />
                </View>
            )}
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
    floatingEditAura: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 1000,
        overflow: 'hidden',
        borderRadius: 20,
    },
    editAuraBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    editAuraText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
    floatingNotification: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 1000,
    },
    notiBlur: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ef4444',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
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
    glassEditButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        elevation: 10,
        shadowColor: 'rgba(255,255,255,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
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
    levelProgressContainer: {
        borderRadius: 24,
        marginBottom: 35,
        borderWidth: 1.5,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    levelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 10,
    },
    levelLabel: {
        fontSize: 18,
        fontWeight: '900',
    },
    xpText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
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
    voicesGrid: {
        gap: 12,
    },
    voiceMiniCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    voiceContent: {
        fontSize: 15,
        fontWeight: '700',
    },
    voiceDate: {
        fontSize: 12,
        marginTop: 2,
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
        width: 80,
        height: 80,
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
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    absCenter: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -15 }, { translateY: -15 }] },
});
