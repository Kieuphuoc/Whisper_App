import React from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar, Image, Linking, Switch } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';

import { SettingTabHeader } from '@/components/profile/SettingTabHeader';

export default function AboutScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();

    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Về chúng tôi" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <View className="items-center mt-8 mb-4">
                    <View className="w-40 h-40 mb-4">
                        <Image
                            source={require('@/assets/images/mascot_whispery.png')}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Whispery</Text>
                    <Text style={{ fontSize: 16, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: -4 }}>Phiên bản 1.0.0</Text>
                </View>

                <View className="px-4 mb-8">
                    <Text style={{ fontSize: 15, lineHeight: 24, color: colorScheme === 'dark' ? '#d1d5db' : '#4b5563', textAlign: 'center' }}>
                        <Text style={{ fontWeight: '700', color: '#7ea000' }}>Whispery</Text> là nền tảng mạng xã hội âm thanh gắn với bản đồ, nơi mỗi giọng nói là một mảnh ký ức.
                        {"\n\n"}
                        Chúng tôi tin rằng giọng nói là phương tiện chân thực nhất để kết nối cảm xúc và lưu giữ những khoảnh khắc tại chính nơi chúng được sinh ra. Với tính năng "Voice Pin", bạn có thể gắn những đoạn ghi âm vào tọa độ địa lý, tạo nên một bản đồ ký ức sống động của riêng bạn và cộng đồng.
                    </Text>
                </View>

                <View className="bg-white dark:bg-gray-950 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-6">
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800"
                        onPress={() => router.push('/(tabs)/profile/terms')}
                    >
                        <Text style={{ fontSize: 16, color: colorScheme === 'dark' ? '#f3f4f6' : '#111' }}>Điều khoản sử dụng</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800"
                        onPress={() => router.push('/(tabs)/profile/privacy-policy')}
                    >
                        <Text style={{ fontSize: 16, color: colorScheme === 'dark' ? '#f3f4f6' : '#111' }}>Chính sách bảo mật</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-4"
                        onPress={() => router.push('/(tabs)/profile/guidelines')}
                    >
                        <Text style={{ fontSize: 16, color: colorScheme === 'dark' ? '#f3f4f6' : '#111' }}>Nguyên tắc cộng đồng</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                <View className="items-center mt-8">
                    <Text style={{ fontSize: 14, color: colorScheme === 'dark' ? '#6b7280' : '#9ca3af', textAlign: 'center' }}>
                        © 2026 Whisper Inc. {"\n"}All rights reserved.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
