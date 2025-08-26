import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useContext, useState } from 'react';


import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { MyDispatchContext } from '../../configs/Context';
import { Colors } from '../../constants/Colors';
import { userStyles } from '../../constants/UserStyles';
import Apis, { authApis, endpoints } from "../../configs/Apis";


// ✅ Định nghĩa kiểu cho User login
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

const Login = () => {
  const [user, setUser] = useState<UserLogin>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useContext(MyDispatchContext);
  const navigation = useNavigation<NavigationProp<any>>();
  const [msg, setMsg] = useState<string | null>(null);

  const info: InfoField[] = [
    {
      label: 'Username',
      icon: 'person',
      secureTextEntry: false,
      field: 'username',
    },
    {
      label: 'Mật khẩu',
      icon: 'lock-closed',
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
        navigation.navigate('index' as never);
      } catch (err) {
        console.error('Lỗi đăng nhập:', (err as Error).message);
        setMsg((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={userStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.tabIconDefault} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={userStyles.keyboardView}
      >
        <ScrollView contentContainerStyle={userStyles.scrollContent}>
          <View style={userStyles.header}>
            <Text style={userStyles.title}>Welcome Back</Text>
            <Text style={userStyles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={userStyles.form}>
            {info.map((i, index) => (
              <View key={index} style={userStyles.inputContainer}>
                <Ionicons name={i.icon} size={20} color={Colors.dark.background} style={userStyles.inputIcon} />
                <TextInput
                  value={user[i.field] || ''}
                  onChangeText={(t) => setState(t, i.field)}
                  placeholder={i.label}
                  secureTextEntry={i.secureTextEntry && !showPassword}
                  autoCapitalize="none"
                  style={userStyles.input}
                />
                {i.field === 'password' && (
                  <TouchableOpacity
                    style={userStyles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {msg && (
              <Text style={userStyles.errorText}>{msg}</Text>
            )}

            <TouchableOpacity style={userStyles.forgotPassword}>
              <Text style={userStyles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[userStyles.loginButton, loading && { opacity: 0.6 }]}
              disabled={loading}
              onPress={login}
            >
              <Text style={userStyles.loginButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={userStyles.divider}>
              <View style={userStyles.dividerLine} />
              <Text style={userStyles.dividerText}>OR</Text>
              <View style={userStyles.dividerLine} />
            </View>

            <View style={userStyles.socialButtons}>
              <TouchableOpacity style={userStyles.socialButton} disabled={loading}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={userStyles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity style={userStyles.socialButton}>
                <Ionicons name="logo-apple" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={userStyles.signupContainer}>
              <Text style={userStyles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('register' as never)}>
                <Text style={userStyles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
