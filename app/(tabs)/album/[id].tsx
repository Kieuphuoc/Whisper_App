import VoicePinTurntable from '@/components/home/VoicePinCard';
import { VoicePinCarouselCard } from '@/components/memory/VoicePinCarouselCard';
import VoicePinCarousel from '@/components/memory/VoicePinCarousel';
import { BASE_URL } from '@/configs/Apis';
import { MyUserContext } from '@/configs/Context';
import { EMOTIONS, EmotionType } from '@/constants/Emotions';
import { theme } from '@/constants/Theme';
import { useMyPins } from '@/hooks/useMyPins';
import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_SPACING = 12;
const CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_SPACING) / 2;

type ViewMode = 'carousel' | 'grid';

type FilterKey = 'all' | 'public' | 'private' | 'friends';

const FILTERS: { key: FilterKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'Tất cả', icon: 'layers-outline' },
    { key: 'private', label: 'Riêng tư', icon: 'lock-closed-outline' },
    { key: 'friends', label: 'Bạn bè', icon: 'people-outline' },
    { key: 'public', label: 'Công khai', icon: 'earth-outline' },
];

function resolvePinsForSection(pins: VoicePin[], sectionKey: string): VoicePin[] {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (!sectionKey || sectionKey === 'all') {
        return [...pins].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (sectionKey === 'recent') {
        return pins
            .filter(p => new Date(p.createdAt) >= sevenDaysAgo)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (sectionKey.startsWith('vis-')) {
        const vis = sectionKey.replace('vis-', '');
        return pins.filter(p => p.visibility === vis);
    }
    if (sectionKey.startsWith('emo-')) {
        const emo = sectionKey.replace('emo-', '');
        return pins.filter(p => (p.emotionLabel ?? '') === emo);
    }
    if (sectionKey.startsWith('loc-')) {
        const loc = sectionKey.replace('loc-', '');
        return pins.filter(p => {
            if (!p.address) return loc === 'unknown';
            const parts = p.address.split(',').map(s => s.trim());
            const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
            return city === loc;
        });
    }
    if (sectionKey.startsWith('time-')) {
        const tLabel = sectionKey.replace('time-', '');
        return pins
            .filter(p => new Date(p.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) === tLabel)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // User album: filter by pinIds stored in AsyncStorage
    return pins;
}

// ─── Filter chips ─────────────────────────────────────────────────────────

function FilterChips({ active, onChange }: { active: FilterKey; onChange: (f: FilterKey) => void }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={chipStyles.row}
        >
            {FILTERS.map((f, i) => {
                const isActive = f.key === active;
                return (
                    <MotiView
                        key={f.key}
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 300 + i * 80 }}
                    >
                        <TouchableOpacity
                            onPress={() => onChange(f.key)}
                            activeOpacity={0.8}
                            style={chipStyles.wrapper}
                        >
                            <BlurView
                                intensity={isActive ? 50 : 20}
                                tint="dark"
                                style={[chipStyles.blur, isActive && chipStyles.blurActive]}
                            >
                                {isActive && (
                                    <LinearGradient
                                        colors={['rgba(124,58,237,0.5)', 'rgba(67,56,202,0.3)']}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <Ionicons name={f.icon} size={13} color={isActive ? '#fff' : 'rgba(255,255,255,0.5)'} />
                                <Text style={[chipStyles.text, isActive && chipStyles.textActive]}>{f.label}</Text>
                            </BlurView>
                        </TouchableOpacity>
                    </MotiView>
                );
            })}
        </ScrollView>
    );
}

const chipStyles = StyleSheet.create({
    row: { paddingHorizontal: 20, gap: 10, paddingVertical: 8 },
    wrapper: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    blur: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
    blurActive: { borderColor: 'rgba(124,58,237,0.5)' },
    text: { fontWeight: '700', color: 'rgba(255,255,255,0.5)', fontSize: 13 },
    textActive: { color: '#fff' },
});

// ─── Emotion sections ─────────────────────────────────────────────────────

function buildEmotionSections(pins: VoicePin[]) {
    const map: Record<string, VoicePin[]> = {};
    pins.forEach(p => {
        const key = p.emotionLabel ?? 'Khác';
        (map[key] = map[key] ?? []).push(p);
    });
    return Object.entries(map)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([label, items]) => {
            const cfg = EMOTIONS[label as EmotionType];
            return {
                key: `emo-${label}`,
                title: cfg?.label ?? label,
                icon: 'heart-outline' as keyof typeof Ionicons.glyphMap,
                iconColor: cfg?.color ?? '#a78bfa',
                pins: items,
            };
        });
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function AlbumDetailScreen() {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const { id, title, sectionKey, type, accentColor } = useLocalSearchParams<{
        id: string;
        title: string;
        sectionKey: string;
        type: string;
        accentColor: string;
    }>();

    const user = useContext(MyUserContext);
    const { pins, loading, refetch } = useMyPins();
    const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('carousel');
    const [refreshing, setRefreshing] = useState(false);
    const [userPinIds, setUserPinIds] = useState<number[]>([]);

    const accent = accentColor ?? '#7c3aed';
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler({ onScroll: e => { scrollY.value = e.contentOffset.y; } });

    const bannerAnim = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(scrollY.value, [-height, 0, height], [-height / 2, 0, 0], Extrapolate.CLAMP) },
            { scale: interpolate(scrollY.value, [-height, 0], [1.5, 1], Extrapolate.CLAMP) },
        ],
    }));

    // Load pinIds for user albums
    useEffect(() => {
        if (type !== 'user') return;
        AsyncStorage.getItem('whispery_user_albums').then(stored => {
            if (!stored) return;
            const albums = JSON.parse(stored);
            const found = albums.find((a: any) => a.id === id);
            if (found?.pinIds) setUserPinIds(found.pinIds);
        }).catch(() => { });
    }, [id, type]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const sectionPins = useMemo(() => {
        if (type === 'user') {
            if (userPinIds.length > 0) return pins.filter(p => userPinIds.includes(p.id));
            return [];
        }
        return resolvePinsForSection(pins, sectionKey ?? '');
    }, [pins, sectionKey, type, userPinIds]);

    const filteredPins = useMemo(() => {
        if (activeFilter === 'all') return sectionPins;
        const visMap: Record<FilterKey, string> = {
            all: '',
            public: 'PUBLIC',
            private: 'PRIVATE',
            friends: 'FRIENDS',
        };
        return sectionPins.filter(p => p.visibility === visMap[activeFilter]);
    }, [sectionPins, activeFilter]);

    const emotionSections = useMemo(() => buildEmotionSections(filteredPins), [filteredPins]);

    const coverUri = useMemo(() => {
        const firstWithImage = sectionPins.find(p => p.imageUrl || p.images?.[0]?.imageUrl);
        if (firstWithImage) {
            const raw = firstWithImage.images?.[0]?.imageUrl ?? firstWithImage.imageUrl;
            if (!raw) return null;
            return raw.startsWith('http') ? raw : `${BASE_URL}/${raw.replace(/^\//, '')}`;
        }
        if (!user?.cover) return 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop';
        if (user.cover.startsWith('http')) return user.cover;
        return `${BASE_URL}${user.cover.startsWith('/') ? '' : '/'}${user.cover}`;
    }, [sectionPins, user]);

    if (selectedPin) {
        return (
            <View style={{ flex: 1 }}>
                <StatusBar barStyle="light-content" />
                <VoicePinTurntable pin={selectedPin} onClose={() => setSelectedPin(null)} />
            </View>
        );
    }

    const noResults = !loading && filteredPins.length === 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* BACKGROUND */}
            <View style={StyleSheet.absoluteFill}>
                {coverUri ? (
                    <Animated.Image
                        source={{ uri: coverUri }}
                        style={[styles.fullscreenBg, bannerAnim]}
                        blurRadius={14}
                    />
                ) : (
                    <LinearGradient
                        colors={[accent, '#000']}
                        style={StyleSheet.absoluteFill}
                    />
                )}
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* Fixed Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <BlurView intensity={35} tint="dark" style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </BlurView>
                </TouchableOpacity>

                <MotiView
                    from={{ opacity: 0, translateX: 20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'spring', damping: 14 }}
                    style={{ flex: 1, marginLeft: 14 }}
                >
                    <Text style={styles.headerTitle}>{title || 'Album'}</Text>
                    <Text style={styles.headerSubtitle}>{filteredPins.length} chốt giọng</Text>
                </MotiView>

                {/* View Mode Toggle */}
                <TouchableOpacity
                    onPress={() => setViewMode(v => v === 'carousel' ? 'grid' : 'carousel')}
                    activeOpacity={0.7}
                >
                    <BlurView intensity={35} tint="dark" style={styles.viewModeBtn}>
                        <Ionicons
                            name={viewMode === 'carousel' ? 'grid-outline' : 'albums-outline'}
                            size={20}
                            color="#fff"
                        />
                    </BlurView>
                </TouchableOpacity>
            </View>

            {/* Filter Chips */}
            <FilterChips active={activeFilter} onChange={setActiveFilter} />

            {/* Content */}
            {viewMode === 'carousel' ? (
                <Animated.ScrollView
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
                    }
                    contentContainerStyle={styles.carouselContent}
                >
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <MotiView
                                from={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                            >
                                <Text style={styles.loadingText}>Đang tải...</Text>
                            </MotiView>
                        </View>
                    )}

                    {!loading && noResults && (
                        <EmptyAlbumDetail isUserAlbum={type === 'user'} />
                    )}

                    {!loading && !noResults && emotionSections.map((section, idx) => (
                        <MotiView
                            key={section.key}
                            from={{ opacity: 0, translateY: 30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: 400 + idx * 150 }}
                            style={styles.sectionContainer}
                        >
                            <VoicePinCarousel
                                title={section.title}
                                icon={section.icon}
                                iconColor={section.iconColor}
                                pins={section.pins}
                                onSelectPin={p => setSelectedPin(p)}
                                onSeeAll={section.pins.length > 5 ? () => { } : undefined}
                                currentTheme={{
                                    ...currentTheme,
                                    colors: { ...currentTheme.colors, text: '#fff', icon: 'rgba(255,255,255,0.6)' },
                                }}
                                limit={10}
                            />
                        </MotiView>
                    ))}

                    <View style={{ height: 120 }} />
                </Animated.ScrollView>
            ) : (
                <FlatList
                    data={filteredPins}
                    keyExtractor={p => String(p.id)}
                    numColumns={2}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.gridRow}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
                    }
                    ListEmptyComponent={!loading ? <EmptyAlbumDetail isUserAlbum={type === 'user'} /> : null}
                    renderItem={({ item, index }) => (
                        <MotiView
                            from={{ opacity: 0, scale: 0.9, translateY: 16 }}
                            animate={{ opacity: 1, scale: 1, translateY: 0 }}
                            transition={{ delay: 60 * (index % 10) }}
                        >
                            <VoicePinCarouselCard
                                pin={item}
                                onPress={() => setSelectedPin(item)}
                                cardWidth={CARD_WIDTH}
                                cardSpacing={0}
                                currentTheme={{
                                    ...currentTheme,
                                    colors: { ...currentTheme.colors, text: '#fff' },
                                }}
                                isGrid
                            />
                        </MotiView>
                    )}
                />
            )}
        </View>
    );
}

// ─── Empty State ─────────────────────────────────────────────────────────

function EmptyAlbumDetail({ isUserAlbum }: { isUserAlbum: boolean }) {
    return (
        <View style={styles.emptyContainer}>
            <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
                style={styles.emptyIcon}
            >
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="mic-off-outline" size={44} color="rgba(255,255,255,0.4)" />
            </MotiView>
            <Text style={styles.emptyTitle}>Trống</Text>
            <Text style={styles.emptySubtitle}>
                {isUserAlbum
                    ? 'Album này chưa có chốt giọng nào.\nThêm chốt từ tab Ký ức.'
                    : 'Không có chốt giọng nào trong danh mục này.'}
            </Text>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    fullscreenBg: { width: '100%', height: '100%', resizeMode: 'cover' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 12,
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: '600',
    },
    viewModeBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },

    carouselContent: { paddingTop: 8, paddingBottom: 100 },
    sectionContainer: { marginBottom: 8 },

    gridContent: { padding: GRID_PADDING, paddingBottom: 120 },
    gridRow: { justifyContent: 'space-between', marginBottom: GRID_SPACING },

    loadingContainer: { padding: 60, alignItems: 'center' },
    loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: '600' },

    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
        lineHeight: 22,
    },
});
