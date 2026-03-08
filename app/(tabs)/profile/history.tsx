import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { ViewHistory, VoicePin } from '@/types';
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
    Dimensions,
    StyleSheet,
} from 'react-native';
import { useColorScheme } from "nativewind";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
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

const getPinImage = (pin: VoicePin) => {
    const imgUrl = pin.images?.[0]?.imageUrl || pin.imageUrl;
    if (!imgUrl) return null;
    return imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
};

// ── History Card Component ──
const HistoryCard = ({ item, index, currentTheme, onPress }: { item: ViewHistory, index: number, currentTheme: any, onPress: (id: number) => void }) => {
    const { voicePin } = item;
    const scale = useSharedValue(1);
    const imgUrl = getPinImage(voicePin);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
    };

    const onPressOut = () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify().damping(20)}
            style={[animatedStyle, styles.cardContainer]}
        >
            <TouchableOpacity
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                onPress={() => onPress(voicePin.id)}
                style={[styles.card, { backgroundColor: currentTheme.colors.surfaceAlt }]}
            >
                <View style={styles.imageWrapper}>
                    {imgUrl ? (
                        <Image source={{ uri: imgUrl }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="mic" size={32} color={currentTheme.colors.primary} style={{ opacity: 0.2 }} />
                        </View>
                    )}

                    {/* View Count Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.countOverlay}
                    >
                        <View style={styles.countRow}>
                            <Ionicons name="play" size={12} color="white" />
                            <Text style={[styles.countText, { fontFamily: currentTheme.typography.fonts.bold }]}>
                                {(voicePin.listensCount || 0) > 1000 ? `${((voicePin.listensCount || 0) / 1000).toFixed(1)}K` : voicePin.listensCount || 0}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.cardContent}>
                    <Text
                        style={[styles.cardTitle, { color: currentTheme.colors.text, fontFamily: currentTheme.typography.fonts.bold }]}
                        numberOfLines={1}
                    >
                        {voicePin.content || "Chưa có nội dung"}
                    </Text>
                    <View style={styles.cardFooter}>
                        <View style={styles.statItem}>
                            <Ionicons name="heart" size={12} color="#ef4444" />
                            <Text style={[styles.statText, { color: currentTheme.colors.textSecondary }]}>{voicePin.reactionsCount || 0}</Text>
                        </View>
                        <View style={[styles.statItem, { marginLeft: 10 }]}>
                            <Ionicons name="chatbubble" size={11} color={currentTheme.colors.primary} />
                            <Text style={[styles.statText, { color: currentTheme.colors.textSecondary }]}>{voicePin.commentsCount || 0}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function HistoryScreen() {
    const { colorScheme } = useColorScheme();
    const currentTheme = theme[colorScheme || 'light'];
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

    return (
        <View className="flex-1" style={{ backgroundColor: currentTheme.colors.background }}>
            {/* Header */}
            <View className="pt-14 pb-4 px-6 flex-row items-center justify-between border-b" style={{ backgroundColor: currentTheme.colors.background, borderColor: currentTheme.colors.border }}>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="chevron-back" size={28} color={currentTheme.colors.text} />
                    </TouchableOpacity>
                    <Text
                        style={{ fontFamily: currentTheme.typography.fonts.bold, fontSize: currentTheme.typography.fontSizes.xl }}
                        className="text-gray-900 dark:text-white"
                    >Lịch sử xem</Text>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity className="p-2">
                        <Ionicons name="search-outline" size={24} color={currentTheme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="ellipsis-horizontal" size={24} color={currentTheme.colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

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
                        <View className="px-6 py-4">
                            <TouchableOpacity
                                style={{ backgroundColor: currentTheme.colors.surfaceAlt }}
                                className="self-start px-4 py-2 rounded-xl flex-row items-center shadow-sm"
                            >
                                <Text style={{ fontFamily: currentTheme.typography.fonts.medium, color: currentTheme.colors.textSecondary }} className="text-sm">Tất cả thời gian</Text>
                                <Ionicons name="chevron-down" size={14} color={currentTheme.colors.textMuted} className="ml-2" />
                            </TouchableOpacity>
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
                                    {group.data.map((item, index) => (
                                        <HistoryCard
                                            key={item.id}
                                            item={item}
                                            index={index}
                                            currentTheme={currentTheme}
                                            onPress={(pinId) => router.push({ pathname: '/(tabs)/home', params: { voicePinId: pinId } })}
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
    cardContainer: {
        width: (width - 48) / 2,
        marginBottom: 16,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    imageWrapper: {
        width: '100%',
        height: (width - 48) / 2 * 1.2,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        justifyContent: 'flex-end',
        padding: 10,
    },
    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countText: {
        color: 'white',
        fontSize: 11,
        marginLeft: 4,
    },
    cardContent: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 14,
        marginBottom: 6,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 11,
        marginLeft: 4,
    }
});
