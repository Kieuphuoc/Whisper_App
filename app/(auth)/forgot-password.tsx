import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, StatusBar, TextInput, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import Apis, { endpoints } from '../../configs/Apis';

type Step = 'EMAIL' | 'CODE' | 'PASSWORD';

export default function ForgotPasswordScreen() {
    const [step, setStep] = useState<Step>('EMAIL');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const handleRequestCode = async () => {
        if (!email.trim() || !email.includes('@')) {
            setMsg('Vui lòng nhập email hợp lệ!');
            return;
        }

        try {
            setLoading(true);
            await Apis.post(endpoints.forgotPassword, { email: email.trim() });
            setStep('CODE');
            setMsg(null);
            Alert.alert("Thông báo", "Mã xác nhận đã được gửi đến email của bạn. (Vui lòng kiểm tra console backend nếu trong môi trường phát triển)");
        } catch (err: any) {
            setMsg(err.response?.data?.message || 'Có lỗi xảy ra khi gửi mã.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = () => {
        if (code.length !== 6) {
            setMsg('Mã xác nhận phải có 6 chữ số!');
            return;
        }
        setStep('PASSWORD');
        setMsg(null);
    };

    const handleResetPassword = async () => {
        if (password.length < 6) {
            setMsg('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }
        if (password !== confirmPassword) {
            setMsg('Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            setLoading(true);
            await Apis.post(endpoints.resetPassword, {
                email: email.trim(),
                code: code.trim(),
                newPassword: password.trim()
            });
            Alert.alert("Thành công", "Mật khẩu của bạn đã được cập nhật!");
            router.replace('/(auth)/login');
        } catch (err: any) {
            setMsg(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'EMAIL':
                return (
                    <View>
                        <View className="items-center mb-6">
                            <Text className="text-xl font-semibold text-neutral-900 mb-1">Quên mật khẩu?</Text>
                            <Text className="text-sm text-neutral-500 text-center">Nhập email của bạn để nhận mã khôi phục</Text>
                        </View>
                        <View className="input-wrapper mb-4">
                            <Ionicons name="mail-outline" size={20} color="#6b7280" className="mr-3" />
                            <TextInput
                                className="flex-1 text-base text-neutral-900 py-1"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email của bạn"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <TouchableOpacity
                            className={`primary-button ${loading ? 'opacity-70' : ''}`}
                            onPress={handleRequestCode}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Gửi mã xác nhận</Text>}
                        </TouchableOpacity>
                    </View>
                );
            case 'CODE':
                return (
                    <View>
                        <View className="items-center mb-6">
                            <Text className="text-xl font-semibold text-neutral-900 mb-1">Xác nhận mã</Text>
                            <Text className="text-sm text-neutral-500 text-center">Nhập mã 6 chữ số đã được gửi tới email của bạn</Text>
                        </View>
                        <View className="input-wrapper mb-4">
                            <Ionicons name="key-outline" size={20} color="#6b7280" className="mr-3" />
                            <TextInput
                                className="flex-1 text-base text-neutral-900 py-1"
                                value={code}
                                onChangeText={setCode}
                                placeholder="Mã xác nhận (6 số)"
                                keyboardType="number-pad"
                                maxLength={6}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <TouchableOpacity
                            className="primary-button"
                            onPress={handleVerifyCode}
                        >
                            <Text className="text-white font-bold">Tiếp tục</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep('EMAIL')} className="mt-4 items-center">
                            <Text className="text-sm text-violet-500 font-medium">Gửi lại mã?</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'PASSWORD':
                return (
                    <View>
                        <View className="items-center mb-6">
                            <Text className="text-xl font-semibold text-neutral-900 mb-1">Mật khẩu mới</Text>
                            <Text className="text-sm text-neutral-500 text-center">Vui lòng thiết lập mật khẩu mới cho tài khoản</Text>
                        </View>
                        <View className="input-wrapper mb-4">
                            <Ionicons name="lock-closed-outline" size={20} color="#6b7280" className="mr-3" />
                            <TextInput
                                className="flex-1 text-base text-neutral-900 py-1"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Mật khẩu mới"
                                secureTextEntry
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <View className="input-wrapper mb-6">
                            <Ionicons name="checkmark-circle-outline" size={20} color="#6b7280" className="mr-3" />
                            <TextInput
                                className="flex-1 text-base text-neutral-900 py-1"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Xác nhận mật khẩu mới"
                                secureTextEntry
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <TouchableOpacity
                            className={`primary-button ${loading ? 'opacity-70' : ''}`}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Đặt lại mật khẩu</Text>}
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-[#1a1a1a]"
        >
            <StatusBar barStyle="light-content" />

            <View 
                className="absolute w-full h-full bg-[#1a1a1a]" 
            />
            <BlurView intensity={20} className="absolute inset-0 bg-neutral-900/60" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                className="px-6"
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="absolute top-12 left-6 z-10 w-10 h-10 rounded-full bg-black/20 items-center justify-center border border-white/10"
                >
                    <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>

                <View className="bento-container pt-8">
                    {renderStep()}

                    {!!msg && (
                        <View className="flex-row items-center bg-red-50 rounded-xl p-3 mt-4 border border-red-200">
                            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                            <Text className="ml-2 text-sm text-red-500 font-medium">{msg}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
