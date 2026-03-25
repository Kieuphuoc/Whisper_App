import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar, Linking, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';

export default function SupportScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const faqs = [
        {
            q: "Làm thế nào để thay đổi ảnh đại diện?",
            a: "Truy cập Cài đặt > Sửa hồ sơ > Chạm vào ảnh đại diện để tải lên ảnh mới từ thư viện của bạn."
        },
        {
            q: "Ai có thể nghe VoicePin của tôi?",
            a: "Tùy thuộc vào cài đặt riêng tư của VoicePin. Nó có thể là Công khai, Chỉ bạn bè, hoặc Chỉ mình bạn."
        },
        {
            q: "Làm sao để tôi xóa tài khoản?",
            a: "Quyền riêng tư > Kiểm tra quyền riêng tư > Kéo xuống cuối trang và chọn Xóa tài khoản."
        }
    ];

    const toggleFaq = (index: number) => {
        if (faqOpen === index) setFaqOpen(null);
        else setFaqOpen(index);
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Hỗ trợ & Phản hồi" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111', marginBottom: 12 }}>Câu hỏi thường gặp</Text>
                
                <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-2 mb-8 border border-gray-100 dark:border-gray-800">
                    {faqs.map((faq, index) => (
                        <View key={index} className={`border-b border-gray-200 dark:border-gray-800 ${index === faqs.length - 1 ? 'border-b-0' : ''}`}>
                            <TouchableOpacity 
                                className="flex-row justify-between items-center py-4 px-2"
                                onPress={() => toggleFaq(index)}
                            >
                                <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colorScheme === 'dark' ? '#f3f4f6' : '#1f2937' }}>{faq.q}</Text>
                                <Ionicons name={faqOpen === index ? "chevron-up" : "chevron-down"} size={20} color="#9ca3af" />
                            </TouchableOpacity>
                            {faqOpen === index && (
                                <Text style={{ fontSize: 14, color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563', paddingHorizontal: 8, paddingBottom: 16, lineHeight: 22 }}>
                                    {faq.a}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>

                <Text style={{ fontSize: 18, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111', marginBottom: 12 }}>Liên hệ với chúng tôi</Text>
                
                <TouchableOpacity 
                    className="flex-row items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-xl mb-4 border border-gray-100 dark:border-gray-800"
                    onPress={() => Linking.openURL('mailto:kieuphuoc.411@gmail.com')}
                >
                    <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mr-4">
                        <Ionicons name="mail" size={20} color="#7ea000" />
                    </View>
                    <View className="flex-1">
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#f3f4f6' : '#111' }}>Gửi Email</Text>
                        <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }}>kieuphuoc.411@gmail.com</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-xl mb-8 border border-gray-100 dark:border-gray-800"
                    onPress={() => Linking.openURL('tel:0947262532')}
                >
                    <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-4">
                        <Ionicons name="call" size={20} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#f3f4f6' : '#111' }}>Gọi Hotline</Text>
                        <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }}>0947262532 (8h - 17h)</Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}
