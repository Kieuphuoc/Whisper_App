import { authApis, endpoints } from '@/configs/Apis';
import { ViewHistory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

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

    const renderHistoryItem = ({ item, index }: { item: ViewHistory; index: number }) => {
        const { voicePin } = item;
        const timeAgo = new Date(item.viewedAt).toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
        });

        return (
            <Animated.View entering={FadeInRight.delay(index * 100).duration(400)}>
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(tabs)/home', params: { voicePinId: voicePin.id } })}
                    className="flex-row items-center bg-white p-4 mb-3 rounded-3xl border border-gray-100 shadow-sm shadow-gray-200"
                >
                    <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                        <Ionicons name="mic" size={24} color="#8b5cf6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-[#1e293b]" numberOfLines={1}>
                            {voicePin.content || "Tin nhắn thoại"}
                        </Text>
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="time-outline" size={14} color="#94a3b8" />
                            <Text className="text-gray-400 text-sm ml-1">{timeAgo}</Text>
                        </View>
                        {voicePin.address && (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="location-outline" size={14} color="#94a3b8" />
                                <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                                    {voicePin.address}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View className="flex-1 bg-[#f8fafc]">
            {/* Header */}
            <View className="pt-14 pb-4 px-6 flex-row items-center bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-[#1e293b]">Lịch sử nghe</Text>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderHistoryItem}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor="#8b5cf6" />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center pt-20">
                            <Ionicons name="headset-outline" size={64} color="#e2e8f0" />
                            <Text className="text-gray-400 mt-4 text-lg">Bạn chưa nghe tin nhắn nào</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/home')}
                                className="mt-6 bg-[#1e293b] px-6 py-3 rounded-full"
                            >
                                <Text className="text-white font-bold">Khám phá ngay</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}
