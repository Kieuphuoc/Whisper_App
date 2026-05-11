import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState, useContext } from 'react';
import { Image, StatusBar, TextInput, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/text';
import Apis, { endpoints } from '../../configs/Apis';
import { MyDispatchContext } from '../../configs/Context';

type UserRegister = {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    displayName?: string;
    avatar?: string;
};

type InfoField = {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    secureTextEntry: boolean;
    field: keyof UserRegister;
    keyboardType?: 'default' | 'email-address';
};

export default function RegisterScreen() {
    const [user, setUser] = useState<UserRegister>({});
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const dispatch = useContext(MyDispatchContext);
    const [msg, setMsg] = useState<string | null>(null);

    const info: InfoField[] = [
        {
            label: 'Tên hiển thị',
            icon: 'person-outline',
            secureTextEntry: false,
            field: 'displayName',
        },
        {
            label: 'Email',
            icon: 'mail-outline',
            secureTextEntry: false,
            field: 'email',
            keyboardType: 'email-address',
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
        {
            label: 'Xác nhận mật khẩu',
            icon: 'checkmark-circle-outline',
            secureTextEntry: true,
            field: 'confirmPassword',
        },
    ];

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setUser({ ...user, avatar: result.assets[0].uri });
        }
    };

    const setState = (value: string, field: keyof UserRegister) => {
        setUser({ ...user, [field]: value });
        if (msg) setMsg(null);
    };

    const validate = (): boolean => {
        if (!user?.username?.trim() || !user?.password?.trim() || !user?.email?.trim()) {
            setMsg('Vui lòng nhập đầy đủ thông tin bắt buộc!');
            return false;
        }
        if (!user.email.includes('@')) {
            setMsg('Email không hợp lệ!');
            return false;
        }
        if (user.password.length < 6) {
            setMsg('Mật khẩu phải có ít nhất 6 ký tự!');
            return false;
        }
        if (user.password !== user.confirmPassword) {
            setMsg('Mật khẩu xác nhận không khớp!');
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('username', user.username!.trim());
            formData.append('email', user.email!.trim());
            formData.append('password', user.password!.trim());
            if (user.displayName) {
                formData.append('displayName', user.displayName.trim());
            }

            if (user.avatar) {
                const filename = user.avatar.split('/').pop() || 'avatar.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                formData.append('avatar', {
                    uri: user.avatar,
                    name: filename,
                    type,
                } as any);
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-[#1a1a1a]"
        >
            <StatusBar barStyle="light-content" />

            <Image
                source={require('../../assets/images/background-for-login.jpg')}
                className="absolute w-full h-full"
                resizeMode="cover"
            />
            <BlurView intensity={10} className="absolute inset-0 bg-neutral-900/60" />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingVertical: 60 }}
                className="px-6"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View className="items-center mb-6">
                    <TouchableOpacity
                        onPress={pickImage}
                        className="relative"
                    >
                        <View className="w-24 h-24 rounded-3xl bg-white/10 justify-center items-center overflow-hidden border-2 border-white/20">
                            {user.avatar ? (
                                <Image source={{ uri: user.avatar }} className="w-full h-full" />
                            ) : (
                                <Image
                                    source={require('../../assets/images/avatar.png')}
                                    className="w-full h-full"
                                    resizeMode="contain"
                                />
                            )}
                        </View>
                        <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-500 rounded-full justify-center items-center border-2 border-[#1a1a1a]">
                            <Ionicons name="add" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-white mt-4" style={{ fontFamily: 'Quicksand_700Bold' }}>Tạo tài khoản</Text>
                    <Text className="text-sm text-white/60 mt-1">Bắt đầu hành trình khám phá Whisper</Text>
                </View>

                {/* Register Form */}
                <View className="bento-container pt-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
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
                                    keyboardType={i.keyboardType || 'default'}
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

                    {!!msg && (
                        <View className="flex-row items-center bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
                            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                            <Text className="ml-2 text-sm text-red-500 font-medium">{msg}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        className={`primary-button mt-4 ${loading ? 'opacity-70 bg-violet-400' : ''}`}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="person-add-outline" size={20} color="white" />
                                <Text className="ml-2 text-base font-semibold text-white">Đăng ký ngay</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center items-center mt-8">
                        <Text className="text-sm text-neutral-500">Đã có tài khoản? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text className="text-sm font-bold text-violet-500">Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
