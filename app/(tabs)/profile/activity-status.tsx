import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar, Switch } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '@/configs/Apis';

export default function ActivityStatusScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();
    
    const [showActivity, setShowActivity] = useState(true);
    const [showTyping, setShowTyping] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const res = await authApis(token).get(endpoints.userMe);
                    const userData = res.data.data;
                    setShowActivity(userData.showActiveStatus);
                    setShowTyping(userData.showTypingStatus);
                }
            } catch (error) {
                console.error("Load activity settings error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const saveActivity = async (val: boolean) => {
        setShowActivity(val);
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).put(endpoints.userMe, { showActiveStatus: val });
            }
        } catch (error) {
            console.error("Save activity error:", error);
        }
    };

    const saveTyping = async (val: boolean) => {
        setShowTyping(val);
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).put(endpoints.userMe, { showTypingStatus: val });
            }
        } catch (error) {
            console.error("Save typing error:", error);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Trạng thái HĐ" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                
                <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 mb-6 flex-row items-start">
                    <Ionicons name="information-circle" size={24} color="#3b82f6" style={{ marginTop: 2, marginRight: 12 }} />
                    <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563' }}>
                        Hiển thị Trạng thái hoạt động giúp bạn bè biết bạn đang có sẵn trên Whisper hay không. Tắt tùy chọn này sẽ khiến bạn không thể thấy trạng thái của thông báo của người khác.
                    </Text>
                </View>

                <View className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
                    <View className="flex-row items-center justify-between p-4 px-5 border-b border-gray-100 dark:border-gray-800">
                        <View className="flex-1 pr-4">
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Trạng thái hoạt động</Text>
                            <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 4, lineHeight: 18 }}>
                                Cho phép bạn bè thấy lúc nào bạn hoạt động.
                            </Text>
                        </View>
                        <Switch
                            value={showActivity}
                            onValueChange={saveActivity}
                            trackColor={{ false: '#e2e8f0', true: '#7ea000' }}
                            thumbColor="#fff"
                        />
                    </View>
                    
                    <View className={`flex-row items-center justify-between p-4 px-5 ${!showActivity ? 'opacity-50' : ''}`}>
                        <View className="flex-1 pr-4">
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Hiển thị khi đang trò chuyện</Text>
                            <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 4, lineHeight: 18 }}>
                                Hiển thị thông báo khi bạn đang ghi âm hoặc nhắn tin trong cuộc hội thoại.
                            </Text>
                        </View>
                        <Switch
                            value={showTyping}
                            onValueChange={saveTyping}
                            disabled={!showActivity}
                            trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
