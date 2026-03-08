import { authApis, endpoints } from '@/configs/Apis';
import { ViewHistory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
    Image,
    ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ── Helper functions to replace date-fns ──
const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

const isToday = (date: Date) => isSameDay(date, new Date());

const isYesterday = (date: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(date, yesterday);
};

const isThisWeek = (date: Date) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek && date <= now;
};

const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
};

const MONTH_NAMES_VI = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const formatMonthYear = (date: Date) =>
    `${MONTH_NAMES_VI[date.getMonth()]}, ${date.getFullYear()}`;

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<ViewHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const response = await api.get(endpoints.userHistory);
            setHistory(response.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const groupedHistory = useMemo(() => {
        const groups: { [key: string]: ViewHistory[] } = {};
        
        history.forEach(item => {
            const date = new Date(item.viewedAt);
            let title = '';
            
            if (isToday(date)) title = 'Hôm nay';
            else if (isYesterday(date)) title = 'Hôm qua';
            else if (isThisWeek(date)) title = 'Tuần này';
            else title = formatMonthYear(date);

            if (!groups[title]) groups[title] = [];
            groups[title].push(item);
        });

        return Object.keys(groups).map(title => ({
            title,
            data: groups[title]
        }));
    }, [history]);

    const renderHistoryItem = (item: ViewHistory, index: number) => {
        const { voicePin } = item;
        const timeValue = formatTime(new Date(item.viewedAt));

        return (
            <Animated.View 
                entering={FadeInDown.delay(index * 50).duration(400)}
                key={item.id}
                className="mb-4"
            >
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(tabs)/home', params: { voicePinId: voicePin.id } })}
                    className="flex-row items-center bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-800"
                >
                    <View className="w-16 h-16 rounded-xl overflow-hidden mr-4 bg-gray-100 dark:bg-gray-800 items-center justify-center relative">
                        {voicePin.imageUrl ? (
                            <Image 
                                source={{ uri: voicePin.imageUrl.startsWith('http') ? voicePin.imageUrl : `http://10.5.1.149:5000${voicePin.imageUrl}` }} 
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons name="mic" size={28} color="#7ea000" />
                        )}
                        <View className="absolute bottom-1 right-1 bg-black/50 px-1 rounded">
                            <Text className="text-[10px] text-white font-bold">{timeValue}</Text>
                        </View>
                    </View>
                    
                    <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900 dark:text-white mb-1" numberOfLines={1}>
                            {voicePin.content || "Tin nhắn thoại"}
                        </Text>
                        <View className="flex-row items-center">
                            <Ionicons name="person-outline" size={12} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                                {voicePin.user?.displayName || "Ẩn danh"}
                            </Text>
                        </View>
                        {voicePin.address && (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="location-outline" size={12} color="#9ca3af" />
                                <Text className="text-gray-400 text-[10px] ml-1" numberOfLines={1}>
                                    {voicePin.address}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <View className="pt-14 pb-4 px-6 flex-row items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử xem</Text>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#7ea000" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-4 pt-4"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor="#7ea000" />
                    }
                >
                    {groupedHistory.map((group) => (
                        <View key={group.title} className="mb-6">
                            <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 ml-1 uppercase tracking-wider">
                                {group.title}
                            </Text>
                            {group.data.map((item, index) => renderHistoryItem(item, index))}
                        </View>
                    ))}

                    {history.length === 0 && (
                        <View className="items-center justify-center pt-20">
                            <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
                                <Ionicons name="headset-outline" size={40} color="#d1d5db" />
                            </View>
                            <Text className="text-gray-500 dark:text-gray-400 text-lg font-medium">Bạn chưa xem tin nhắn nào</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/home')}
                                className="mt-6 bg-primary-500 px-8 py-3 rounded-full"
                            >
                                <Text className="text-white font-bold">Khám phá ngay</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View className="h-20" />
                </ScrollView>
            )}
        </View>
    );
}
