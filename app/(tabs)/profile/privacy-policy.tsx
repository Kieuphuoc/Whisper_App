import React from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';

export default function PrivacyPolicyScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();

    const policies = [
        {
            title: "1. Thông tin chúng tôi thu thập",
            content: "Chúng tôi thu thập các bản ghi âm giọng nói (Voice Pins), tọa độ địa lý, thông tin hồ sơ (tên hiển thị, avatar) và dữ liệu tương tác để cung cấp dịch vụ mạng xã hội dựa trên bản đồ."
        },
        {
            title: "2. Cách chúng tôi sử dụng dữ liệu",
            content: "Dữ liệu vị trí được sử dụng để gắn Voice Pins của bạn lên bản đồ. Giọng nói của bạn được lưu trữ để người dùng khác (theo thiết lập riêng tư của bạn) có thể nghe và tương tác."
        },
        {
            title: "3. Quyền kiểm soát của bạn",
            content: "Bạn có quyền tùy chỉnh ai có thể thấy Voice Pins và vị trí của mình (Công khai, Bạn bè, hoặc Chỉ mình tôi). Bạn có thể xóa bất kỳ nội dung nào bạn đã tạo ra bất cứ lúc nào."
        },
        {
            title: "4. Bảo mật dữ liệu",
            content: "Whispery cam kết bảo vệ dữ liệu cá nhân của bạn bằng các biện pháp kỹ thuật hiện đại. Chúng tôi không bao giờ bán dữ liệu giọng nói hoặc vị trí cá nhân của bạn cho bên thứ ba."
        },
        {
            title: "5. Chia sẻ thông tin",
            content: "Thông tin của bạn chỉ được chia sẻ với người dùng khác dựa trên các thiết lập riêng tư mà bạn đã chọn trong ứng dụng."
        }
    ];

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Chính sách bảo mật" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#3b82f6', marginBottom: 20 }}>Privacy Policy</Text>
                
                {policies.map((policy, index) => (
                    <View key={index} className="mb-8">
                        <Text style={{ fontSize: 18, fontWeight: '700', color: colorScheme === 'dark' ? '#f3f4f6' : '#111', marginBottom: 8 }}>
                            {policy.title}
                        </Text>
                        <Text style={{ fontSize: 15, lineHeight: 24, color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563' }}>
                            {policy.content}
                        </Text>
                    </View>
                ))}

                <View className="mt-4 mb-10 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
                        Cập nhật lần cuối: 25 tháng 03, 2026
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
