import VoicePinTurntable from '@/components/home/VoicePinCard';
import { theme } from '@/constants/Theme';
import HistoryCalendar from '@/components/memory/HistoryCalendar';
import { useMyPins } from '@/hooks/useMyPins';
import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VoicePinCarousel from '@/components/memory/VoicePinCarousel';
import React, { useCallback, useContext, useMemo, useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    LayoutAnimation,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
    useColorScheme,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { MyUserContext } from '@/configs/Context';
import { VoicePinCarouselCard as MemoryCard } from '@/components/memory/VoicePinCarouselCard';
export { MemoryCard };
import Animated, {
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    Extrapolate,
    withTiming,
    Easing,
    withRepeat,
    withSequence,
    withDelay,
} from 'react-native-reanimated';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Svg, Path, G, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// ─── Filter chips ─────────────────────────────────────────
type FilterType = 'time' | 'diary';
const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'time', label: 'Dòng thời gian', icon: 'time-outline' },
    { key: 'diary', label: 'Nhật ký lịch', icon: 'calendar-outline' },
];

function FilterChips({ active, onChange, currentTheme }: { active: FilterType; onChange: (f: FilterType) => void; currentTheme: any }) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterStyles.row}>
            {FILTERS.map((f, i) => {
                const isActive = f.key === active;
                return (
                    <MotiView
                        key={f.key}
                        from={{ opacity: 0, scale: 0.8, translateX: -20 }}
                        animate={{ opacity: 1, scale: 1, translateX: 0 }}
                        transition={{ delay: 400 + i * 100 }}
                    >
                        <TouchableOpacity
                            onPress={() => onChange(f.key)}
                            style={filterStyles.chipWrapper}
                            activeOpacity={0.8}
                        >
                            <View
                                style={[
                                    filterStyles.chipBlur,
                                    {
                                        backgroundColor: isActive ? currentTheme.colors.primary : currentTheme.colors.surface,
                                        borderColor: isActive ? currentTheme.colors.primary : 'rgba(0,0,0,0.1)',
                                        shadowColor: isActive ? currentTheme.colors.primary : '#000',
                                        shadowOpacity: isActive ? 0.3 : 0.05,
                                        shadowRadius: isActive ? 10 : 5,
                                        elevation: isActive ? 5 : 2,
                                    }
                                ]}
                            >
                                <Ionicons
                                    name={f.icon}
                                    size={14}
                                    color={isActive ? '#FFF' : currentTheme.colors.textMuted}
                                />
                                <Text
                                    style={[
                                        filterStyles.chipText,
                                        { color: isActive ? '#FFF' : currentTheme.colors.textSecondary }
                                    ]}
                                >
                                    {f.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </MotiView>
                );
            })}
        </ScrollView>
    );
}

const filterStyles = StyleSheet.create({
    row: { paddingHorizontal: 20, gap: 10, paddingVertical: 10 },
    chipWrapper: {
        borderRadius: 20,
    },
    chipBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: { fontWeight: '700', fontSize: 13 },
});

// ─── Chart Helpers ───────────────────────────────────────────
function EmptyChart({ currentTheme }: { currentTheme: any }) {
    return (
        <View style={styles.emptyChart}>
            <Ionicons name="pulse-outline" size={32} color={currentTheme.colors.textMuted} />
            <Text style={{ color: currentTheme.colors.textMuted, fontSize: 13, marginTop: 10 }}>Đang phân tích dữ liệu tâm trạng...</Text>
        </View>
    );
}

