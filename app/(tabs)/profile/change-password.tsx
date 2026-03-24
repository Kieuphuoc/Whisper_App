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
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';
import { SettingInput } from '@/components/profile/SettingInput';

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

    const PasswordToggle = ({ field }: { field: keyof typeof showPassword }) => (
        <TouchableOpacity
            onPress={() => setShowPassword({ ...showPassword, [field]: !showPassword[field] })}
        >
            <Ionicons
                name={showPassword[field] ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94a3b8"
            />
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white dark:bg-gray-950"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <SettingTabHeader title="Đổi mật khẩu" leftIcon="arrow-back" />

            <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(500)}>
                    <Text className="text-gray-400 mb-8 leading-6">
                        Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu của bạn cho người khác.
                    </Text>

                    <SettingInput
                        label="Mật khẩu hiện tại"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        placeholder="Nhập mật khẩu hiện tại"
                        secureTextEntry={!showPassword.old}
                        rightElement={<PasswordToggle field="old" />}
                    />

                    <SettingInput
                        label="Mật khẩu mới"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Nhập mật khẩu mới"
                        secureTextEntry={!showPassword.new}
                        rightElement={<PasswordToggle field="new" />}
                    />

                    <SettingInput
                        label="Xác nhận mật khẩu mới"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Nhập lại mật khẩu mới"
                        secureTextEntry={!showPassword.confirm}
                        rightElement={<PasswordToggle field="confirm" />}
                    />

                    <TouchableOpacity
                        onPress={handleChangePassword}
                        disabled={loading}
                        className={`mt-10 py-5 rounded-3xl items-center shadow-lg shadow-primary-500/20 ${loading ? 'bg-gray-300' : 'bg-primary-500'}`}
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
