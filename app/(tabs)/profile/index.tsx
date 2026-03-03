import { authApis, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = ({ children, onPress, className, style }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} className={className}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
        className="w-full flex-row justify-center items-center"
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const userContext = useContext(MyUserContext) as User | null;
  const dispatch = useContext(MyDispatchContext);
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
        api.get(endpoints.userStats).catch(() => ({ data: {} })),
      ]);
      const profileData = pRes.data?.data ?? pRes.data;
      console.log('Profile Data:', profileData);
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
    if (!avatar) return 'https://i.pinimg.com/736x/8e/71/84/8e7184285e6b72a4f49492167d4f6696.jpg';
    if (avatar.startsWith('http')) return avatar;
    return `http://10.5.1.149:5000${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  };

  const displayName = profile?.displayName || profile?.username || userContext?.username || 'Sophie Bennett';
  const avatarUri = getAvatarUri(profile?.avatar);
  const bio = profile?.bio || 'Product Designer who focuses on simplicity & usability.';

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header with Settings Icon */}
      <View className="mt-8 px-6 flex-row justify-between items-center z-50">
        <Text className="text-xl font-bold opacity-0">Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/settings')}
          className="p-2"
        >
          <Ionicons name="settings-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
            tintColor="#8b5cf6"
          />
        }
        contentContainerClassName="pb-10 items-center"
      >
        <Animated.View
          entering={FadeInDown.duration(800).springify()}
          className="w-[90%] bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-black/10 border-8 border-[#f8fafc] mt-4"
        >
          {/* Large Image Section */}
          <View className="relative h-[480px]">
            <Image
              source={{ uri: avatarUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          {/* User Info Section */}
          <View className="p-8">
            <View className="flex-row items-center mb-3">
              <Text className="text-3xl font-bold text-[#1e293b] mr-2" numberOfLines={1}>{displayName}</Text>
              <View className="bg-green-600 rounded-full p-1 w-6 h-6 items-center justify-center">
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            </View>

            <Text className="text-lg text-gray-500 leading-6 mb-8">
              {bio}
            </Text>

            {/* Bottom Stats and Action */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-6">
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={20} color="#94a3b8" />
                  <Text className="ml-2 text-lg font-bold text-[#1e293b]">
                    {stats?.friendCount || 312}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="grid-outline" size={20} color="#94a3b8" />
                  <Text className="ml-2 text-lg font-bold text-[#1e293b]">
                    {stats?.voicePinCount || 48}
                  </Text>
                </View>
              </View>

              <AnimatedPressable
                className="bg-[#f1f5f9] px-6 py-4 rounded-[26px]"
                onPress={() => { }}
              >
                <Text className="text-[#1e293b] font-bold text-lg">Follow +</Text>
              </AnimatedPressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
