import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Apis, { endpoints } from '../../configs/Apis';

type UserLogin = {
  username?: string;
  password?: string;
};

// ✅ Định nghĩa kiểu cho từng field hiển thị
type InfoField = {
  label: string;
  icon: any;
  secureTextEntry: boolean;
  field: keyof UserLogin;
};
export default function LoginScreen() {
  const [user, setUser] = useState<UserLogin>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // const dispatch = useContext(MyDispatchContext);
  const navigation = useNavigation<NavigationProp<any>>();
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
  };

  const validate = (): boolean => {
    if (!user?.username || !user?.password) {
      setMsg('Please enter username and password!');
      return false;
    }
    setMsg(null);
    return true;
  };

  const login = async () => {
    if (validate()) {
      try {
        setLoading(true);

        const res = await Apis.post(endpoints['login'], {
          username: user.username,
          password: user.password
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = res.data;
        console.log(data);

        await AsyncStorage.setItem('token', data.token);
        router.push('/');
      } catch (err) {
        console.error('Lỗi đăng nhập:', (err as Error).message);
        setMsg((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Background Image */}
      <Image
        source={{ uri: 'https://i.pinimg.com/736x/8f/4f/83/8f4f836b45cae5270f1d717af7158070.jpg' }}
        style={styles.backgroundImage}>
      </Image>
      <BlurView intensity={20} style={styles.blurOverlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            {/* <Ionicons name="mic" size={32} color="#8b5cf6" /> */}
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.backgroundImage}>
            </Image>
          </View>
          <Text style={styles.title}>Whisper of Memory</Text>
          <Text style={styles.subtitle}>Capture moments through voice</Text>
        </View>

        {/* Login Form */}
        <View style={styles.bentoContainer}>
          <View style={styles.welcomeBento}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.signInText}>Sign in to continue your journey</Text>
          </View>

          {info.map((i, index) => (
            <View key={index} style={styles.inputBento}>
              <View style={styles.inputWrapper}>
                <Ionicons name={i.icon} size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
                    style={styles.eyeButton}
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

          {/* Error Message */}
          {/* {error ? (
            <View style={styles.errorBento}>
              <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null} */}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={login}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.loginButtonText}>Signing in...</Text>
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="white" />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialBento}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={20} color="#000000" />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          {/* <View style={styles.signupBento}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/register')}>
              <Text style={styles.loginText}>Sign up</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(64, 64, 64, 0.6)',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bentoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 40,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  welcomeBento: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  signInText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  inputBento: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 4,
  },
  eyeButton: {
    padding: 4,
  },
  errorBento: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 30,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: 'black',
    shadowOffset: { width: 12, height: 30 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#a78bfa',
    opacity: 0.7,
  },
  loginButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  socialBento: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  signupBento: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
});
