import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { theme } from '@/constants/Theme';
import { User, VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
    Extrapolate,
} from 'react-native-reanimated';
import { MotiView, MotiText } from 'moti';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.4;

const formatDate = (dateStr: string | Date) => {
    try {
        const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch (e) {
        return typeof dateStr === 'string' ? dateStr : '';
    }
};

export default function ProfileScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [publicPins, setPublicPins] = useState<VoicePin[]>([]);
    const [updatingImage, setUpdatingImage] = useState(false);

    const scrollY = useSharedValue(0);

    const fetchData = async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);

            const [uRes, sRes, vRes] = await Promise.all([
                api.get(endpoints.userMe),
                api.get(endpoints.meStats),
                api.get(endpoints.voicePublicByUser('me')).catch(() => ({ data: { data: [] } })),
            ]);

            setUser(uRes.data?.data);
            setStats(sRes.data?.data);
            setPublicPins(vRes.data?.data || []);
        } catch (e) {
            console.error('Fetch profile error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            allowsEditing: true,
            aspect: type === 'avatar' ? [1, 1] : [16, 9],
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
                const fileType = result.assets[0].type || 'image/jpeg';

                formData.append(type, {
                    uri,
                    name: fileName,
                    type: fileType,
                } as any);

                const endpoint = type === 'avatar' ? endpoints.userAvatar : endpoints.userCover;
                await api.put(endpoint, formData);
                fetchData(true);
            } catch (e: any) {
                console.error('Update image error:', e);
                Alert.alert('Lỗi', e.response?.data?.message || 'Không thể cập nhật ảnh.');
            } finally {
                setUpdatingImage(false);
            }
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

    const signatureVibe = useMemo(() => {
        if (!publicPins || publicPins.length === 0) return 'Tần số lặng';
        const emotions = publicPins.map(p => p.emotionLabel).filter(Boolean);
        if (emotions.length === 0) return 'Tần số lặng';
        const counts = emotions.reduce((acc: any, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {});
        const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        
        const labels: any = {
            'HAPPY': 'Rạng rỡ',
            'SAD': 'U sầu',
            'LOVE': 'Nồng nàn',
            'ANGRY': 'Bùng nổ',
            'WOW': 'Kinh ngạc',
            'LAUGH': 'Hân hoan',
            'NEUTRAL': 'Bình thản'
        };
        return labels[dominant.toUpperCase()] || dominant;
    }, [publicPins]);

    const joinDate = useMemo(() => {
        if (!user?.createdAt) return 'Vô định';
        const date = new Date(user.createdAt);
        return `Phát tín hiệu: ${date.getMonth() + 1}/${date.getFullYear()}`;
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

            {/* ASYMMETRIC BANNER */}
            <Animated.View style={[styles.bannerContainer, bannerAnim]}>
                {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.bannerImage} />
                ) : (
                    <LinearGradient
                        colors={[currentTheme.colors.primary, currentTheme.colors.icon + '40', currentTheme.colors.background]}
                        style={styles.bannerPlaceholder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MotiView
                            from={{ opacity: 0.3, scale: 0.8 }}
                            animate={{ opacity: 0.6, scale: 1.2 }}
                            transition={{ loop: true, duration: 4000, type: 'timing' }}
                            style={styles.nebula}
                        />
                    </LinearGradient>
                )}
                
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', isDark ? currentTheme.colors.background : 'rgba(255,255,255,0.9)', currentTheme.colors.background]}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* FLOATING ACTION BUTTON FOR COVER - MOVED ABOVE SCROLLVIEW FOR CLICKABILITY */}
            <TouchableOpacity 
                onPress={() => handleUpdateImage('cover')}
                style={[styles.bannerEditIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
            >
                <Ionicons name="sparkles-outline" size={20} color={isDark ? "#fff" : currentTheme.colors.text} />
                <MotiText 
                    from={{ opacity: 0, translateX: 10 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    style={[styles.bannerEditText, { color: isDark ? "#fff" : currentTheme.colors.text }]}
                >
                    Đổi Aura
                </MotiText>
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
                <View style={styles.topGap} />

                {/* AVATAR & ASYMMETRIC NAME PANEL */}
                <Animated.View style={[styles.profileContent, contentAnim]}>
                    <View style={styles.avatarRow}>
                        <MotiView
                            from={{ scale: 0, rotate: '-15deg' }}
                            animate={{ scale: 1, rotate: '0deg' }}
                            transition={{ type: 'spring', delay: 100 }}
                            style={styles.avatarOuter}
                        >
                            <TouchableOpacity onPress={() => handleUpdateImage('avatar')}>
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                                <View style={[styles.levelCapsule, { backgroundColor: currentTheme.colors.primary }]}>
                                    <Text style={styles.levelText}>Lvl.{user.level || 1}</Text>
                                </View>
                            </TouchableOpacity>
                        </MotiView>

                        {/* FLOATING STATS BUBBLES - STRANGE ASYMMETRIC LAYOUT */}
                        <View style={styles.bubblesContainer}>
                            <MotiView
                                from={{ scale: 0, translateX: 20 }}
                                animate={{ scale: 1, translateX: 0 }}
                                transition={{ delay: 300 }}
                                style={[styles.statBubble, styles.bubbleLarge, { backgroundColor: currentTheme.colors.primary + '30' }]}
                            >
                                <Text style={[styles.bubbleValue, { color: currentTheme.colors.text }]}>{stats?.totalListens || 0}</Text>
                                <Text style={[styles.bubbleLabel, { color: currentTheme.colors.icon }]}>Listens</Text>
                            </MotiView>
                            
                            <MotiView
                                from={{ scale: 0, translateY: 20 }}
                                animate={{ scale: 1, translateY: 0 }}
                                transition={{ delay: 450 }}
                                style={[styles.statBubble, styles.bubbleMedium, { backgroundColor: currentTheme.colors.secondary + '30', bottom: -10, left: -40 }]}
                            >
                                <Text style={[styles.bubbleValueSmall, { color: currentTheme.colors.text }]}>{stats?.voicePinCount || 0}</Text>
                                <Text style={[styles.bubbleLabelSmall, { color: currentTheme.colors.icon }]}>Voices</Text>
                            </MotiView>

                            <MotiView
                                from={{ scale: 0, translateY: -20 }}
                                animate={{ scale: 1, translateY: 0 }}
                                transition={{ delay: 600 }}
                                style={[styles.statBubble, styles.bubbleSmall, { backgroundColor: '#10b98130', right: -15, top: -20 }]}
                            >
                                <Text style={[styles.bubbleValueSmall, { color: currentTheme.colors.text }]}>{stats?.friendCount || 0}</Text>
                                <Text style={[styles.bubbleLabelSmall, { color: currentTheme.colors.icon }]}>Friends</Text>
                            </MotiView>
                        </View>
                    </View>

                    {/* STRANGE NEW SECTIONS 4, 5, 7 */}
                    <View style={styles.unconventionalRow}>
                        <MotiView 
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 700 }}
                            style={[styles.strangeCard, { backgroundColor: currentTheme.colors.primary + '15' }]}
                        >
                            <Ionicons name="search" size={16} color={currentTheme.colors.primary} />
                            <Text style={[styles.strangeText, { color: currentTheme.colors.text }]}>
                                {stats?.discoveredVoicesCount || 0} Dị thường
                            </Text>
                        </MotiView>
                        
                        <MotiView 
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 850 }}
                            style={[styles.strangeCard, { backgroundColor: currentTheme.colors.secondary + '15' }]}
                        >
                            <Ionicons name="pulse" size={16} color={currentTheme.colors.secondary} />
                            <Text style={[styles.strangeText, { color: currentTheme.colors.text }]}>
                                Vibe: {signatureVibe}
                            </Text>
                        </MotiView>

                        <MotiView 
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1000 }}
                            style={[styles.strangeCard, { backgroundColor: currentTheme.colors.icon + '15' }]}
                        >
                            <Ionicons name="time-outline" size={16} color={currentTheme.colors.icon} />
                            <Text style={[styles.strangeText, { color: currentTheme.colors.icon }]}>
                                {joinDate}
                            </Text>
                        </MotiView>
                    </View>

                    {/* TILTED NAME CARD */}
                    <MotiView 
                        from={{ opacity: 0, translateX: -50 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ delay: 200 }}
                        style={[styles.nameCard, { transform: [{ rotate: '-1.5deg' }], backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}
                    >
                        <Text style={[styles.displayName, { color: currentTheme.colors.text }]}>{user.displayName || user.username}</Text>
                        <Text style={[styles.username, { color: currentTheme.colors.icon }]}>@{user.username}</Text>
                        
                        <View style={styles.bioBox}>
                            <Text style={[styles.bioText, { color: currentTheme.colors.text }]}>
                                {user.bio || 'Tìm kiếm giai điệu của tâm hồn trong từng tần số âm thanh.'}
                            </Text>
                        </View>

                        <View style={styles.actionGrid}>
                            <TouchableOpacity 
                                onPress={() => router.push('/(tabs)/profile/edit-profile')}
                                style={[styles.pillButton, { backgroundColor: currentTheme.colors.primary }]}
                            >
                                <Ionicons name="options-outline" size={20} color="#fff" />
                                <Text style={styles.pillButtonText}>Tinh chỉnh</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => router.push('/(tabs)/profile/settings')}
                                style={[styles.pillButton, { borderColor: currentTheme.colors.icon + '40', borderWidth: 1 }]}
                            >
                                <Ionicons name="settings-outline" size={20} color={currentTheme.colors.icon} />
                            </TouchableOpacity>
                        </View>
                    </MotiView>
                </Animated.View>

                {/* BRUTALIST LIST OF ACTIVITIES */}
                <View style={styles.activitySection}>
                    <Text style={[styles.sectionHeading, { color: currentTheme.colors.text }]}>Tần số rò rỉ</Text>
                    
                    {publicPins && publicPins.length > 0 ? (
                        <View style={styles.listContainer}>
                            {publicPins.map((pin, index) => (
                                <MotiView
                                    key={pin.id}
                                    from={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 800 + index * 100 }}
                                    style={[styles.brutalistCard, { borderColor: currentTheme.colors.icon + '20', backgroundColor: currentTheme.colors.background }]}
                                >
                                    <TouchableOpacity 
                                        onPress={() => router.push({ pathname: '/(tabs)/home/voiceDetail', params: { id: pin.id.toString() } })}
                                        style={styles.cardInner}
                                    >
                                        <View style={[styles.typeBadge, { backgroundColor: currentTheme.colors.primary }]}>
                                            <Text style={styles.badgeText}>PIN</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.pinContent, { color: currentTheme.colors.text }]} numberOfLines={1}>
                                                {pin.content || 'Hidden Frequencies'}
                                            </Text>
                                            <Text style={[styles.pinMeta, { color: currentTheme.colors.icon }]}>
                                                {formatDate(pin.createdAt)}
                                            </Text>
                                        </View>
                                        <Ionicons name="play-circle-outline" size={32} color={currentTheme.colors.primary} />
                                    </TouchableOpacity>
                                </MotiView>
                            ))}
                        </View>
                    ) : (
                        <MotiView style={styles.emptyState}>
                            <Ionicons name="pulse" size={48} color={currentTheme.colors.icon + '20'} />
                            <Text style={{ color: currentTheme.colors.icon, marginTop: 12 }}>Chưa có dao động nào được ghi lại</Text>
                        </MotiView>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {updatingImage && (
                <View style={StyleSheet.absoluteFill}>
                    <View style={styles.overlay} />
                    <ActivityIndicator size="large" color="#fff" style={styles.absCenter} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bannerContainer: {
        width,
        height: BANNER_HEIGHT,
        position: 'absolute',
        top: 0,
        zIndex: 0,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    nebula: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.2)',
        top: -50,
        left: -50,
    },
    bannerEditIcon: {
        position: 'absolute',
        top: 60,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        zIndex: 1000,
        elevation: 10,
    },
    bannerEditText: { fontSize: 13, fontWeight: '700', marginLeft: 8 },
    scrollContent: { paddingBottom: 40 },
    topGap: { height: BANNER_HEIGHT * 0.7 },
    profileContent: { paddingHorizontal: 24, zIndex: 10 },
    avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
    avatarOuter: {
        width: 130,
        height: 130,
        borderRadius: 40,
        borderWidth: 6,
        borderColor: '#fff',
        backgroundColor: '#eee',
        overflow: 'visible',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 34 },
    levelCapsule: {
        position: 'absolute',
        top: -10,
        left: -10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        transform: [{ rotate: '-10deg' }],
    },
    levelText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    bubblesContainer: { width: 150, height: 120, position: 'relative' },
    statBubble: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
        overflow: 'hidden',
    },
    bubbleLarge: { width: 85, height: 85, right: 0, top: 0 },
    bubbleMedium: { width: 65, height: 65 },
    bubbleSmall: { width: 45, height: 45 },
    bubbleValue: { fontSize: 20, fontWeight: '900' },
    bubbleLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    bubbleValueSmall: { fontSize: 14, fontWeight: '900' },
    bubbleLabelSmall: { fontSize: 8, fontWeight: '600' },
    unconventionalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    strangeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 6,
    },
    strangeText: { fontSize: 12, fontWeight: '700' },
    nameCard: {
        padding: 24,
        borderRadius: 32,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    displayName: { fontSize: 36, fontWeight: '900', letterSpacing: -1.5 },
    username: { fontSize: 18, fontWeight: '600', marginBottom: 20, opacity: 0.6 },
    bioBox: { marginBottom: 24 },
    bioText: { fontSize: 16, lineHeight: 24, fontWeight: '500', fontStyle: 'italic' },
    actionGrid: { flexDirection: 'row', gap: 12 },
    pillButton: {
        height: 52,
        borderRadius: 26,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    pillButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    activitySection: { paddingHorizontal: 24 },
    sectionHeading: { fontSize: 24, fontWeight: '900', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 2 },
    listContainer: { gap: 16 },
    brutalistCard: {
        borderWidth: 2,
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardInner: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    typeBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    pinContent: { fontSize: 17, fontWeight: '700' },
    pinMeta: { fontSize: 13, marginTop: 4, fontWeight: '500' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, opacity: 0.4 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    absCenter: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -15 }, { translateY: -15 }] },
});
