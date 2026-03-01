import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState, useContext } from 'react';
import { Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import Apis, { endpoints } from '../../configs/Apis';
import { MyDispatchContext } from '../../configs/Context';

type UserRegister = {
    username?: string;
    password?: string;
    displayName?: string;
};

type InfoField = {
    label: string;
    icon: any;
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
    };

    const validate = (): boolean => {
        if (!user?.username || !user?.password) {
            setMsg('Vui lòng nhập đầy đủ username và password!');
            return false;
        }
        setMsg(null);
        return true;
    };

    const register = async () => {
        if (validate()) {
            try {
                setLoading(true);

                const formData = new FormData();
                formData.append('username', user.username!);
                formData.append('password', user.password!);
                if (user.displayName) {
                    formData.append('displayName', user.displayName);
                }

                const res = await Apis.post(endpoints['register'], formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });

                const data = res.data;
                console.log("Register success:", data);

                await AsyncStorage.setItem('token', data.token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                if (dispatch) {
                    dispatch({ type: "SET_USER", payload: data.user });
                }

                router.replace('/(tabs)/home');
            } catch (err: any) {
                console.error('Lỗi đăng ký:', err.response?.data?.message || err.message);
                setMsg(err.response?.data?.message || err.message);
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
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logoImage}>
                        </Image>
                    </View>
                    <Text style={styles.title}>Whisper of Memory</Text>
                    <Text style={styles.subtitle}>Join our community today</Text>
                </View>

                {/* Register Form */}
                <View style={styles.bentoContainer}>
                    <View style={styles.welcomeBento}>
                        <Text style={styles.welcomeText}>Create Account</Text>
                        <Text style={styles.signInText}>Sign up to start your journey</Text>
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
                    {msg ? (
                        <View style={styles.errorBento}>
                            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                            <Text style={styles.errorText}>{msg}</Text>
                        </View>
                    ) : null}

                    {/* Register Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={register}
                        disabled={loading}
                    >
                        {loading ? (
                            <Text style={styles.loginButtonText}>Signing up...</Text>
                        ) : (
                            <>
                                <Ionicons name="person-add-outline" size={20} color="white" />
                                <Text style={styles.loginButtonText}>Sign Up</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.signupBento}>
                        <Text style={styles.signupText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.loginText}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 20,
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
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
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
        marginTop: 8,
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
