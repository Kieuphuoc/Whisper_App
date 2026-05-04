import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { ViewHistory, VoicePin } from '@/types';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    View,
    Image,
    ScrollView,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useColorScheme } from "nativewind";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import theme from '@/constants/Theme';

const { width } = Dimensions.get('window');

// ── Helper functions ──
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

const MONTH_NAMES_VI = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const formatMonthYear = (date: Date) =>
    `${MONTH_NAMES_VI[date.getMonth()]}, ${date.getFullYear()}`;

// getPinImage removed - using component's internal logic

import { VoicePinCarouselCard } from '@/components/memory/VoicePinCarouselCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default function HistoryScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme || 'light'];
    const router = useRouter();
    const [history, setHistory] = useState<ViewHistory[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<ViewHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    const fetchHistory = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const response = await api.get(endpoints.userHistory);
            const data = response.data?.data || [];
            setHistory(data);
            setFilteredHistory(data);
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

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredHistory(history);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = history.filter(item => 
                item.voicePin?.content?.toLowerCase().includes(lowerQuery) ||
                item.voicePin?.user?.username?.toLowerCase().includes(lowerQuery) ||
                item.voicePin?.user?.displayName?.toLowerCase().includes(lowerQuery)
            );
            setFilteredHistory(filtered);
        }
    }, [searchQuery, history]);

    const groupedHistory = useMemo(() => {
        const groups: { [key: string]: ViewHistory[] } = {};

        filteredHistory.forEach(item => {
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
    }, [filteredHistory]);

    const stats = useMemo(() => {
        const total = history.length;
        const todayCount = history.filter(h => isToday(new Date(h.viewedAt))).length;
        // Estimate time: 10s per pin average
        const estimatedMinutes = Math.round((total * 10) / 60);
        return { total, todayCount, estimatedMinutes };
    }, [history]);

    return (
        <View className="flex-1" style={{ backgroundColor: currentTheme.colors.background }}>
            <PageHeader
                title="Lịch sử nghe"
                subtitle="Hành trình khám phá của bạn"
                rightIcon={isSearchVisible ? "close" : "search-outline"}
                onRightPress={() => {
                    setIsSearchVisible(!isSearchVisible);
                    if (isSearchVisible) setSearchQuery('');
                }}
            />

            {isSearchVisible && (
                <MotiView
                    from={{ opacity: 0, translateY: -10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    className="px-6 pb-4"
                >
                    <View 
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                        className="flex-row items-center px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800"
                    >
                        <Ionicons name="search" size={20} color={currentTheme.colors.textMuted} />
                        <TextInput
                            placeholder="Tìm kiếm nội dung hoặc người dùng..."
                            placeholderTextColor={currentTheme.colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={{ flex: 1, marginLeft: 10, color: currentTheme.colors.text, fontSize: 16 }}
                            autoFocus
                        />
                    </View>
                </MotiView>
            )}


            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={currentTheme.colors.primary} />
                </View>
            ) : (
                <View className="flex-1">
                    <ScrollView
                        className="flex-1"
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor={currentTheme.colors.primary} />
                        }
                    >
                        {/* VIP Stats Section */}
                        <MotiView 
                            from={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-6 mb-8"
                        >
                            <LinearGradient
                                colors={isDark ? ['#1e1b4b', '#312e81'] : ['#f5f3ff', '#ede9fe']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ borderRadius: 24, padding: 20 }}
                            >
                                <View className="flex-row justify-between items-center mb-4">
                                    <View>
                                        <Text style={{ color: currentTheme.colors.primary, fontWeight: '800', fontSize: 12 }}>TỔNG QUAN</Text>
                                        <Text style={{ color: isDark ? '#fff' : '#1e1b4b', fontWeight: '900', fontSize: 24 }}>Phân tích nghe</Text>
                                    </View>
                                    <View style={{ backgroundColor: 'rgba(126, 160, 0, 0.2)', padding: 10, borderRadius: 16 }}>
                                        <Ionicons name="stats-chart" size={24} color={currentTheme.colors.primary} />
                                    </View>
                                </View>

                                <View className="flex-row justify-between">
                                    <View>
                                        <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: '600' }}>Tổng số bài</Text>
                                        <Text style={{ color: isDark ? '#fff' : '#1e1b4b', fontSize: 20, fontWeight: '800' }}>{stats.total}</Text>
                                    </View>
                                    <View className="w-[1px] h-10 bg-gray-300/30" />
                                    <View>
                                        <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: '600' }}>Hôm nay</Text>
                                        <Text style={{ color: isDark ? '#fff' : '#1e1b4b', fontSize: 20, fontWeight: '800' }}>{stats.todayCount}</Text>
                                    </View>
                                    <View className="w-[1px] h-10 bg-gray-300/30" />
                                    <View>
                                        <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: '600' }}>Thời gian (ph)</Text>
                                        <Text style={{ color: isDark ? '#fff' : '#1e1b4b', fontSize: 20, fontWeight: '800' }}>~{stats.estimatedMinutes}</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </MotiView>

                        <View className="px-6 mb-4 flex-row justify-between items-center">
                            <TouchableOpacity
                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                className="px-4 py-2.5 rounded-xl flex-row items-center"
                            >
                                <Ionicons name="filter" size={16} color={currentTheme.colors.primary} className="mr-2" />
                                <Text style={{ fontFamily: currentTheme.typography.fonts.bold, color: currentTheme.colors.text }}>Bộ lọc</Text>
                            </TouchableOpacity>
                            
                            {searchQuery ? (
                                <Text className="text-gray-400 text-xs">Tìm thấy {filteredHistory.length} kết quả</Text>
                            ) : null}
                        </View>

                        {groupedHistory.map((group) => (
                            <View key={group.title} className="mb-6">
                                <Text
                                    style={{ fontFamily: currentTheme.typography.fonts.bold, color: currentTheme.colors.text, fontSize: currentTheme.typography.fontSizes.lg }}
                                    className="mb-4 px-6"
                                >
                                    {group.title}
                                </Text>
                                <View style={styles.grid}>
                                    {group.data.map((item) => (
                                        <VoicePinCarouselCard
                                            key={item.id}
                                            pin={item.voicePin}
                                            onPress={() => router.push({ pathname: '/(tabs)/home', params: { voicePinId: item.voicePin.id } })}
                                            currentTheme={currentTheme}
                                            cardWidth={(width - 48) / 2}
                                            cardSpacing={0}
                                            isGrid={true}
                                        />
                                    ))}
                                </View>
                            </View>
                        ))}

                        {history.length === 0 && (
                            <View className="items-center justify-center pt-24 px-10">
                                <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: currentTheme.colors.surfaceAlt }}>
                                    <Ionicons name="headset-outline" size={48} color={currentTheme.colors.textMuted} />
                                </View>
                                <Text
                                    style={{ fontFamily: currentTheme.typography.fonts.bold, color: currentTheme.colors.text }}
                                    className="text-xl text-center mb-2"
                                >Trống quá...</Text>
                                <Text
                                    style={{ fontFamily: currentTheme.typography.fonts.regular, color: currentTheme.colors.textSecondary }}
                                    className="text-center"
                                >Bạn chưa xem tin nhắn thoại nào. Hãy khám phá ngay!</Text>

                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/home')}
                                    style={{ backgroundColor: currentTheme.colors.primary }}
                                    className="mt-10 px-10 py-4 rounded-full shadow-lg shadow-primary"
                                >
                                    <Text style={{ fontFamily: currentTheme.typography.fonts.bold }} className="text-white text-lg">Khám phá</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View className="h-24" />
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        justifyContent: 'space-between'
    },
});
