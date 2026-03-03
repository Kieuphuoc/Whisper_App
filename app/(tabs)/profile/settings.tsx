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
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SettingsScreen() {
    const router = useRouter();
    const userContext = useContext(MyUserContext) as User | null;
    const dispatch = useContext(MyDispatchContext);

    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [loading, setLoading] = useState(false);

    const logout = async () => {
        try {
            setLoading(true);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            if (dispatch) dispatch({ type: 'LOGOUT' });
            router.replace('/(auth)/login');
        } catch (e) {
            console.error('Logout failed', e);
        } finally {
            setLoading(false);
        }
    };

    const getAvatarUri = (avatar?: string) => {
        if (!avatar) return 'https://i.pinimg.com/736x/8e/71/84/8e7184285e6b72a4f49492167d4f6696.jpg';
        if (avatar.startsWith('http')) return avatar;
        return `http://10.5.1.149:5000${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    };

    const displayName = userContext?.displayName || userContext?.username || 'Emily Bennett';
    const avatarUri = getAvatarUri(userContext?.avatar);

    const SettingItem = ({ icon, label, onPress, showArrow = true, children }: any) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            className="flex-row items-center justify-between py-4"
        >
            <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name={icon} size={20} color="#1e293b" />
                </View>
                <Text className="text-lg font-semibold text-[#1e293b]">{label}</Text>
            </View>
            {children ? children : (showArrow && <Ionicons name="chevron-forward" size={20} color="#94a3b8" />)}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="pt-14 pb-4 px-6 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-[#1e293b]">Settings</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                {/* General Settings Group */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <View className="bg-[#f8fafc] rounded-3xl p-6 mb-8">
                        <Text className="text-gray-400 font-bold uppercase tracking-wider mb-4">General Settings</Text>

                        {/* User Profile Summary */}
                        <TouchableOpacity className="flex-row items-center mb-6">
                            <Image
                                source={{ uri: avatarUri }}
                                className="w-16 h-16 rounded-full mr-4"
                            />
                            <View>
                                <Text className="text-xl font-bold text-[#1e293b]">{displayName}</Text>
                                <Text className="text-gray-400">Edit Your Profile</Text>
                            </View>
                            <View className="ml-auto w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                                <Ionicons name="chevron-up" size={16} color="#475569" />
                            </View>
                        </TouchableOpacity>

                        <View className="h-[1px] bg-gray-200 mb-2" />

                        <SettingItem icon="person-outline" label="Account Settings" />
                        <SettingItem icon="notifications-outline" label="Push Notifications" showArrow={false}>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#e2e8f0', true: '#1e293b' }}
                                thumbColor="#fff"
                            />
                        </SettingItem>
                        <SettingItem icon="moon-outline" label="Dark Mode" showArrow={false}>
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#e2e8f0', true: '#1e293b' }}
                                thumbColor="#fff"
                            />
                        </SettingItem>
                        <SettingItem icon="location-outline" label="Address Settings" />
                    </View>
                </Animated.View>

                {/* Other Options Group */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                    <View className="bg-white rounded-3xl mb-8">
                        <SettingItem icon="receipt-outline" label="Manage Subscription" />
                        <SettingItem icon="shield-checkmark-outline" label="Security" />
                        <SettingItem icon="gift-outline" label="Redeem a code" />
                        <SettingItem icon="chatbubble-ellipses-outline" label="Contact us" />
                        <SettingItem icon="log-out-outline" label="Log out" onPress={logout} />
                    </View>
                </Animated.View>

                <View className="h-20" />
            </ScrollView>

            {loading && (
                <View className="absolute inset-0 bg-white/50 justify-center items-center">
                    <ActivityIndicator size="large" color="#1e293b" />
                </View>
            )}
        </View>
    );
}
