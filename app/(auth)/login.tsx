import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Image, StatusBar, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { Text } from '@/components/ui/text';
import Apis, { endpoints } from '../../configs/Apis';
import { MyDispatchContext } from '../../configs/Context';

WebBrowser.maybeCompleteAuthSession();

/** Chuỗi lỗi từ API (Django/FastAPI thường trả object hoặc detail) */
function formatApiError(err: any): string {
  const d = err.response?.data;
  if (d == null) return err.message || 'Đăng nhập Google không thành công.';
  if (typeof d === 'string') return d;
  if (typeof d.message === 'string') return d.message;
  if (typeof d.detail === 'string') return d.detail;
  if (d.detail != null && typeof d.detail !== 'string') return JSON.stringify(d.detail);
  if (typeof d.error === 'string') return d.error;
  const key = Object.keys(d)[0];
  const val = key ? d[key] : null;
  if (key && Array.isArray(val) && val[0]) return `${key}: ${val[0]}`;
  try {
    return JSON.stringify(d);
  } catch {
    return 'Đăng nhập Google không thành công.';
  }
}

function googleClientIds() {
  const extra = Constants.expoConfig?.extra as {
    googleWebClientId?: string;
    googleIosClientId?: string;
    googleAndroidClientId?: string;
  } | undefined;
  return {
    webClientId:
      process.env.EXPO_PUBLIC_WEB_CLIENT_ID ?? extra?.googleWebClientId,
    iosClientId:
      process.env.EXPO_PUBLIC_IOS_CLIENT_ID ?? extra?.googleIosClientId,
    androidClientId:
      process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID ?? extra?.googleAndroidClientId,
  };
}

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

  const { webClientId, iosClientId, androidClientId } = googleClientIds();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId,
    iosClientId,
    webClientId,
    // Không set redirectUri: expo-auth-session dùng Application.applicationId + ":/oauthredirect"
    // (vd: com.phuocnguyenkieu.whispery:/oauthredirect) — phải khớp Google Cloud Console.
  });

  const handleGoogleLogin = useCallback(async (idToken: string) => {
    const token = idToken?.trim();
    if (!token) {
      Alert.alert('Thất bại', 'Không nhận được id_token từ Google.');
      return;
    }
    try {
      setLoading(true);
      // Backend hay dùng snake_case `id_token` (Django/FastAPI); giữ `idToken` để tương thích Node
      const res = await Apis.post(endpoints.googleLogin, {
        id_token: token,
        idToken: token,
      });
      const data = res.data;

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      if (dispatch) {
        dispatch({ type: "SET_USER", payload: data.user });
      }

      Alert.alert("Thành công", `Chào mừng ${data.user.displayName || data.user.username}!`);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Lỗi Google login:', err.message, err.response?.data);
      Alert.alert('Thất bại', formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      // Luồng code: lần đầu có thể chỉ có `code`; hook đổi token rồi mới có id_token
      if (idToken) {
        handleGoogleLogin(idToken);
      }
    } else if (response.type === 'error') {
      const msg =
        (response.params as { error_description?: string })?.error_description ||
        response.error?.message ||
        'Đăng nhập Google không thành công.';
      Alert.alert('Google', String(msg));
    }
  }, [response, handleGoogleLogin]);

  const info: InfoField[] = [
    {
      label: 'Tên đăng nhập',
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
        source={require('../../assets/images/background-for-login.jpg')}
        className="absolute w-full h-full"
        resizeMode="cover"
      />
      <BlurView intensity={10} className="absolute inset-0 bg-neutral-900/60" />

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
        className="px-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View className="items-center mb-10">
          <View className="w-44 h-44 justify-center items-center overflow-hidden mb-2">
            <Image
              source={require('../../assets/images/mascot_whispery.png')}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          <Text
            className="text-6xl text-white mb-2"
            style={{
              fontFamily: 'Quicksand_700Bold',
              letterSpacing: -2,
              textShadowColor: 'rgba(0, 0, 0, 0.4)',
              textShadowOffset: { width: 0, height: 4 },
              textShadowRadius: 10
            }}
          >
            Whispery
          </Text>
          <Text
            className="text-lg text-white/60 text-center tracking-widest uppercase"
            style={{ fontFamily: 'Quicksand_500Medium' }}
          >
            Ghi lại khoảnh khắc
          </Text>
        </View>

        {/* Login Form */}
        <View className="bento-container">
          <View className="items-center mb-6">
            <Text className="text-xl font-semibold text-neutral-900 mb-1">Chào mừng trở lại</Text>
            <Text className="text-sm text-neutral-500 text-center">Đăng nhập để tiếp tục hành trình</Text>
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
              {i.field === 'password' && (
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  className="self-end mt-1 mb-2"
                >
                  <Text className="text-xs font-medium text-violet-500/80 italic">Quên mật khẩu?</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Error Message Inline */}
          {!!msg && (
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
                <Text className="ml-2 text-base font-semibold text-white">Đăng nhập</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6 mt-6">
            <View className="flex-1 h-[1px] bg-neutral-200" />
            <Text className="mx-4 text-sm text-neutral-400 font-medium">hoặc tiếp tục với</Text>
            <View className="flex-1 h-[1px] bg-neutral-200" />
          </View>

          <TouchableOpacity
            className="primary-button bg-white border border-neutral-200 mb-6"
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            <Ionicons name="logo-google" size={20} color="#ea4335" />
            <Text className="ml-2 text-base font-semibold text-neutral-900">Tiếp tục với Google</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-neutral-500">Bạn chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-sm font-bold text-violet-500">Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}