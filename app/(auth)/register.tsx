import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState, useContext } from 'react';
import { Image, StatusBar, Text, TextInput, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Apis, { endpoints } from '../../configs/Apis';
import { MyDispatchContext } from '../../configs/Context';

type UserRegister = {
    username?: string;
    password?: string;
    displayName?: string;
};

type InfoField = {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    secureTextEntry: boolean;
    field: keyof UserRegister;
};

export default function RegisterScreen() {
    const [user, setUser] = useState<UserRegister>({});
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const dispatch = useContext(MyDispatchContext);
    const [msg, setMsg] = useState<string | null>(null);

    const info: InfoField[] = [
        {
            label: 'Tên hiển thị (Tùy chọn)',
            icon: 'person-outline',
            secureTextEntry: false,
            field: 'displayName',
        },
        {
            label: 'Username',
            icon: 'at-outline',
            secureTextEntry: false,
            field: 'username',
        },
        {
            label: 'Mật khẩu',
            icon: 'lock-closed-outline',
            secureTextEntry: true,
            field: 'password',
        },
    ];

    const setState = (value: string, field: keyof UserRegister) => {
        setUser({ ...user, [field]: value });
        if (msg) setMsg(null);
    };

    const validate = (): boolean => {
        if (!user?.username?.trim() || !user?.password?.trim()) {
            setMsg('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
            return false;
        }
        if (user.password.length < 6) {
            setMsg('Mật khẩu phải có ít nhất 6 ký tự!');
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        try {
            setLoading(true);

            // Using FormData as requested by previous implementation
            const formData = new FormData();
            formData.append('username', user.username!.trim());
            formData.append('password', user.password!.trim());
            if (user.displayName) {
                formData.append('displayName', user.displayName.trim());
            }

            const res = await Apis.post(endpoints['register'], formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const data = res.data;

            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));

            if (dispatch) {
                dispatch({ type: "SET_USER", payload: data.user });
            }

            Alert.alert("Thành công", "Chào mừng bạn gia nhập Whisper!");
            router.replace('/(tabs)/home');
        } catch (err: any) {
            console.error('Lỗi đăng ký:', err.response?.data?.message || err.message);
            const errorMsg = err.response?.data?.message || "Đăng ký không thành công. Vui lòng thử lại.";
            setMsg(errorMsg);
            Alert.alert("Thất bại", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-[#1a1a1a]">
            <StatusBar barStyle="light-content" />

            {/* Background Image */}
            <Image
                source={{ uri: 'https://i.pinimg.com/736x/8f/4f/83/8f4f836b45cae5270f1d717af7158070.jpg' }}
                className="absolute w-full h-full"
            />
            <BlurView intensity={20} className="absolute inset-0 bg-neutral-900/60" />

            {/* Content */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
                className="px-6"
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Section */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 rounded-full bg-white/95 justify-center items-center mb-5 shadow-violet-500/30 border-2 border-violet-500/20 elevation-12 overflow-hidden">
                        <Image
                            source={require('../../assets/images/logo.png')}
                            className="w-full h-full"
                        />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-2 shadow-black/50">Whisper of Memory</Text>
                    <Text className="text-base text-white/80 text-center shadow-black/50">Join our community today</Text>
                </View>

                {/* Register Form */}
                <View className="bento-container">
                    <View className="items-center mb-6">
                        <Text className="text-xl font-semibold text-neutral-900 mb-1">Create Account</Text>
                        <Text className="text-sm text-neutral-500 text-center">Sign up to start your journey</Text>
                    </View>

                    {info.map((i, index) => (
                        <View key={index} className="mb-4">
                            <View className="input-wrapper">
                                <Ionicons name={i.icon} size={20} color="#6b7280" className="mr-3" />
                                <TextInput
                                    className="flex-1 text-base text-neutral-900 py-1"
                                    value={user[i.field] || ''}
                                    onChangeText={(t) => setState(t, i.field)}
                                    placeholder={i.label}
                                    secureTextEntry={i.secureTextEntry && !showPassword}
                                    autoCapitalize="none"
                                    placeholderTextColor="#9ca3af"
                                />
                                {i.field === 'password' && (
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="p-1"
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#6b7280"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}

                    {/* Error Message Inline */}
                    {!!msg && (
                        <View className="flex-row items-center bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
                            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                            <Text className="ml-2 text-sm text-red-500 font-medium">{msg}</Text>
                        </View>
                    )}

                    {/* Register Button */}
                    <TouchableOpacity
                        className={`primary-button mt-2 ${loading ? 'opacity-70 bg-violet-400' : ''}`}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="person-add-outline" size={20} color="white" />
                                <Text className="ml-2 text-base font-semibold text-white">Sign Up</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View className="flex-row justify-center items-center mt-6">
                        <Text className="text-sm text-neutral-500">Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text className="text-sm font-bold text-violet-500">Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
