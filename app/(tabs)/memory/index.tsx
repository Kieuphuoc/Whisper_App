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
    Image,
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
import { BASE_URL } from '@/configs/Apis';
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
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// ─── Filter chips ─────────────────────────────────────────
type FilterType = 'time' | 'diary' | 'visibility';
const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'time', label: 'Dòng thời gian', icon: 'time-outline' },
    { key: 'diary', label: 'Nhật ký lịch', icon: 'calendar-outline' },
    { key: 'visibility', label: 'Riêng tư', icon: 'lock-closed-outline' },
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
                            <BlurView intensity={isActive ? 50 : 20} tint="light" style={[filterStyles.chipBlur, isActive && { borderColor: '#fff' }]}>
                                {isActive && (
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.3)', 'transparent']}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <Ionicons name={f.icon} size={14} color="#fff" />
                                <Text style={[filterStyles.chipText, isActive && filterStyles.chipTextActive]}>{f.label}</Text>
                            </BlurView>
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
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chipBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    chipText: { fontWeight: '700', color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    chipTextActive: { color: '#fff' },
});

export default function MemoryScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const user = useContext(MyUserContext);
    const { pins, loading, error, refetch } = useMyPins();
    const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('time');
    const [refreshing, setRefreshing] = useState(false);

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

    const bannerAnim = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(scrollY.value, [-height, 0, height], [-height / 2, 0, 0], Extrapolate.CLAMP),
                },
                {
                    scale: interpolate(scrollY.value, [-height, 0], [1.5, 1], Extrapolate.CLAMP),
                },
            ],
        };
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

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return pins;
        const q = searchQuery.toLowerCase();
        return pins.filter(p =>
            (p.content?.toLowerCase().includes(q)) ||
            (p.address?.toLowerCase().includes(q)) ||
            (p.emotionLabel?.toLowerCase().includes(q))
        );
    }, [pins, searchQuery]);

    const sections = useMemo(() => {
        const now = new Date();
        const result: { key: string; title: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; pins: VoicePin[] }[] = [];

        if (activeFilter === 'time') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const recent = filtered
                .filter(p => new Date(p.createdAt) >= sevenDaysAgo)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (recent.length > 0) {
                result.push({ key: 'recent', title: 'Mới thêm gần đây', icon: 'time-outline', iconColor: '#7c3aed', pins: recent });
            }

            const thisMonth = filtered
                .filter(p => {
                    const d = new Date(p.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (thisMonth.length > 0) {
                result.push({ key: 'month', title: 'Tháng này', icon: 'calendar-outline', iconColor: '#3b82f6', pins: thisMonth });
            }
        }

        if (activeFilter === 'visibility') {
            const visMap: Record<string, VoicePin[]> = {};
            for (const p of filtered) {
                const key = p.visibility ?? 'PRIVATE';
                (visMap[key] = visMap[key] ?? []).push(p);
            }
            const VIS_META: Record<string, { label: string, icon: keyof typeof Ionicons.glyphMap, color: string }> = {
                'PRIVATE': { label: 'Chỉ mình tôi', icon: 'lock-closed-outline', color: '#94a3b8' },
                'FRIENDS': { label: 'Bạn bè', icon: 'people-outline', color: '#60a5fa' },
                'PUBLIC': { label: 'Công khai', icon: 'earth-outline', color: '#34d399' }
            };

            const sorted = Object.entries(visMap).sort((a, b) => b[1].length - a[1].length);
            for (const [vis, vpins] of sorted) {
                const meta = VIS_META[vis] || VIS_META['PRIVATE'];
                result.push({ key: `vis-${vis}`, title: meta.label, icon: meta.icon, iconColor: meta.color, pins: vpins });
            }
        }

        return result;
    }, [filtered, activeFilter]);

    const coverUri = useMemo(() => {
        if (!user?.cover) return 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop';
        if (user.cover.startsWith('http')) return user.cover;
        return `${BASE_URL}${user.cover.startsWith('/') ? '' : '/'}${user.cover}`;
    }, [user]);

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
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* FULL SCREEN BACKGROUND */}
            <View style={StyleSheet.absoluteFill}>
                <Animated.Image
                    source={{ uri: coverUri }}
                    style={[styles.fullscreenBackground, bannerAnim]}
                    blurRadius={10}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header Section with Profile-style Asymmetry */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <Animated.View style={headerTextAnim}>
                            <MotiView
                                from={{ opacity: 0, translateX: -40 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ type: 'spring', damping: 12 }}
                            >
                                <Text style={styles.title}>Ký Ức</Text>
                                <View style={styles.subtitleRow}>
                                    <Text style={styles.subtitle}>Dòng thời gian đang vang vọng</Text>
                                </View>
                            </MotiView>
                        </Animated.View>

                        {/* ASYMMETRIC STAT BUBBLES LIKE PROFILE */}
                        <View style={styles.bubblesContainer}>
                            <MotiView
                                from={{ scale: 0, translateX: 20 }}
                                animate={{ scale: 1, translateX: 0 }}
                                transition={{ delay: 300, type: 'spring' }}
                                style={[styles.statBubble, styles.bubbleLarge]}
                            >
                                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: '#7c3aed50' }]} />
                                <Text style={styles.bubbleValue}>{pins.length}</Text>
                                <Text style={styles.bubbleLabel}>Chốt</Text>
                            </MotiView>

                            <MotiView
                                from={{ scale: 0, translateY: 20 }}
                                animate={{ scale: 1, translateY: 0 }}
                                transition={{ delay: 450, type: 'spring' }}
                                style={[styles.statBubble, styles.bubbleSmall, { bottom: -10, left: 10 }]}
                            >
                                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: '#10b98150' }]} />
                                <Text style={styles.bubbleValueSmall}>
                                    {pins.filter(p => p.visibility === 'PRIVATE').length}
                                </Text>
                                <Text style={styles.bubbleLabelSmall}>Ẩn</Text>
                            </MotiView>
                        </View>
                    </View>
                </View>

                {/* Search Glass Bar */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 200 }}
                    style={styles.searchWrapper}
                >
                    <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                        <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.6)" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm tần số ký ức..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        )}
                    </BlurView>
                </MotiView>

                {/* Filter Chips */}
                <View style={styles.filterContainer}>
                    <FilterChips active={activeFilter} onChange={handleFilterChange} currentTheme={currentTheme} />
                </View>

                {/* Main Content Area */}
                <View style={styles.content}>
                    {loading && (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#7c3aed" />
                        </View>
                    )}

                    {!loading && activeFilter !== 'diary' && sections.map((s, idx) => (
                        <MotiView
                            key={s.key}
                            from={{ opacity: 0, translateY: 30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: 500 + idx * 200 }}
                            style={styles.sectionContainer}
                        >
                            <VoicePinCarousel
                                title={s.title}
                                icon={s.icon}
                                iconColor={s.iconColor}
                                pins={s.pins}
                                onSelectPin={p => setSelectedPin(p)}
                                currentTheme={{
                                    ...currentTheme,
                                    colors: { ...currentTheme.colors, text: '#fff', icon: 'rgba(255,255,255,0.6)' }
                                }}
                                limit={10}
                                onSeeAll={() => {
                                    router.push({
                                        pathname: '/(tabs)/memory/grid',
                                        params: { title: s.title, sectionKey: s.key, filter: activeFilter, query: searchQuery }
                                    });
                                }}
                            />
                        </MotiView>
                    ))}

                    {!loading && activeFilter === 'diary' && (
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={styles.calendarWrapper}
                        >
                            <BlurView intensity={15} tint="light" style={styles.calendarBlur}>
                                <HistoryCalendar
                                    pins={filtered}
                                    currentTheme={{
                                        ...currentTheme,
                                        colors: { ...currentTheme.colors, background: 'transparent', surfaceAlt: 'transparent', text: '#fff' }
                                    }}
                                    onSelectPin={(p) => setSelectedPin(p)}
                                    startDate={user?.createdAt}
                                    onPressAddToday={() => router.replace('/home')}
                                />
                            </BlurView>
                        </MotiView>
                    )}

                    {!loading && pins.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <MotiView
                                from={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring' }}
                                style={styles.emptyIconCircle}
                            >
                                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                                <Ionicons name="infinite-outline" size={50} color="#7c3aed" />
                            </MotiView>
                            <Text style={styles.emptyTitle}>Lặng Im</Text>
                            <Text style={styles.emptySubtitle}>Không gian ký ức của bạn còn trống.{'\n'}Hãy bắt đầu ghi lại thanh âm cuộc sống.</Text>
                        </View>
                    )}

                    {!loading && pins.length > 0 && filtered.length === 0 && (
                        <View style={styles.center}>
                            <Ionicons name="pulse" size={48} color="rgba(255,255,255,0.2)" />
                            <Text style={styles.noResultsText}>Không tìm thấy tần số phù hợp</Text>
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
    fullscreenBackground: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    scrollContent: { paddingTop: 60 },
    header: {
        paddingHorizontal: 25,
        marginBottom: 30,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -2,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -5,
        gap: 10,
    },
    countBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(124, 58, 237, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    countText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600',
    },
    searchWrapper: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    filterContainer: {
        marginBottom: 10,
    },
    content: {
        paddingTop: 10,
    },
    sectionContainer: {
        marginBottom: 10,
    },
    calendarWrapper: {
        marginHorizontal: 15,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingTop: 10,
        paddingBottom: 20,
    },
    calendarBlur: {
        padding: 10,
    },
    center: {
        padding: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 22,
    },
    noResultsText: {
        marginTop: 15,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 15,
        fontWeight: '600',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bubblesContainer: {
        width: 100,
        height: 100,
        position: 'relative',
    },
    statBubble: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    bubbleLarge: {
        width: 70,
        height: 70,
        right: 0,
        top: 0,
    },
    bubbleSmall: {
        width: 50,
        height: 50,
    },
    bubbleValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    bubbleLabel: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        color: '#fff',
    },
    bubbleValueSmall: {
        fontSize: 14,
        fontWeight: '900',
        color: '#fff',
    },
    bubbleLabelSmall: {
        fontSize: 8,
        fontWeight: '800',
        textTransform: 'uppercase',
        color: '#fff',
    },
});
