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
  useColorScheme,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { theme } from '@/constants/Theme';
import { BlurView } from 'expo-blur';
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

export default function ProfileScreen() {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const currentTheme = theme[colorScheme];
  const userContext = useContext(MyUserContext) as User | null;
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [publicPins, setPublicPins] = useState<VoicePin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useSharedValue(0);

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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      {/* Dynamic Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Image
          source={{ uri: avatarUri }}
          style={styles.headerImage}
          blurRadius={Platform.OS === 'ios' ? 0 : 10}
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
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={currentTheme.colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topSpace} />
        
        {/* Profile Info Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={styles.profileCard}>
           {/* Avatar Overlay */}
           <Animated.View style={[styles.avatarContainer, avatarStyle]}>
             <Image source={{ uri: avatarUri }} style={styles.avatar} />
             <View style={[styles.levelBadge, { backgroundColor: currentTheme.colors.primary }]}>
               <Text style={styles.levelText}>Lv.{level}</Text>
             </View>
           </Animated.View>

           <View style={styles.mainInfo}>
              <View style={styles.nameSection}>
                <Text style={[styles.nameText, { color: currentTheme.colors.text }]}>{displayName}</Text>
                {/* {profile?.verified && ( */}
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" style={{ marginLeft: 6 }} />
                {/* )} */}
              </View>
              <Text style={[styles.usernameText, { color: currentTheme.colors.icon }]}>@{profile?.username || userContext?.username}</Text>
              
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
                <TouchableOpacity 
                  onPress={() => router.push('/(tabs)/profile/edit-profile')}
                  style={[styles.editButton, { backgroundColor: currentTheme.colors.primary }]}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push('/(tabs)/profile/settings')}
                  style={[styles.settingsButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                >
                  <Ionicons name="settings-outline" size={22} color={currentTheme.colors.text} />
                </TouchableOpacity>
              </View>
           </View>
        </Animated.View>

        {/* Recent Activities Section */}
        <View style={styles.contentSection}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Hoạt động gần đây</Text>
          
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
                        Đã đăng một bản ghi mới
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
              <Ionicons name="footsteps-outline" size={48} color={currentTheme.colors.icon + '40'} />
              <Text style={[styles.emptyText, { color: currentTheme.colors.icon }]}>Chưa có hoạt động nào</Text>
            </View>
          )}
        </View>

        {/* Placeholder for "Old Code" effectively commented out by being replaced */}
        {/*
          Old implementation featured a fullscreen avatar header with a different layout.
          If needed, parts of the old stats and carousels can be re-integrated into the contentSection.
        */}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  scrollContent: {
    paddingBottom: 40,
  },
  topSpace: {
    height: HEADER_HEIGHT * 0.4,
  },
  profileCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    backgroundColor: '#eee',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
  },
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
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  mainInfo: {
    width: '100%',
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.8,
  },
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  activityList: {
    gap: 12,
  },
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
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  activityTime: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
  },
});
