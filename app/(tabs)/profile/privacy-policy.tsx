import React from 'react';
import { ScrollView, View, StatusBar } from 'react-native';
import { Text } from '@/components/ui/text';
import { PageHeader } from '@/components/ui/PageHeader';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
    const { colorScheme } = useColorScheme();

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <PageHeader title="Chính sách bảo mật" subtitle="Cam kết bảo vệ dữ liệu của bạn" />
            
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <View className="mb-8">
                    <View className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-900/30 items-center justify-center mb-4">
                        <Ionicons name="shield-checkmark" size={32} color="#7ea000" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quyền riêng tư của bạn là ưu tiên hàng đầu</Text>
                    <Text className="text-gray-600 dark:text-gray-400 leading-6">
                        Tại Whisper, chúng tôi hiểu rằng giọng nói và vị trí là những dữ liệu nhạy cảm. Chúng tôi cam kết bảo vệ sự riêng tư của bạn thông qua các biện pháp kỹ thuật tiên tiến.
                    </Text>
                </View>

                <View className="space-y-6">
                    <PolicySection 
                        icon="location"
                        title="Bảo mật vị trí (Location Obfuscation)"
                        content="Tọa độ của bạn không bao giờ được công khai chính xác. Hệ thống áp dụng thuật toán 'Location Fuzzing' để làm mờ vị trí của bạn trong bán kính an toàn. Kể cả quản trị viên hệ thống cũng chỉ thấy được vùng vị trí xấp xỉ, không bao giờ thấy được địa chỉ chính xác của bạn."
                    />

                    <PolicySection 
                        icon="mic"
                        title="Dữ liệu giọng nói"
                        content="Các đoạn ghi âm được lưu trữ dưới dạng mã hóa trên hạ tầng đám mây an toàn. Chúng tôi chỉ sử dụng AI để kiểm duyệt nội dung tự động nhằm đảm bảo môi trường lành mạnh, không có sự can thiệp thủ công từ con người trừ khi có báo cáo vi phạm nghiêm trọng."
                    />

                    <PolicySection 
                        icon="eye-off"
                        title="Chế độ ẩn danh"
                        content="Bạn có toàn quyền chọn đăng bài dưới tên thật hoặc ẩn danh. Khi chọn ẩn danh, mọi thông tin định danh sẽ được gỡ bỏ khỏi bài đăng đối với những người dùng khác."
                    />

                    <PolicySection 
                        icon="shield"
                        title="Quyền kiểm soát"
                        content="Bạn có thể xóa bài đăng của mình bất cứ lúc nào. Khi bạn xóa, dữ liệu âm thanh và hình ảnh sẽ được gỡ bỏ hoàn toàn khỏi máy chủ của chúng tôi trong vòng 24 giờ."
                    />
                </View>

                <View className="mt-10 p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <Text className="text-gray-500 dark:text-gray-400 text-sm text-center italic">
                        "Chúng tôi xây dựng Whisper dựa trên niềm tin. Dữ liệu của bạn thuộc về bạn, không phải của chúng tôi."
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

function PolicySection({ icon, title, content }: { icon: any, title: string, content: string }) {
    return (
        <View className="flex-row mb-8">
            <View className="mt-1 mr-4">
                <Ionicons name={icon} size={24} color="#7ea000" />
            </View>
            <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</Text>
                <Text className="text-gray-600 dark:text-gray-400 leading-6">{content}</Text>
            </View>
        </View>
    );
}
