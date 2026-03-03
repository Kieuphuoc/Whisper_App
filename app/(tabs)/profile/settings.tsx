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

    const displayName = userContext?.displayName || userContext?.username || 'Người dùng';
    const avatarUri = getAvatarUri(userContext?.avatar);

    const SettingItem = ({ icon, label, onPress, showArrow = true, children, textColor = "#1e293b" }: any) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            className="flex-row items-center justify-between py-4"
        >
            <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name={icon} size={20} color={textColor === "#ef4444" ? "#ef4444" : "#1e293b"} />
                </View>
                <Text style={{ color: textColor }} className="text-lg font-semibold">{label}</Text>
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
                <Text className="text-2xl font-bold text-[#1e293b]">Cài đặt</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                {/* User Profile Summary */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/profile/edit-profile')}
                        className="flex-row items-center bg-[#f8fafc] rounded-3xl p-5 mb-6 border border-gray-100"
                    >
                        <Image
                            source={{ uri: avatarUri }}
                            className="w-16 h-16 rounded-full mr-4 border-2 border-white"
                        />
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-[#1e293b]">{displayName}</Text>
                            <Text className="text-gray-400">Chỉnh sửa hồ sơ của bạn</Text>
                        </View>
                        <View className="w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm">
                            <Ionicons name="chevron-forward" size={16} color="#475569" />
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* General Settings Group */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                    <View className="mb-8">
                        <Text className="text-gray-400 font-bold uppercase tracking-wider mb-2 ml-1">Cài đặt chung</Text>
                        <View className="bg-white border border-gray-100 rounded-3xl px-4 py-2 shadow-sm shadow-gray-200">
                            <SettingItem
                                icon="time-outline"
                                label="Lịch sử nghe"
                                onPress={() => router.push('/(tabs)/profile/history')}
                            />
                            <View className="h-[1px] bg-gray-50 mx-2" />
                            <SettingItem
                                icon="lock-closed-outline"
                                label="Đổi mật khẩu"
                                onPress={() => router.push('/(tabs)/profile/change-password')}
                            />
                            <View className="h-[1px] bg-gray-50 mx-2" />
                            <SettingItem icon="notifications-outline" label="Thông báo đẩy" showArrow={false}>
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: '#e2e8f0', true: '#1e293b' }}
                                    thumbColor="#fff"
                                />
                            </SettingItem>
                            <View className="h-[1px] bg-gray-50 mx-2" />
                            <SettingItem icon="moon-outline" label="Chế độ tối" showArrow={false}>
                                <Switch
                                    value={darkMode}
                                    onValueChange={setDarkMode}
                                    trackColor={{ false: '#e2e8f0', true: '#1e293b' }}
                                    thumbColor="#fff"
                                />
                            </SettingItem>
                        </View>
                    </View>
                </Animated.View>

                {/* Support & Other Options Group */}
                <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                    <View className="mb-8">
                        <Text className="text-gray-400 font-bold uppercase tracking-wider mb-2 ml-1">Hỗ trợ & Khác</Text>
                        <View className="bg-white border border-gray-100 rounded-3xl px-4 py-2 shadow-sm shadow-gray-200">
                            <SettingItem icon="shield-checkmark-outline" label="Bảo mật & Quyền riêng tư" />
                            <View className="h-[1px] bg-gray-50 mx-2" />
                            <SettingItem icon="chatbubble-ellipses-outline" label="Liên hệ với chúng tôi" />
                            <View className="h-[1px] bg-gray-50 mx-2" />
                            <SettingItem icon="help-circle-outline" label="Trung tâm trợ giúp" />
                            <View className="h-[1px] bg-gray-50 mx-2" />
                            <SettingItem
                                icon="log-out-outline"
                                label="Đăng xuất"
                                onPress={logout}
                                showArrow={false}
                                textColor="#ef4444"
                            />
                        </View>
                    </View>
                </Animated.View>

                <View className="items-center mb-10">
                    <Text className="text-gray-300 text-sm">Phiên bản 1.0.0</Text>
                </View>

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
