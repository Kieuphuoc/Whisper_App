import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState, useContext } from 'react';
import { Image, StatusBar, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Apis, { endpoints } from '../../configs/Apis';
import { MyDispatchContext } from '../../configs/Context';

type UserLogin = {
  username?: string;
  password?: string;
};

type InfoField = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  secureTextEntry: boolean;
  field: keyof UserLogin;
};

export default function LoginScreen() {
  const [user, setUser] = useState<UserLogin>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useContext(MyDispatchContext);
  const [msg, setMsg] = useState<string | null>(null);

  const info: InfoField[] = [
    {
      label: 'Username',
      icon: 'person-outline',
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

  const setState = (value: string, field: keyof UserLogin) => {
    setUser({ ...user, [field]: value });
    if (msg) setMsg(null);
  };

  const validate = (): boolean => {
    if (!user?.username?.trim() || !user?.password?.trim()) {
      setMsg('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await Apis.post(endpoints['login'], {
        username: user.username.trim(),
        password: user.password.trim()
      });

      const data = res.data;

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      if (dispatch) {
        dispatch({ type: "SET_USER", payload: data.user });
      }

      Alert.alert("Thành công", "Chào mừng bạn quay trở lại Whisper!");
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err.message);
      const errorMsg = err.response?.data?.message || "Tài khoản hoặc mật khẩu không chính xác.";
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
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full bg-white/95 justify-center items-center mb-5 shadow-violet-500/30 border-2 border-violet-500/20 elevation-12 overflow-hidden">
            <Image
              source={require('../../assets/images/logo.png')}
              className="w-full h-full"
            />
          </View>
          <Text className="text-2xl font-bold text-white mb-2 shadow-black/50">Whisper of Memory</Text>
          <Text className="text-base text-white/80 text-center shadow-black/50">Capture moments through voice</Text>
        </View>

        {/* Login Form */}
        <View className="bento-container">
          <View className="items-center mb-6">
            <Text className="text-xl font-semibold text-neutral-900 mb-1">Welcome back</Text>
            <Text className="text-sm text-neutral-500 text-center">Sign in to continue your journey</Text>
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
          {msg && (
            <View className="flex-row items-center bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
              <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text className="ml-2 text-sm text-red-500 font-medium">{msg}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            className={`primary-button ${loading ? 'opacity-70 bg-violet-400' : ''}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="white" />
                <Text className="ml-2 text-base font-semibold text-white">Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-neutral-200" />
            <Text className="mx-4 text-sm text-neutral-400 font-medium">or continue with</Text>
            <View className="flex-1 h-[1px] bg-neutral-200" />
          </View>

          {/* Social Login */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity className="social-button">
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text className="ml-2 text-sm font-medium text-neutral-700">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity className="social-button">
              <Ionicons name="logo-apple" size={20} color="#000000" />
              <Text className="ml-2 text-sm font-medium text-neutral-700">Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-neutral-500">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-sm font-bold text-violet-500">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}