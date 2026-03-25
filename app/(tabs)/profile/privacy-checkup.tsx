import React from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';

export default function PrivacyCheckupScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Quyền riêng tư" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <View className="items-center mt-4 mb-8">
                    <View className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mb-4">
                        <Ionicons name="shield-checkmark" size={40} color="#3b82f6" />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111', textAlign: 'center' }}>
                        Kiểm tra Quyền riêng tư
                    </Text>
                    <Text style={{ fontSize: 15, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', textAlign: 'center', marginTop: 8 }}>
                        Chúng tôi sẽ hướng dẫn bạn qua các bước để tùy chỉnh cài đặt sao cho phù hợp nhất.
                    </Text>
                </View>

                <TouchableOpacity 
                    className="flex-row items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800"
                    onPress={() => router.push('/(tabs)/profile/change-password')}
                >
                    <View className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mr-4">
                        <Ionicons name="key" size={24} color="#22c55e" />
                    </View>
                    <View className="flex-1">
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Bảo mật tài khoản</Text>
                        <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 2 }}>Đổi mật khẩu mạnh hơn</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800"
                    onPress={() => router.push('/(tabs)/profile/public-profile')}
                >
                    <View className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center mr-4">
                        <Ionicons name="people" size={24} color="#a855f7" />
                    </View>
                    <View className="flex-1">
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Khả năng hiển thị</Text>
                        <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 2 }}>Cài đặt ai có thể thấy nội dung của bạn</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800"
                    onPress={() => router.push('/(tabs)/profile/location-sharing')}
                >
                    <View className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 items-center justify-center mr-4">
                        <Ionicons name="location" size={24} color="#f43f5e" />
                    </View>
                    <View className="flex-1">
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Cài đặt vị trí</Text>
                        <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 2 }}>Quản lý quyền chia sẻ vị trí của bạn</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800"
                    onPress={() => router.push('/(tabs)/profile/activity-status')}
                >
                    <View className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center mr-4">
                        <Ionicons name="eye" size={24} color="#d97706" />
                    </View>
                    <View className="flex-1">
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Trạng thái hoạt động</Text>
                        <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 2 }}>Ẩn/hiện trạng thái đang online của bạn</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}
