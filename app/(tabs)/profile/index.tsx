import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { MyUserContext } from '@/configs/Context';
import { User, VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  useColorScheme
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { theme } from '@/constants/Theme';
import VoicePinCarousel from '@/components/memory/VoicePinCarousel';
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

  useFocusEffect(
    useCallback(() => {
      fetchAll(true);
    }, [])
  );

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

  const currentAvatar = profile?.avatar || userContext?.avatar;
  const avatarUpdatedAt = profile?.updatedAt || userContext?.updatedAt || '';

  const avatarUri = useMemo(() => {
    if (!currentAvatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
    const uri = currentAvatar.startsWith('http') ? currentAvatar : `${BASE_URL}${currentAvatar.startsWith('/') ? '' : '/'}${currentAvatar}`;
    return avatarUpdatedAt ? `${uri}?t=${new Date(avatarUpdatedAt).getTime()}` : uri;
  }, [currentAvatar, avatarUpdatedAt]);

  const displayName = profile?.displayName || profile?.username || userContext?.displayName || userContext?.username || 'User';
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
            <View style={{ width: '100%', height: '100%' }}>
              <Image
                source={{ uri: avatarUri }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>

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
                <Text style={[styles.nameText, { color: currentTheme.colors.text, fontSize: 28 }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={[styles.verifiedBadge, { backgroundColor: '#10b981', borderRadius: currentTheme.radius.full }]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              </View>


              <Text style={[styles.bioText, { color: currentTheme.colors.icon, fontSize: 14 }]}>
                {bio}
              </Text>

              <View style={styles.cardBottomRow}>

                <View style={[styles.statsInline, { gap: currentTheme.spacing.lg }]}>
                  <View style={[styles.statInlineItem, { gap: currentTheme.spacing.sm }]}>
                    <Ionicons name="mic-outline" size={20} color={currentTheme.colors.icon} />
                    <Text style={[styles.statInlineValue, { color: currentTheme.colors.text, fontSize: 18 }]}>{stats?.voicePinCount || 0}</Text>
                  </View>
                  <View style={[styles.statInlineItem, { gap: currentTheme.spacing.sm }]}>
                    <Ionicons name="eye-outline" size={20} color={currentTheme.colors.icon} />
                    <Text style={[styles.statInlineValue, { color: currentTheme.colors.text, fontSize: 18 }]}>{stats?.totalListens || 0}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Gamification Stats Row */}
        <View style={styles.gamificationRow}>
          <View style={[styles.gamifyBox, { backgroundColor: currentTheme.colors.icon + '08' }]}>
            <Ionicons name="planet-outline" size={24} color={currentTheme.colors.primary} />
            <Text style={[styles.gamifyValue, { color: currentTheme.colors.text }]}>{stats?.discoveredHiddenCount || 0}</Text>
            <Text style={[styles.gamifyLabel, { color: currentTheme.colors.icon }]}>Hidden Voices</Text>
          </View>
          <View style={[styles.gamifyBox, { backgroundColor: currentTheme.colors.icon + '08' }]}>
            <Ionicons name="trophy-outline" size={24} color="#FBBF24" />
            <Text style={[styles.gamifyValue, { color: currentTheme.colors.text }]}>{stats?.achievementCount || 0}</Text>
            <Text style={[styles.gamifyLabel, { color: currentTheme.colors.icon }]}>Thành tựu</Text>
          </View>
          <View style={[styles.gamifyBox, { backgroundColor: currentTheme.colors.icon + '08' }]}>
            <Ionicons name="people-outline" size={24} color="#6366F1" />
            <Text style={[styles.gamifyValue, { color: currentTheme.colors.text }]}>{stats?.friendCount || 0}</Text>
            <Text style={[styles.gamifyLabel, { color: currentTheme.colors.icon }]}>Bạn bè</Text>
          </View>
        </View>

        {/* Public Voice Pins Feed */}
        <VoicePinCarousel
          title="Ký ức công khai"
          subtitle={`${publicPins.length} khoảnh khắc`}
          pins={publicPins}
          onSelectPin={(pin) => router.push({ pathname: '/(tabs)/home/voiceDetail', params: { id: pin.id } })}
          currentTheme={currentTheme}
          limit={5}
          onSeeAll={() => {}}
          emptyText="Chưa có ký ức công khai nào"
        />

        {/* Achievements Section */}
        {stats?.achievements && stats.achievements.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Thành tựu đạt được</Text>
              <TouchableOpacity><Text style={{ color: currentTheme.colors.primary }}>Xem tất cả</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {stats.achievements.map((item: any, idx: number) => (
                <View key={idx} style={[styles.achievementCard, { backgroundColor: currentTheme.colors.icon + '05' }]}>
                   <Image source={{ uri: item.icon }} style={styles.achievementIcon} />
                   <Text style={[styles.achievementName, { color: currentTheme.colors.text }]} numberOfLines={1}>{item.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Friends Network Section */}
        {stats?.friends && stats.friends.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Mạng lưới âm thanh</Text>
              <TouchableOpacity><Text style={{ color: currentTheme.colors.primary }}>{stats.friendCount} bạn</Text></TouchableOpacity>
            </View>
            <View style={styles.friendsList}>
              {stats.friends.slice(0, 5).map((friend: any, idx: number) => (
                <TouchableOpacity key={idx} style={styles.friendItem}>
                  <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                  <Text style={[styles.friendName, { color: currentTheme.colors.text }]} numberOfLines={1}>{friend.displayName || friend.username}</Text>
                </TouchableOpacity>
              ))}
              {stats.friendCount > 5 && (
                <TouchableOpacity style={styles.friendItem}>
                  <View style={[styles.friendAvatarPlaceholder, { backgroundColor: currentTheme.colors.icon + '20' }]}>
                    <Text style={{ color: currentTheme.colors.icon }}>+{stats.friendCount - 5}</Text>
                  </View>
                  <Text style={[styles.friendName, { color: currentTheme.colors.icon }]}>Xem tất cả</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  heroContainer: { width: width, height: height * 0.9 },
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
    height: height * 0.5,
    justifyContent: 'flex-end',
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  infoContent: { width: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
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
  gamificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    gap: 12,
  },
  gamifyBox: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 20,
  },
  gamifyValue: { fontSize: 20, fontWeight: '800', marginVertical: 4 },
  gamifyLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionContainer: { marginTop: 25 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  horizontalScroll: { paddingLeft: 25, paddingRight: 10 },
  achievementCard: {
    width: 100,
    padding: 12,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  achievementIcon: { width: 48, height: 48, marginBottom: 8, borderRadius: 24 },
  achievementName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  friendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 15,
  },
  friendItem: { width: (width - 40 - 45) / 4, alignItems: 'center' },
  friendAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 6 },
  friendAvatarPlaceholder: { width: 60, height: 60, borderRadius: 30, marginBottom: 6, justifyContent: 'center', alignItems: 'center' },
  friendName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
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
