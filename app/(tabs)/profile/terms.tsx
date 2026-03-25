import React from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';

export default function TermsScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();

    const sections = [
        {
            title: "1. Chấp nhận điều khoản",
            content: "Bằng cách truy cập và sử dụng ứng dụng Whispery, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều khoản sử dụng này. Nếu bạn không đồng ý, vui lòng ngừng sử dụng dịch vụ."
        },
        {
            title: "2. Quyền sở hữu nội dung",
            content: "Bạn giữ toàn quyền sở hữu đối với các bản ghi âm (Voice Pins) mà bạn tạo ra. Tuy nhiên, bằng cách chia sẻ chúng công khai, bạn cấp cho Whispery quyền không độc quyền để hiển thị nội dung đó trên bản đồ cho người dùng khác."
        },
        {
            title: "3. Trách nhiệm người dùng",
            content: "Bạn chịu trách nhiệm hoàn toàn về nội dung ghi âm của mình. Nghiêm cấm ghi âm các nội dung vi phạm pháp luật, quấy rối, đe dọa hoặc xâm phạm quyền riêng tư của người khác."
        },
        {
            title: "4. Dịch vụ vị trí",
            content: "Whispery dựa trên vị trí GPS để hoạt động. Bạn hiểu rằng độ chính xác của vị trí có thể phụ thuộc vào thiết bị và điều kiện môi trường."
        },
        {
            title: "5. Thay đổi điều khoản",
            content: "Chúng tôi có quyền cập nhật các điều khoản này bất kỳ lúc nào. Việc bạn tiếp tục sử dụng ứng dụng đồng nghĩa với việc chấp nhận các thay đổi đó."
        }
    ];

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Điều khoản sử dụng" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#7ea000', marginBottom: 20 }}>Whispery Terms</Text>
                
                {sections.map((section, index) => (
                    <View key={index} className="mb-8">
                        <Text style={{ fontSize: 18, fontWeight: '700', color: colorScheme === 'dark' ? '#f3f4f6' : '#111', marginBottom: 8 }}>
                            {section.title}
                        </Text>
                        <Text style={{ fontSize: 15, lineHeight: 24, color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563' }}>
                            {section.content}
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
