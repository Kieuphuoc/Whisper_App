import React from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';

export default function GuidelinesScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();

    const rules = [
        {
            title: "1. Sự chân thật (Authenticity)",
            content: "Hãy chia sẻ giọng nói của chính bạn. Chúng tôi khuyến khích sự chân thật và các cảm xúc cá nhân thực tế tại mỗi địa danh."
        },
        {
            title: "2. Tôn trọng cộng đồng",
            content: "Nghiêm cấm các đoạn ghi âm có nội dung thù ghét, phân biệt đối xử, quấy rối hoặc bôi nhọ người khác. Hãy giữ cho bản đồ của chúng ta là một nơi văn minh."
        },
        {
            title: "3. Nội dung nhạy cảm",
            content: "Tránh chia sẻ các thông tin quá nhạy cảm hoặc cá nhân hóa cao tại các địa điểm công cộng để bảo vệ an toàn cho chính bạn."
        },
        {
            title: "4. Spam và Quảng cáo",
            content: "Nghiêm cấm việc spam Voice Pins với mục đích quảng cáo hoặc quấy rối các vị trí trên bản đồ bằng nội dung không có ý nghĩa."
        },
        {
            title: "5. Phản hồi tích cực",
            content: "Khi tương tác với Voice Pins của người khác, hãy dùng ngôn từ (hoặc giọng nói) lịch sự và xây dựng."
        }
    ];

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Nguyên tắc cộng đồng" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#a855f7', marginBottom: 20 }}>Community Guidelines</Text>
                
                {rules.map((rule, index) => (
                    <View key={index} className="flex-row items-start mb-8">
                        <View className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center mr-4 mt-0.5">
                            <Text style={{ fontWeight: '800', color: '#a855f7' }}>{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colorScheme === 'dark' ? '#f3f4f6' : '#111', marginBottom: 6 }}>
                                {rule.title}
                            </Text>
                            <Text style={{ fontSize: 15, lineHeight: 24, color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563' }}>
                                {rule.content}
                            </Text>
                        </View>
                    </View>
                ))}

                <View className="mt-4 mb-10 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colorScheme === 'dark' ? '#d8b4fe' : '#7e22ce', textAlign: 'center' }}>
                        Cảm ơn bạn đã đồng hành cùng Whispery trong việc xây dựng một bản đồ ký ức âm thanh tuyệt vời.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
