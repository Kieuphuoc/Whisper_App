import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar, Switch } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '@/configs/Apis';

export default function PublicProfileScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();
    
    const [isPublic, setIsPublic] = useState(true);
    const [searchable, setSearchable] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const res = await authApis(token).get(endpoints.userMe);
                    const userData = res.data.data;
                    setIsPublic(userData.isPublicAccount);
                    setSearchable(userData.searchable);
                }
            } catch (error) {
                console.error("Load settings error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const savePublic = async (val: boolean) => {
        setIsPublic(val);
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).put(endpoints.userMe, { isPublicAccount: val });
            }
        } catch (error) {
            console.error("Save public error:", error);
        }
    };

    const saveSearchable = async (val: boolean) => {
        setSearchable(val);
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).put(endpoints.userMe, { searchable: val });
            }
        } catch (error) {
            console.error("Save searchable error:", error);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Hồ sơ công khai" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                
                <View className="items-center py-6 mb-4">
                    <View className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mb-6 border-4 border-white dark:border-gray-950 shadow-sm">
                        <Ionicons name={isPublic ? "eye" : "eye-off"} size={32} color="#6366f1" />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111', textAlign: 'center' }}>
                        Hiển thị tài khoản
                    </Text>
                    <Text style={{ fontSize: 14, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
                        Quyết định mức độ để tài khoản của bạn hiển thị trên nền tảng.
                    </Text>
                </View>

                <View className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
                    <View className="flex-row items-center justify-between p-4 px-5 border-b border-gray-100 dark:border-gray-800">
                        <View className="flex-1 pr-4">
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Hồ sơ công khai</Text>
                            <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 4, lineHeight: 18 }}>
                                Ai cũng có thể nhìn thấy hồ sơ, avatar, và tiểu sử của bạn.
                            </Text>
                        </View>
                        <Switch
                            value={isPublic}
                            onValueChange={savePublic}
                            trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
                            thumbColor="#fff"
                        />
                    </View>
                    
                    <View className={`flex-row items-center justify-between p-4 px-5`}>
                        <View className="flex-1 pr-4">
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Cho phép đề xuất kết bạn</Text>
                            <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 4, lineHeight: 18 }}>
                                Hiển thị bạn trong danh sách "Những người bạn có thể biết".
                            </Text>
                        </View>
                        <Switch
                            value={searchable}
                            onValueChange={saveSearchable}
                            trackColor={{ false: '#e2e8f0', true: '#a855f7' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
