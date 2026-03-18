import { authApis, endpoints } from '@/configs/Apis';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các thông tin');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            await api.put(endpoints.changePassword, {
                oldPassword,
                newPassword,
            });

            Alert.alert('Thành công', 'Mật khẩu đã được thay đổi', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Change password error:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
            Alert.alert('Thất bại', message);
        } finally {
            setLoading(false);
        }
    };

    const InputField = ({ label, value, onChangeText, placeholder, secureKey }: any) => (
        <View className="mb-6">
            <Text className="text-gray-500 font-semibold mb-2 ml-1">{label}</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-1">
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    secureTextEntry={!showPassword[secureKey as keyof typeof showPassword]}
                    className="flex-1 py-3 text-[#1e293b]"
                />
                <TouchableOpacity
                    onPress={() => setShowPassword({ ...showPassword, [secureKey]: !showPassword[secureKey as keyof typeof showPassword] })}
                >
                    <Ionicons
                        name={showPassword[secureKey as keyof typeof showPassword] ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#94a3b8"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            {/* Header */}
            <View className="pt-14 pb-4 px-6 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-[#1e293b]">Đổi mật khẩu</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(500)}>
                    <Text className="text-gray-400 mb-8 leading-6">
                        Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu của bạn cho người khác.
                    </Text>

                    <InputField
                        label="Mật khẩu hiện tại"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        placeholder="Nhập mật khẩu hiện tại"
                        secureKey="old"
                    />

                    <InputField
                        label="Mật khẩu mới"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Nhập mật khẩu mới"
                        secureKey="new"
                    />

                    <InputField
                        label="Xác nhận mật khẩu mới"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Nhập lại mật khẩu mới"
                        secureKey="confirm"
                    />

                    <TouchableOpacity
                        onPress={handleChangePassword}
                        disabled={loading}
                        className={`mt-10 py-5 rounded-3xl items-center shadow-lg shadow-primary-200 ${loading ? 'bg-gray-300' : 'bg-primary-500'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Cập nhật mật khẩu</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                <View className="h-20" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
