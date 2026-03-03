import { authApis, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { User } from '@/types';
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
  Dimensions
} from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const userContext = useContext(MyUserContext) as User | null;
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const api = authApis(token);
      const [pRes, sRes] = await Promise.all([
        api.get(endpoints.userMe),
        api.get(endpoints.meStats).catch(() => ({ data: {} })),
      ]);
      const profileData = pRes.data?.data ?? pRes.data;
      setProfile(profileData);
      setStats(sRes.data?.data ?? sRes.data ?? {});
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

  const getAvatarUri = (avatar?: string) => {
    if (!avatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
    if (avatar.startsWith('http')) return avatar;
    return `http://10.5.1.149:5000${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  };

  // Combine local state with userContext for reliable avatar data
  const currentAvatar = profile?.avatar || userContext?.avatar;
  const displayName = profile?.displayName || profile?.username || userContext?.displayName || userContext?.username || 'User';
  const avatarUri = getAvatarUri(currentAvatar);
  const bio = profile?.bio || userContext?.bio || 'Chưa có tiểu sử';
  const level = profile?.level || userContext?.level || 1;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
            tintColor="#8b5cf6"
          />
        }
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Full Screen Image Header */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Top Icons Overlay */}
          <View style={styles.topIconsRow}>
            <View style={styles.levelBadge}>
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
            colors={['transparent', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,1)']}
            style={styles.gradientOverlay}
          >
            <Animated.View
              entering={FadeInDown.duration(600).springify()}
              style={styles.infoContent}
            >
              <View style={styles.nameRow}>
                <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              </View>

              <Text style={styles.bioText}>
                {bio}
              </Text>

              {/* Inline Stats */}
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

                <TouchableOpacity
                  style={styles.followButton}
                  onPress={() => router.push('/(tabs)/profile/settings')}
                >
                  <Text style={styles.followButtonText}>Follow +</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Extra Information Below Hero */}
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
              <Text style={styles.extraStatValue}>{profile?.xp || userContext?.xp || 0}</Text>
              <Text style={styles.extraStatLabel}>XP</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileFull}
            onPress={() => router.push('/(tabs)/profile/settings')}
          >
            <Text style={styles.editProfileFullText}>Chỉnh sửa hồ sơ công khai</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    width: width,
    height: height * 0.72,
    backgroundColor: '#f1f5f9',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topIconsRow: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
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
  infoContent: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginRight: 10,
  },
  verifiedBadge: {
    backgroundColor: '#10b981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioText: {
    fontSize: 17,
    color: '#475569',
    lineHeight: 26,
    marginBottom: 25,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsInline: {
    flexDirection: 'row',
    gap: 20,
  },
  statInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statInlineValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  followButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  extraSection: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  extraStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    paddingVertical: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  extraStatBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 5,
  },
  extraStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editProfileFull: {
    marginTop: 20,
    backgroundColor: '#1e293b',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  editProfileFullText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
