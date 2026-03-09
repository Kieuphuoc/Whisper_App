import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { MyUserContext } from '@/configs/Context';
import { User, VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  useColorScheme
} from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { theme } from '@/constants/Theme';
import { MemoryCard } from '../memory/index';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const userContext = useContext(MyUserContext) as User | null;
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [publicPins, setPublicPins] = useState<VoicePin[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tapCount, setTapCount] = useState(0);
    const [showSurprise, setShowSurprise] = useState(false);

    const surpriseScale = useSharedValue(0);

    const surpriseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: surpriseScale.value }],
        opacity: surpriseScale.value,
    }));

    const fetchAll = async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const [pRes, sRes, vRes] = await Promise.all([
                api.get(endpoints.userMe),
                api.get(endpoints.meStats).catch(() => ({ data: {} })),
                api.get(endpoints.voicePublicByUser(userContext?.id || '')).catch(() => ({ data: { data: [] } })),
            ]);
            const profileData = pRes.data?.data ?? pRes.data;
            setProfile(profileData);
            setStats(sRes.data?.data ?? sRes.data ?? {});
            setPublicPins(vRes.data?.data || []);
        } catch (e) {
            console.error('Profile fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (tapCount === 0) return;

        const timer = setTimeout(() => {
            setTapCount(0);
        }, 500);

        if (tapCount === 3) {
            handleTripleTap();
            setTapCount(0);
        }

        return () => clearTimeout(timer);
    }, [tapCount]);

    const handleTripleTap = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSurprise(true);
        surpriseScale.value = withSequence(
            withSpring(1.5),
            withSpring(1),
            withDelay(2000, withTiming(0, { duration: 500 }, (finished) => {
                if (finished) {
                    // We can't set state directly here easily without runOnJS
                }
            }))
        );
        // Reset surprise state after animation
        setTimeout(() => setShowSurprise(false), 3000);
    };

    const handleAvatarPress = () => {
        setTapCount(prev => prev + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

  const getAvatarUri = (avatar?: string) => {
    if (!avatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
    if (avatar.startsWith('http')) return avatar;
    return `${BASE_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  };

  const currentAvatar = profile?.avatar || userContext?.avatar;
  const displayName = profile?.displayName || profile?.username || userContext?.displayName || userContext?.username || 'User';
  const avatarUri = getAvatarUri(currentAvatar);
  const bio = profile?.bio || userContext?.bio || 'Chưa có tiểu sử';
  const level = profile?.level || userContext?.level || 1;

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.colors.background }]}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
            tintColor={currentTheme.colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Full Screen Image Header */}
        <View style={[styles.heroContainer, { backgroundColor: currentTheme.colors.icon + '10' }]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleAvatarPress}
                        style={styles.heroImageContainer}
                    >
                        <MotiView
                            from={{ scale: 1 }}
                            animate={{ scale: 1.02 }}
                            transition={{
                                type: 'timing',
                                duration: 2000,
                                loop: true,
                                repeatReverse: true,
                            }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <Image
                                source={{ uri: avatarUri }}
                                style={styles.heroImage}
                                resizeMode="cover"
                            />
                        </MotiView>

                        {showSurprise && (
                            <Animated.View style={[styles.surpriseOverlay, surpriseStyle]}>
                                <Ionicons name="heart" size={100} color="#ff4d4d" />
                                <Text style={styles.surpriseText}>You found a secret! ✨</Text>
                            </Animated.View>
                        )}
                    </TouchableOpacity>

          {/* Top Icons Overlay */}
          <View style={styles.topIconsRow}>
            <View style={[styles.levelBadge, { backgroundColor: currentTheme.colors.primary, borderRadius: currentTheme.radius.full }]}>
              <Text style={styles.levelText}>Lv.{level}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile/settings')}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Info Gradient Area */}
          <LinearGradient
            colors={['transparent', currentTheme.colors.background + 'B3', currentTheme.colors.background]}
            style={styles.gradientOverlay}
          >
            <Animated.View
              entering={FadeInDown.duration(600).springify()}
              style={styles.infoContent}
            >
                            <View style={styles.nameRow}>
                                <Text style={[styles.nameText, { color: currentTheme.colors.text, fontSize: currentTheme.typography.fontSizes.h1 }]} numberOfLines={1}>
                                    {displayName}
                                </Text>
                                <View style={[styles.verifiedBadge, { backgroundColor: '#10b981', borderRadius: currentTheme.radius.full }]}>
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                            </View>

              <Text style={[styles.bioText, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.sm }]}>
                {bio}
              </Text>

                            <View style={styles.cardBottomRow}>
                                <View style={[styles.statsInline, { gap: currentTheme.spacing.lg }]}>
                                    <View style={[styles.statInlineItem, { gap: currentTheme.spacing.sm }]}>
                                        <Ionicons name="person-outline" size={20} color={currentTheme.colors.icon} />
                                        <Text style={[styles.statInlineValue, { color: currentTheme.colors.text, fontSize: 18 }]}>{stats?.friendCount || 0}</Text>
                                    </View>
                                    <View style={[styles.statInlineItem, { gap: currentTheme.spacing.sm }]}>
                                        <Ionicons name="mic-outline" size={20} color={currentTheme.colors.icon} />
                                        <Text style={[styles.statInlineValue, { color: currentTheme.colors.text, fontSize: 18 }]}>{stats?.voicePinCount || 0}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.followButton, { backgroundColor: currentTheme.colors.primary + '15', borderRadius: currentTheme.radius.full }]}
                                    onPress={() => router.push('/(tabs)/profile/edit-profile')}
                                >
                                    <Text style={[styles.followButtonText, { color: currentTheme.colors.primary, fontSize: 13 }]}>Chỉnh sửa</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </LinearGradient>
                </View>

        {/* Public Voice Pins Feed */}
        <View style={styles.feedSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text, fontSize: currentTheme.typography.fontSizes.lg }]}>Ký ức công khai</Text>
            <Text style={[styles.sectionCount, { color: currentTheme.colors.primary, backgroundColor: currentTheme.colors.primary + '15' }]}>
              {publicPins.length}
            </Text>
          </View>

          {publicPins.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            >
              {publicPins.map((pin) => (
                <MemoryCard
                  key={pin.id}
                  pin={pin}
                  onPress={() => router.push({ pathname: '/(tabs)/home/voiceDetail', params: { id: pin.id } })}
                  customWidth={width * 0.7}
                  customMarginRight={15}
                  currentTheme={currentTheme}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyFeed}>
              <Ionicons name="musical-notes-outline" size={48} color={currentTheme.colors.icon + '40'} />
              <Text style={[styles.emptyText, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.sm }]}>Chưa có ký ức công khai nào</Text>
            </View>
          )}
        </View>

        {/* Extra Information Below Hero */}
        <View style={[styles.extraSection, { paddingHorizontal: currentTheme.spacing.lg }]}>
          <View style={[styles.extraStatsRow, { backgroundColor: currentTheme.colors.icon + '08', borderRadius: currentTheme.radius.xl }]}>
            <View style={styles.extraStatBox}>
              <Text style={[styles.extraStatValue, { color: currentTheme.colors.text, fontSize: 22 }]}>{stats?.totalListens || 0}</Text>
              <Text style={[styles.extraStatLabel, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.xs }]}>Lượt nghe</Text>
            </View>
            <View style={[styles.extraStatBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: currentTheme.colors.icon + '10' }]}>
              <Text style={[styles.extraStatValue, { color: currentTheme.colors.text, fontSize: 22 }]}>{stats?.achievementCount || 0}</Text>
              <Text style={[styles.extraStatLabel, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.xs }]}>Thành tựu</Text>
            </View>
                        <View style={styles.extraStatBox}>
                            <Text style={[styles.extraStatValue, { color: currentTheme.colors.text, fontSize: 22 }]}>{profile?.xp || userContext?.xp || 0}</Text>
                            <Text style={[styles.extraStatLabel, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.xs }]}>XP</Text>
                        </View>
                    </View>

          <TouchableOpacity
            style={[styles.editProfileFull, { backgroundColor: currentTheme.colors.text, borderRadius: currentTheme.radius.lg }]}
            onPress={() => router.push('/(tabs)/profile/edit-profile')}
          >
            <Text style={[styles.editProfileFullText, { color: currentTheme.colors.background, fontSize: 15 }]}>Chỉnh sửa hồ sơ công khai</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    heroContainer: { width: width, height: height * 0.7 },
    heroImageContainer: { width: '100%', height: '100%' },
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
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
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
    nameText: { fontWeight: '800', marginRight: 10 },
    verifiedBadge: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bioText: { lineHeight: 22, marginBottom: 25 },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statsInline: { flexDirection: 'row', gap: 20 },
    statInlineItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statInlineValue: { fontWeight: '700' },
    followButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
    },
    followButtonText: { fontWeight: '800' },
    feedSection: { marginTop: 20 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        marginBottom: 15
    },
    sectionTitle: { fontWeight: '800' },
    sectionCount: {
        fontWeight: '700',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12
    },
    emptyFeed: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { marginTop: 10, fontWeight: '500' },
    extraSection: { marginTop: 10 },
    extraStatsRow: {
        flexDirection: 'row',
        paddingVertical: 25,
    },
    extraStatBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    extraStatValue: { fontWeight: '800', marginBottom: 5 },
    extraStatLabel: { fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    editProfileFull: {
        marginTop: 20,
        paddingVertical: 18,
        alignItems: 'center',
    },
    editProfileFullText: { fontWeight: '700' },
    surpriseOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    surpriseText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
        marginTop: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
});