function PieChartData({ stats, size, isDark }: { stats: any[], size: number, isDark: boolean }) {
    const center = size / 2;
    const radius = size * 0.35;
    const strokeWidth = size * 0.2;
    const circumference = 2 * Math.PI * radius;
    
    let currentOffset = 0;
    
    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    {/* Background track ring */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {stats.map((item, i) => {
                        const dashArray = (item.percentage / 100) * circumference;
                        const dashOffset = -currentOffset;
                        currentOffset += dashArray;
                        
                        return (
                            <Circle
                                key={item.label}
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${dashArray} ${circumference}`}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                                fill="none"
                            />
                        );
                    })}
                </G>
            </Svg>
            <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: 1 
                }}
                transition={{ 
                    scale: {
                        loop: true,
                        type: 'timing',
                        duration: 1500,
                    },
                    opacity: { type: 'spring', delay: 1000 }
                }}
                style={{ position: 'absolute' }}
            >
                 <Ionicons name="heart" size={size * 0.28} color="#FF2D55" style={{ 
                    shadowColor: '#FF2D55',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                 }} />
            </MotiView>
        </View>
    );
}

function generateAIInsight(stats: any[]) {
    if (stats.length === 0) return "Whispery đang lắng nghe những cảm xúc của bạn để đưa ra phân tích...";
    
    const dominant = stats[0];
    if (dominant.label === 'Vui vẻ' || dominant.label === 'Hào hứng') {
        return `Bạn đang trải qua một giai đoạn rực rỡ với ${dominant.percentage.toFixed(0)}% năng lượng tích cực. Hãy tận hưởng và lưu giữ những âm thanh hạnh phúc này nhé!`;
    }
    if (dominant.label === 'Bình yên' || dominant.label === 'Bí ẩn') {
        return `Tâm hồn bạn đang ở trạng thái tĩnh lặng và sâu sắc. Những khoảng nghỉ ngơi này là cần thiết để bạn tái tạo năng lượng sáng tạo.`;
    }
    if (dominant.label === 'Buồn bã' || dominant.label === 'Lo lắng' || dominant.label === 'Cô đơn') {
        return `Dường như có chút mây mờ trong lòng bạn. Đừng quên rằng mỗi "tiếng vang" bạn gửi đi đều là cách để giải tỏa và tìm thấy sự đồng điệu.`;
    }
    return `Hành trình cảm xúc của bạn thật đa dạng! Sự cân bằng giữa các cung bậc cảm xúc là chìa khóa để bạn hiểu rõ bản thân hơn qua từng ngày.`;
}

// ─── Background Decoration ────────────────────────────────
function BackgroundDecor({ isDark, currentTheme }: { isDark: boolean; currentTheme: any }) {
    const Blob = ({ color, size, opacity }: { color: string; size: number; opacity: number }) => (
        <Svg width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`} style={{ position: 'absolute' }}>
            <G>
                <Circle
                    cx={size}
                    cy={size}
                    r={size * 0.8}
                    fill={color}
                    opacity={opacity}
                />
            </G>
        </Svg>
    );

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <MotiView
                from={{ opacity: 0, scale: 0.8, translateX: -50 }}
                animate={{ opacity: 1, scale: 1.5, translateX: -20 }}
                transition={{ type: 'timing', duration: 12000, loop: true, repeatReverse: true }}
                style={{ position: 'absolute', left: -120, top: 20 }}
            >
                <Blob color={currentTheme.colors.primary} size={250} opacity={isDark ? 0.15 : 0.12} />
            </MotiView>
            <MotiView
                from={{ opacity: 0, scale: 0.8, translateX: 50 }}
                animate={{ opacity: 1, scale: 2, translateX: 20 }}
                transition={{ type: 'timing', duration: 15000, loop: true, repeatReverse: true, delay: 2000 }}
                style={{ position: 'absolute', right: -150, top: 250 }}
            >
                <Blob color="#3b82f6" size={300} opacity={isDark ? 0.12 : 0.1} />
            </MotiView>
            <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.8 }}
                transition={{ type: 'timing', duration: 18000, loop: true, repeatReverse: true, delay: 1000 }}
                style={{ position: 'absolute', left: -20, bottom: 0 }}
            >
                <Blob color="#ec4899" size={220} opacity={isDark ? 0.1 : 0.08} />
            </MotiView>
            
            {/* Overlay Blur for smoothness */}
            <BlurView intensity={isDark ? 40 : 20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        </View>
    );
}

export default function MemoryScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const user = useContext(MyUserContext);
    const { pins, loading, error, refetch } = useMyPins();
    console.log('[DEBUG] Memory pins sample:', pins.length > 0 ? pins[0] : 'No pins');
    const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('time');
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

    const scrollY = useSharedValue(0);
    const shimmerProgress = useSharedValue(0);

    useEffect(() => {
        shimmerProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withDelay(4500, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );
    }, []);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const headerTextAnim = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(scrollY.value, [0, 100], [0, -10], Extrapolate.CLAMP),
                },
                {
                    scale: interpolate(scrollY.value, [0, 100], [1, 0.9], Extrapolate.CLAMP),
                }
            ],
            opacity: interpolate(scrollY.value, [0, 150], [1, 0], Extrapolate.CLAMP),
        };
    });

    const handleFilterChange = (f: FilterType) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveFilter(f);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const filteredPins = useMemo(() => {
        if (!searchQuery.trim()) return pins;
        const q = searchQuery.toLowerCase();
        return pins.filter(p => 
            p.transcription?.toLowerCase().includes(q) || 
            p.address?.toLowerCase().includes(q) ||
            p.emotionLabel?.toLowerCase().includes(q)
        );
    }, [pins, searchQuery]);

    const flashbackPin = useMemo(() => {
        if (pins.length === 0) return null;
        // Relaxation: Look for pins older than 1 day to ensure it shows up during testing/early usage
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const olderPins = pins.filter(p => new Date(p.createdAt) < oneDayAgo);
        if (olderPins.length === 0) return null;
        return olderPins[Math.floor(Math.random() * olderPins.length)];
    }, [pins]);

    const EMOTION_COLORS: Record<string, string> = {
        'Bình yên': '#10b981',
        'Vui vẻ': '#f59e0b',
        'Buồn bã': '#3b82f6',
        'Hào hứng': '#ef4444',
        'Giận dữ': '#b91c1c',
        'Lo lắng': '#8b5cf6',
        'Sợ hãi': '#1e293b',
        'Ngạc nhiên': '#ec4899',
    };

    const emotionStats = useMemo(() => {
        const stats: Record<string, number> = {};
        pins.slice(0, 50).forEach(p => {
            if (p.emotionLabel) {
                stats[p.emotionLabel] = (stats[p.emotionLabel] || 0) + 1;
            }
        });
        const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const total = sorted.reduce((acc, [, count]) => acc + count, 0);
        
        return sorted.map(([label, count]) => ({
            label,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
            color: EMOTION_COLORS[label] || '#7c3aed'
        }));
    }, [pins]);



    const sections = useMemo(() => {
        const now = new Date();
        const result: { key: string; title: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; pins: VoicePin[] }[] = [];

        if (activeFilter === 'time') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const recent = filteredPins
                .filter(p => new Date(p.createdAt) >= sevenDaysAgo)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (recent.length > 0) {
                result.push({ key: 'recent', title: 'Mới thêm gần đây', icon: 'time-outline', iconColor: '#7c3aed', pins: recent });
            }

            const thisMonth = filteredPins
                .filter(p => {
                    const d = new Date(p.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (thisMonth.length > 0) {
                result.push({ key: 'month', title: 'Tháng này', icon: 'calendar-outline', iconColor: '#3b82f6', pins: thisMonth });
            }

            const shownIds = new Set([...recent, ...thisMonth].map(p => p.id));
            const olderByMonth: Record<string, VoicePin[]> = {};
            for (const p of filteredPins) {
                if (shownIds.has(p.id)) continue;
                const d = new Date(p.createdAt);
                const label = d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
                (olderByMonth[label] = olderByMonth[label] ?? []).push(p);
            }
            const monthsSorted = Object.entries(olderByMonth).sort(([, a], [, b]) =>
                new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime()
            );
            for (const [label, mpins] of monthsSorted) {
                result.push({
                    key: `time-${label}`,
                    title: label,
                    icon: 'planet-outline',
                    iconColor: '#f59e0b',
                    pins: mpins.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                });
            }
        }

        return result;
    }, [pins, activeFilter]);

    if (selectedPin) {
        return (
            <View style={{ flex: 1 }}>
                <StatusBar barStyle="light-content" />
                <VoicePinTurntable
                    pin={selectedPin}
                    onClose={() => setSelectedPin(null)}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    isDark ? '#080809' : '#f0f2ff',
                    isDark ? '#101012' : '#ffffff',
                    isDark ? '#0c0c0e' : '#f8f9ff',
                ]}
                style={StyleSheet.absoluteFill}
            />
            <BackgroundDecor isDark={isDark} currentTheme={currentTheme} />
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. Dashboard Header & Search */}
                <View style={styles.dashboardHeader}>
                    <MotiView
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        style={styles.headerTitleArea}
                    >
                        <Text style={[styles.mainGreeting, { color: isDark ? '#FFF' : '#000' }]}>Ký ức của bạn</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statPill}>
                                <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>{pins.length}</Text>
                                <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary }]}>VoicePins</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: currentTheme.colors.primary + '30' }]} />
                            <View style={styles.statPill}>
                                <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>{new Set(pins.map(p => new Date(p.createdAt).toDateString())).size}</Text>
                                <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary }]}>Ngày lưu</Text>
                            </View>
                        </View>
                    </MotiView>
                    
                    <TouchableOpacity 
                        onPress={() => setShowSearch(!showSearch)}
                        style={[styles.searchCircle, { backgroundColor: currentTheme.colors.surface }]}
                    >
                        <Ionicons name={showSearch ? "close" : "search"} size={20} color={isDark ? '#FFF' : '#000'} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar Overlay */}
                <AnimatePresence>
                    {showSearch && (
                        <MotiView
                            from={{ height: 0, opacity: 0 }}
                            animate={{ height: 80, opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={styles.searchWrapperContainer}
                        >
                            <View style={[styles.searchWrapper, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.primary + '15' }]}>
                                <Ionicons name="search" size={20} color={currentTheme.colors.primary} />
                                <TextInput
                                    placeholder="Tìm kiếm ký ức, địa điểm..."
                                    placeholderTextColor={currentTheme.colors.textMuted}
                                    style={[styles.searchInput, { color: currentTheme.colors.text }]}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={20} color={currentTheme.colors.textMuted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </MotiView>
                    )}
                </AnimatePresence>

                {/* 2. Emotional Hub (The Centerpiece) */}
                {!searchQuery && (
                    <MotiView
                        from={{ opacity: 0, translateY: 30 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 300 }}
                        style={styles.hubContainer}
                    >
                        <View style={[styles.emotionDashboard, { backgroundColor: isDark ? 'rgba(30, 30, 40, 0.4)' : 'rgba(255, 255, 255, 0.35)', borderColor: currentTheme.colors.primary + '20', overflow: 'hidden' }]}>
                            <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                            <View style={{ zIndex: 1 }}>
                                <View style={styles.emotionHeader}>
                                    <View>
                                        <Text style={[styles.emotionTitle, { color: currentTheme.colors.text }]}>Hành trình Tâm trí</Text>
                                        <Text style={[styles.emotionSubtitle, { color: currentTheme.colors.textSecondary }]}>Phân tích cảm xúc hệ thống</Text>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setChartType(chartType === 'bar' ? 'pie' : 'bar');
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                        style={[styles.chartToggleBtn, { backgroundColor: currentTheme.colors.primary + '15' }]}
                                    >
                                        <Ionicons 
                                            name={chartType === 'bar' ? 'pie-chart' : 'stats-chart'} 
                                            size={18} 
                                            color={currentTheme.colors.primary} 
                                        />
                                    </TouchableOpacity>
                                </View>

                                <AnimatePresence mode="wait">
                                    {chartType === 'bar' ? (
                                        <MotiView key="bar" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.chartContainer}>
                                            {emotionStats.length > 0 ? emotionStats.map((item, i) => (
                                                <View key={item.label} style={styles.chartRow}>
                                                    <View style={styles.chartLabelWrapper}>
                                                        <Text style={[styles.chartLabel, { color: currentTheme.colors.text }]}>{item.label}</Text>
                                                        <Text style={[styles.chartValue, { color: currentTheme.colors.primary }]}>{item.count}</Text>
                                                    </View>
                                                    <View style={[styles.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                                        <MotiView
                                                            from={{ width: '0%' }}
                                                            animate={{ width: `${item.percentage}%` }}
                                                            transition={{ type: 'timing', duration: 1000, delay: i * 100 }}
                                                            style={[styles.barFill, { backgroundColor: item.color }]}
                                                        />
                                                    </View>
                                                </View>
                                            )) : <EmptyChart currentTheme={currentTheme} />}
                                        </MotiView>
                                    ) : (
                                        <MotiView key="pie" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.pieContainer}>
                                            <PieChartData stats={emotionStats} size={150} isDark={isDark} />
                                            <View style={styles.pieLegend}>
                                                {emotionStats.map(item => (
                                                    <View key={item.label} style={styles.legendItem}>
                                                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                                        <Text style={[styles.legendText, { color: currentTheme.colors.textSecondary }]}>{item.label}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </MotiView>
                                    )}
                                </AnimatePresence>

                                <View style={[styles.aiInsightCard, { 
                                    backgroundColor: currentTheme.colors.primary + '08', 
                                    borderWidth: 1, 
                                    borderColor: currentTheme.colors.primary + '40',
                                    borderStyle: 'dashed' 
                                }]}>
                                    <Ionicons name="sparkles" size={14} color={currentTheme.colors.primary} />
                                    <Text style={[styles.aiText, { color: currentTheme.colors.text }]}>{generateAIInsight(emotionStats)}</Text>
                                </View>
                            </View>
                        </View>
                    </MotiView>
                )}

                {/* 3. Flashback Section (Floating Highlight) */}
                {flashbackPin && !searchQuery && (
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 600 }}
                        style={styles.flashbackSection}
                    >
                        <TouchableOpacity 
                            onPress={() => setSelectedPin(flashbackPin)}
                            style={[styles.flashbackCard, { backgroundColor: isDark ? 'rgba(30, 30, 40, 0.4)' : 'rgba(255, 255, 255, 0.35)', borderColor: '#FFD70020', overflow: 'hidden' }]}
                        >
                            <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                            <View style={{ zIndex: 1 }}>
                                <View style={styles.flashbackHeader}>
                                    <View style={styles.flashbackBadge}>
                                        <Ionicons name="flash" size={14} color="#FFD700" />
                                        <Text style={styles.flashbackTitle}>Ngày này năm xưa</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={currentTheme.colors.textMuted} />
                                </View>
                                <Text style={[styles.flashbackText, { color: currentTheme.colors.text }]} numberOfLines={2}>
                                    "{flashbackPin.content || flashbackPin.transcription || 'Một ký ức đang chờ bạn...'}"
                                </Text>
                                <View style={styles.flashbackFooter}>
                                    <Ionicons name="location-outline" size={12} color={currentTheme.colors.textMuted} />
                                    <Text style={[styles.flashbackMeta, { color: currentTheme.colors.textSecondary }]}>{flashbackPin.address || 'Đâu đó trong quá khứ'}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </MotiView>
                )}

                {/* 4. Unified Memory Feed */}
                <View style={styles.timelineHeader}>
                    <Text style={[styles.sectionHeading, { color: currentTheme.colors.text }]}>Kho lưu trữ</Text>
                    <View style={styles.filterContainer}>
                        <FilterChips active={activeFilter} onChange={handleFilterChange} currentTheme={currentTheme} />
                    </View>
                </View>

                <View style={styles.content}>
                    {loading && (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={currentTheme.colors.primary} />
                        </View>
                    )}

                    {!loading && activeFilter !== 'diary' && sections.map((s, idx) => (
                        <MotiView
                            key={s.key}
                            from={{ opacity: 0, translateY: 30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: 500 + idx * 100 }}
                            style={styles.sectionContainer}
                        >
                            <VoicePinCarousel
                                title={s.title}
                                icon={s.icon}
                                iconColor={s.iconColor}
                                pins={s.pins}
                                onSelectPin={p => setSelectedPin(p)}
                                currentTheme={currentTheme}
                                limit={10}
                                onSeeAll={() => {
                                    router.push({
                                        pathname: '/(tabs)/memory/grid',
                                        params: { title: s.title, sectionKey: s.key, filter: activeFilter }
                                    });
                                }}
                            />
                        </MotiView>
                    ))}

                    {!loading && activeFilter === 'diary' && (
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={[styles.calendarWrapper, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.primary + '15' }]}
                        >
                            <BlurView intensity={12} tint={isDark ? "dark" : "light"} style={styles.calendarBlur}>
                                <HistoryCalendar
                                    pins={pins}
                                    currentTheme={currentTheme}
                                    onSelectPin={(p) => setSelectedPin(p)}
                                    startDate={user?.createdAt}
                                    onPressAddToday={() => router.replace('/home')}
                                />
                            </BlurView>
                        </MotiView>
                    )}

                    {!loading && pins.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <MotiView from={{ scale: 0.5 }} animate={{ scale: 1 }} style={styles.emptyIconCircle}>
                                <Ionicons name="infinite-outline" size={50} color={currentTheme.colors.primary} />
                            </MotiView>
                            <Text style={[styles.emptyTitle, { color: currentTheme.colors.text }]}>Lặng Im</Text>
                            <Text style={[styles.emptySubtitle, { color: currentTheme.colors.textSecondary }]}>Bạn chưa có VoicePin nào ở đây.</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 60, paddingBottom: 40 },
    
    // --- Header ---
    dashboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitleArea: {
        flex: 1,
    },
    mainGreeting: {
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -1.2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 16,
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#7c3aed',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 12,
    },
    searchCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },

    // --- Hub Section ---
    hubContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    emotionDashboard: {
        padding: 22,
        borderRadius: 36,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    emotionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    emotionTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    emotionSubtitle: {
        fontSize: 12,
        opacity: 0.5,
        marginTop: 2,
    },
    chartToggleBtn: {
        padding: 10,
        borderRadius: 14,
    },
    chartContainer: {
        gap: 16,
    },
    chartRow: {
        gap: 8,
    },
    chartLabelWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        paddingHorizontal: 2,
    },
    chartLabel: {
        fontSize: 13,
        fontWeight: '800',
    },
    chartValue: {
        fontSize: 13,
        fontWeight: '900',
    },
    barBg: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    },
    pieContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    pieLegend: {
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '800',
    },
    aiInsightCard: {
        marginTop: 24,
        padding: 16,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    aiText: {
        fontSize: 13,
        lineHeight: 19,
        flex: 1,
        fontStyle: 'italic',
        opacity: 0.9,
    },

    // --- Flashback ---
    flashbackSection: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    flashbackCard: {
        padding: 24,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
    },
    flashbackHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    flashbackBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    flashbackTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFD700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    flashbackText: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '700',
        fontStyle: 'italic',
    },
    flashbackFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    flashbackMeta: {
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.5,
    },

    // --- Timeline Section ---
    timelineHeader: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionHeading: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    filterContainer: {
        marginBottom: 12,
    },
    content: {
        flex: 1,
    },
    sectionContainer: {
        marginBottom: 28,
    },
    
    // --- Calendar ---
    calendarWrapper: {
        marginHorizontal: 20,
        borderRadius: 36,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    calendarBlur: {
        padding: 12,
    },

    // --- Empty States ---
    emptyContainer: {
        alignItems: 'center',
        padding: 60,
    },
    emptyIconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    emptyTitle: {
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        opacity: 0.5,
        lineHeight: 22,
    },
    center: {
        padding: 50,
        alignItems: 'center',
    },
    emptyChart: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // --- Search Overlay ---
    searchWrapperContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
        overflow: 'hidden',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 28,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 15,
        marginLeft: 12,
        fontWeight: '600',
    },
});
