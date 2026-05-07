import { BASE_URL } from '@/configs/Apis';
import { MyUserContext } from '@/configs/Context';
import { AlbumCard, ALBUM_CARD_WIDTH, SmartAlbumCard } from '@/components/album/AlbumCard';
import { EMOTIONS, EmotionType } from '@/constants/Emotions';
import { theme } from '@/constants/Theme';
import { useMyPins } from '@/hooks/useMyPins';
import { Album, VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import Animated, {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import VoicePinTurntable from '@/components/home/VoicePinCard';

const { width, height } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 20;

const STORAGE_KEY = 'whispery_user_albums';

// ─── Smart album computation ──────────────────────────────────────────────

function buildSmartAlbums(pins: VoicePin[]): Album[] {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const base: Album[] = [
        {
            id: 'smart-all',
            name: 'Tất cả',
            coverGradient: ['#7c3aed', '#4338ca'],
            coverIcon: 'mic',
            accentColor: '#7c3aed',
            pinCount: pins.length,
            sectionKey: 'all',
            type: 'smart',
        },
        {
            id: 'smart-recent',
            name: 'Mới thêm',
            coverGradient: ['#3b82f6', '#1d4ed8'],
            coverIcon: 'time',
            accentColor: '#60a5fa',
            pinCount: pins.filter(p => new Date(p.createdAt) >= sevenDaysAgo).length,
            sectionKey: 'recent',
            type: 'smart',
        },
        {
            id: 'smart-private',
            name: 'Riêng tư',
            coverGradient: ['#64748b', '#334155'],
            coverIcon: 'lock-closed',
            accentColor: '#94a3b8',
            pinCount: pins.filter(p => p.visibility === 'PRIVATE').length,
            sectionKey: 'vis-PRIVATE',
            type: 'smart',
        },
        {
            id: 'smart-friends',
            name: 'Bạn bè',
            coverGradient: ['#059669', '#065f46'],
            coverIcon: 'people',
            accentColor: '#34d399',
            pinCount: pins.filter(p => p.visibility === 'FRIENDS').length,
            sectionKey: 'vis-FRIENDS',
            type: 'smart',
        },
    ];

    // Emotion-based smart albums (top 4)
    const emotionMap: Record<string, number> = {};
    pins.forEach(p => {
        if (p.emotionLabel) emotionMap[p.emotionLabel] = (emotionMap[p.emotionLabel] ?? 0) + 1;
    });

    Object.entries(emotionMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .forEach(([emotion, count]) => {
            const cfg = EMOTIONS[emotion as EmotionType];
            if (!cfg) return;
            base.push({
                id: `smart-emo-${emotion}`,
                name: cfg.label,
                coverGradient: [cfg.color, cfg.color + '99'],
                coverIcon: 'heart',
                accentColor: cfg.color,
                pinCount: count,
                sectionKey: `emo-${emotion}`,
                type: 'smart',
            });
        });

    // Location-based smart albums (top 3 cities)
    const locMap: Record<string, number> = {};
    pins.forEach(p => {
        if (!p.address) return;
        const parts = p.address.split(',').map(s => s.trim());
        const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
        if (city) locMap[city] = (locMap[city] ?? 0) + 1;
    });

    Object.entries(locMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([city, count]) => {
            base.push({
                id: `smart-loc-${city}`,
                name: city,
                coverGradient: ['#b45309', '#92400e'],
                coverIcon: 'location',
                accentColor: '#f59e0b',
                pinCount: count,
                sectionKey: `loc-${city}`,
                type: 'smart',
            });
        });

    return base.filter(a => a.pinCount > 0 || a.id === 'smart-all');
}

// ─── Context menu ─────────────────────────────────────────────────────────

interface ContextMenuProps {
    album: Album | null;
    onDismiss: () => void;
    onRename: () => void;
    onDelete: () => void;
    onShare: () => void;
}

function ContextMenu({ album, onDismiss, onRename, onDelete, onShare }: ContextMenuProps) {
    if (!album) return null;
    return (
        <Modal transparent animationType="fade" visible={!!album} onRequestClose={onDismiss}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={onDismiss} activeOpacity={1}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <MotiView
                from={{ translateY: 60, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                style={styles.contextMenu}
            >
                <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={['rgba(255,255,255,0.08)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                />

                <Text style={styles.contextTitle} numberOfLines={1}>{album.name}</Text>
                <View style={styles.contextDivider} />

                {[
                    { icon: 'pencil-outline', label: 'Đổi tên', color: '#fff', onPress: onRename },
                    { icon: 'share-outline', label: 'Chia sẻ album', color: '#fff', onPress: onShare },
                    { icon: 'trash-outline', label: 'Xóa album', color: '#ef4444', onPress: onDelete },
                ].map((item, i) => (
                    <React.Fragment key={item.label}>
                        <TouchableOpacity style={styles.contextItem} onPress={item.onPress} activeOpacity={0.7}>
                            <Ionicons name={item.icon as any} size={20} color={item.color} />
                            <Text style={[styles.contextItemText, { color: item.color }]}>{item.label}</Text>
                        </TouchableOpacity>
                        {i < 2 && <View style={styles.contextDivider} />}
                    </React.Fragment>
                ))}
            </MotiView>
        </Modal>
    );
}

// ─── Rename modal ─────────────────────────────────────────────────────────

interface RenameModalProps {
    album: Album | null;
    onDismiss: () => void;
    onConfirm: (newName: string) => void;
}

function RenameModal({ album, onDismiss, onConfirm }: RenameModalProps) {
    const [value, setValue] = useState(album?.name ?? '');
    useEffect(() => { setValue(album?.name ?? ''); }, [album]);
    if (!album) return null;
    return (
        <Modal transparent animationType="fade" visible={!!album} onRequestClose={onDismiss}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={onDismiss} activeOpacity={1}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <MotiView
                from={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                style={styles.renameModal}
            >
                <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={styles.renameTitle}>Đổi tên album</Text>
                <TextInput
                    style={styles.renameInput}
                    value={value}
                    onChangeText={setValue}
                    autoFocus
                    maxLength={50}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    placeholder="Tên album..."
                />
                <View style={styles.renameActions}>
                    <TouchableOpacity onPress={onDismiss} style={styles.renameBtn}>
                        <Text style={styles.renameBtnCancel}>Huỷ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => value.trim() && onConfirm(value.trim())}
                        style={[styles.renameBtn, styles.renameBtnPrimary]}
                    >
                        <Text style={styles.renameBtnPrimaryText}>Lưu</Text>
                    </TouchableOpacity>
                </View>
            </MotiView>
        </Modal>
    );
}

// ─── Search Suggestions ───────────────────────────────────────────────────

interface Suggestion {
    type: 'album' | 'emotion' | 'location' | 'smart';
    label: string;
    subLabel?: string;
    icon: string;
    color: string;
    onPress: () => void;
}

interface SearchSuggestionsProps {
    query: string;
    smartAlbums: Album[];
    userAlbums: Album[];
    onSelectAlbum: (album: Album) => void;
    onDismiss: () => void;
}

function SearchSuggestions({ query, smartAlbums, userAlbums, onSelectAlbum, onDismiss }: SearchSuggestionsProps) {
    const q = query.toLowerCase().trim();
    if (!q) return null;

    const suggestions: Suggestion[] = [];

    // Match user albums
    userAlbums.forEach(a => {
        if (a.name.toLowerCase().includes(q)) {
            suggestions.push({
                type: 'album',
                label: a.name,
                subLabel: `${a.pinCount} chốt · Của tôi`,
                icon: 'albums',
                color: a.accentColor ?? '#7c3aed',
                onPress: () => { onDismiss(); onSelectAlbum(a); },
            });
        }
    });

    // Match smart albums
    smartAlbums.forEach(a => {
        if (a.name.toLowerCase().includes(q)) {
            suggestions.push({
                type: 'smart',
                label: a.name,
                subLabel: `${a.pinCount} chốt · Tự động`,
                icon: a.coverIcon ?? 'sparkles',
                color: a.accentColor ?? '#a78bfa',
                onPress: () => { onDismiss(); onSelectAlbum(a); },
            });
        }
    });

    // Match emotion names
    Object.entries(EMOTIONS).forEach(([key, cfg]) => {
        if (cfg.label.toLowerCase().includes(q) && !suggestions.find(s => s.label === cfg.label)) {
            const smartMatch = smartAlbums.find(a => a.id === `smart-emo-${key}`);
            if (smartMatch) {
                suggestions.push({
                    type: 'emotion',
                    label: cfg.label,
                    subLabel: `Cảm xúc · ${smartMatch.pinCount} chốt`,
                    icon: 'heart',
                    color: cfg.color,
                    onPress: () => { onDismiss(); onSelectAlbum(smartMatch); },
                });
            }
        }
    });

    if (suggestions.length === 0) {
        suggestions.push({
            type: 'album',
            label: `Không tìm thấy "${q}"`,
            subLabel: undefined,
            icon: 'search-outline',
            color: 'rgba(255,255,255,0.3)',
            onPress: onDismiss,
        });
    }

    return (
        <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={suggestionStyles.container}
        >
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'transparent']}
                style={StyleSheet.absoluteFill}
            />
            {suggestions.slice(0, 6).map((s, i) => (
                <React.Fragment key={`${s.type}-${s.label}-${i}`}>
                    {i > 0 && <View style={suggestionStyles.divider} />}
                    <TouchableOpacity
                        onPress={s.onPress}
                        style={suggestionStyles.row}
                        activeOpacity={0.75}
                    >
                        <View style={[suggestionStyles.iconWrap, { backgroundColor: s.color + '22' }]}>
                            <Ionicons name={s.icon as any} size={16} color={s.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={suggestionStyles.label}>{s.label}</Text>
                            {s.subLabel && (
                                <Text style={suggestionStyles.subLabel}>{s.subLabel}</Text>
                            )}
                        </View>
                        <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.25)" />
                    </TouchableOpacity>
                </React.Fragment>
            ))}
        </MotiView>
    );
}

const suggestionStyles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginTop: -12,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: { color: '#fff', fontSize: 14, fontWeight: '700' },
    subLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500', marginTop: 1 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function AlbumScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const user = useContext(MyUserContext);
    const { pins, loading: pinsLoading, refetch } = useMyPins();

    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userAlbums, setUserAlbums] = useState<Album[]>([]);
    const [contextAlbum, setContextAlbum] = useState<Album | null>(null);
    const [renameAlbum, setRenameAlbum] = useState<Album | null>(null);
    const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);

    const scrollY = useSharedValue(0);
    const shimmerProgress = useSharedValue(0);

    useEffect(() => {
        shimmerProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withDelay(5000, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );
    }, []);

    const loadUserAlbums = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) setUserAlbums(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    useFocusEffect(useCallback(() => {
        loadUserAlbums();
    }, [loadUserAlbums]));

    const saveUserAlbums = async (albums: Album[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(albums));
        } catch { /* ignore */ }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const onScroll = useAnimatedScrollHandler({ onScroll: e => { scrollY.value = e.contentOffset.y; } });

    const headerTextAnim = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, 120], [1, 0], Extrapolate.CLAMP),
        transform: [
            { translateY: interpolate(scrollY.value, [0, 120], [0, -10], Extrapolate.CLAMP) },
            { scale: interpolate(scrollY.value, [0, 120], [1, 0.9], Extrapolate.CLAMP) },
        ],
    }));

    // Smart albums from pins
    const smartAlbums = useMemo(() => buildSmartAlbums(pins), [pins]);

    // Filter user albums by search
    const filteredUserAlbums = useMemo(() => {
        if (!searchQuery.trim()) return userAlbums;
        const q = searchQuery.toLowerCase();
        return userAlbums.filter(a => a.name.toLowerCase().includes(q));
    }, [userAlbums, searchQuery]);

    // Filter smart albums by search
    const filteredSmartAlbums = useMemo(() => {
        if (!searchQuery.trim()) return smartAlbums;
        const q = searchQuery.toLowerCase();
        return smartAlbums.filter(a => a.name.toLowerCase().includes(q));
    }, [smartAlbums, searchQuery]);

    // 2-column grid rows
    const albumRows = useMemo(() => {
        const rows: Album[][] = [];
        for (let i = 0; i < filteredUserAlbums.length; i += 2) {
            rows.push(filteredUserAlbums.slice(i, i + 2));
        }
        return rows;
    }, [filteredUserAlbums]);

    const coverUri = useMemo(() => {
        if (!user?.cover) return require('@/assets/images/mascot_whispery.png');
        if (user.cover.startsWith('http')) return user.cover;
        return `${BASE_URL}${user.cover.startsWith('/') ? '' : '/'}${user.cover}`;
    }, [user]);

    const navigateToAlbum = (album: Album) => {
        router.push({
            pathname: '/(tabs)/album/[id]',
            params: {
                id: album.id,
                title: album.name,
                sectionKey: album.sectionKey ?? '',
                type: album.type,
                accentColor: album.accentColor ?? '#7c3aed',
            },
        });
    };

    const handleLongPress = (album: Album) => {
        if (album.type === 'smart') return;
        setContextAlbum(album);
    };

    const handleRename = () => {
        setRenameAlbum(contextAlbum);
        setContextAlbum(null);
    };

    const handleRenameConfirm = async (newName: string) => {
        if (!renameAlbum) return;
        const updated = userAlbums.map(a => a.id === renameAlbum.id ? { ...a, name: newName } : a);
        setUserAlbums(updated);
        await saveUserAlbums(updated);
        setRenameAlbum(null);
    };

    const handleDelete = () => {
        if (!contextAlbum) return;
        Alert.alert(
            'Xóa album',
            `Bạn có chắc muốn xóa "${contextAlbum.name}"? Các chốt giọng trong album sẽ không bị xóa.`,
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const updated = userAlbums.filter(a => a.id !== contextAlbum.id);
                        setUserAlbums(updated);
                        await saveUserAlbums(updated);
                        setContextAlbum(null);
                    },
                },
            ]
        );
        setContextAlbum(null);
    };

    const handleShare = () => {
        setContextAlbum(null);
        Alert.alert('Chia sẻ album', 'Tính năng chia sẻ sẽ sớm ra mắt.');
    };

    // Show VoicePin turntable if a pin is selected
    if (selectedPin) {
        return (
            <View style={{ flex: 1 }}>
                <StatusBar barStyle="light-content" />
                <VoicePinTurntable pin={selectedPin} onClose={() => setSelectedPin(null)} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={isDark ? ['#1e1b4b', '#000'] : ['#f5f3ff', '#fff']}
                    style={StyleSheet.absoluteFill}
                />
                <MotiView
                    from={{ opacity: 0.2, scale: 1 }}
                    animate={{ opacity: 0.4, scale: 1.5 }}
                    transition={{ loop: true, type: 'timing', duration: 15000, repeatReverse: true }}
                    style={[styles.auraCircle, { backgroundColor: isDark ? '#4338ca' : '#ddd6fe', top: -50, right: -100 }]}
                />
                <BlurView 
                    intensity={isDark ? 100 : 60} 
                    tint={isDark ? "dark" : "light"} 
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
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <MotiView
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                        >
                            <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>Album</Text>
                            <Text style={styles.subtitle}>Xem các bộ sưu tập của bạn</Text>
                        </MotiView>
                    </View>
                    <TouchableOpacity 
                        onPress={() => router.push('/(tabs)/album/create')}
                        style={[styles.headerIconBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    >
                        <Ionicons name="add" size={24} color={currentTheme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* ── Glass Search Bar ── */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 200 }}
                    style={styles.searchWrapper}
                >
                    <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.searchBlur, { 
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'
                    }]}>
                        <Ionicons name="search-outline" size={18} color={isDark ? "rgba(255,255,255,0.5)" : "#6b7280"} />
                        <TextInput
                            style={[styles.searchInput, { color: isDark ? '#fff' : '#111827' }]}
                            placeholder="Tìm kiếm album, cảm xúc, địa điểm..."
                            placeholderTextColor={isDark ? "rgba(255,255,255,0.35)" : "#9ca3af"}
                            value={searchQuery}
                            onChangeText={v => { setSearchQuery(v); setShowSuggestions(v.length > 0); }}
                            onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); }}>
                                <Ionicons name="close-circle" size={16} color={isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"} />
                            </TouchableOpacity>
                        )}
                    </BlurView>
                </MotiView>

                {/* ── Smart Search Suggestions ── */}
                {showSuggestions && searchQuery.length > 0 && (
                    <SearchSuggestions
                        query={searchQuery}
                        smartAlbums={smartAlbums}
                        userAlbums={userAlbums}
                        onSelectAlbum={navigateToAlbum}
                        onDismiss={() => setShowSuggestions(false)}
                    />
                )}

                {/* ── Smart Albums Row ── */}
                {filteredSmartAlbums.length > 0 && (
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 300 }}
                    >
                        <SectionHeader
                            icon="sparkles"
                            title="Bộ sưu tập nổi bật"
                            iconColor="#a78bfa"
                        />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.smartRow}
                        >
                            {filteredSmartAlbums.map((album, i) => (
                                <SmartAlbumCard
                                    key={album.id}
                                    album={album}
                                    onPress={() => navigateToAlbum(album)}
                                    index={i}
                                />
                            ))}
                        </ScrollView>
                    </MotiView>
                )}

                {/* ── My Albums Grid ── */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 450 }}
                >
                    <SectionHeader
                        icon="albums"
                        title="Của tôi"
                        iconColor="#34d399"
                        rightAction={
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/album/create')}
                                style={styles.addBtn}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                                <Ionicons name="add" size={16} color="#fff" />
                                <Text style={styles.addBtnText}>Tạo mới</Text>
                            </TouchableOpacity>
                        }
                    />

                    {filteredUserAlbums.length === 0 ? (
                        <AlbumEmptyState
                            onPress={() => router.push('/(tabs)/album/create')}
                            hasSearch={searchQuery.length > 0}
                        />
                    ) : (
                        <View style={styles.gridContainer}>
                            {albumRows.map((row, rowIdx) => (
                                <View key={rowIdx} style={styles.gridRow}>
                                    {row.map((album, colIdx) => (
                                        <AlbumCard
                                            key={album.id}
                                            album={album}
                                            onPress={() => navigateToAlbum(album)}
                                            onLongPress={() => handleLongPress(album)}
                                            index={rowIdx * 2 + colIdx}
                                        />
                                    ))}
                                    {row.length === 1 && (
                                        <TouchableOpacity
                                            onPress={() => router.push('/(tabs)/album/create')}
                                            style={styles.newAlbumPlaceholder}
                                            activeOpacity={0.7}
                                        >
                                            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                                            <Ionicons name="add" size={32} color="rgba(255,255,255,0.3)" />
                                            <Text style={styles.newAlbumText}>Tạo album mới</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </MotiView>

                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* ── Floating Create Button ── */}
            <MotiView
                from={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 600, type: 'spring', damping: 14 }}
                style={styles.fab}
            >
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/album/create')}
                    activeOpacity={0.85}
                    style={styles.fabInner}
                >
                    <LinearGradient
                        colors={['#7c3aed', '#4338ca']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            </MotiView>

            {/* ── Context Menu ── */}
            <ContextMenu
                album={contextAlbum}
                onDismiss={() => setContextAlbum(null)}
                onRename={handleRename}
                onDelete={handleDelete}
                onShare={handleShare}
            />

            {/* ── Rename Modal ── */}
            <RenameModal
                album={renameAlbum}
                onDismiss={() => setRenameAlbum(null)}
                onConfirm={handleRenameConfirm}
            />
        </View>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────

function SectionHeader({ title, iconColor, rightAction }: {
    title: string;
    iconColor: string;
    rightAction?: React.ReactNode;
}) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDash, { backgroundColor: iconColor }]} />
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            {rightAction}
        </View>
    );
}

// ─── Empty State ─────────────────────────────────────────────────────────

function AlbumEmptyState({ onPress, hasSearch }: { onPress: () => void; hasSearch: boolean }) {
    return (
        <View style={styles.emptyContainer}>
            <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={styles.emptyIconCircle}
            >
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="albums-outline" size={48} color="#7c3aed" />
            </MotiView>
            <Text style={styles.emptyTitle}>{hasSearch ? 'Không tìm thấy' : 'Chưa có album'}</Text>
            <Text style={styles.emptySubtitle}>
                {hasSearch
                    ? 'Thử tìm kiếm với từ khoá khác'
                    : 'Tạo album để sắp xếp những chốt\ngiọng theo chủ đề của riêng bạn.'}
            </Text>
            {!hasSearch && (
                <TouchableOpacity onPress={onPress} style={styles.emptyBtn} activeOpacity={0.85}>
                    <LinearGradient
                        colors={['#7c3aed', '#4338ca']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.emptyBtnText}>Tạo album đầu tiên</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    fullscreenBg: { width: '100%', height: '100%', resizeMode: 'cover' },
    auraCircle: {
        position: 'absolute',
        width: width,
        height: width,
        borderRadius: width / 2,
    },
    scrollContent: { paddingTop: 0 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 70,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
    subtitle: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginTop: -2 },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    // Search
    searchWrapper: { paddingHorizontal: 20, marginBottom: 24 },
    searchBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 15,
        gap: 10,
        paddingHorizontal: 24,
    },
    sectionDash: { width: 3, height: 14, borderRadius: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af' },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

    // Smart Albums Row
    smartRow: {
        paddingHorizontal: 20,
        paddingBottom: 28,
        paddingTop: 4,
    },

    // Add button
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    // Grid
    gridContainer: { paddingHorizontal: GRID_PADDING },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: GRID_GAP,
    },
    newAlbumPlaceholder: {
        width: ALBUM_CARD_WIDTH,
        height: ALBUM_CARD_WIDTH * 1.3,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    newAlbumText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 108,
        right: 24,
    },
    fabInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        elevation: 16,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
    },

    // Context Menu
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contextMenu: {
        position: 'absolute',
        bottom: 110,
        left: 20,
        right: 20,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 6,
    },
    contextTitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    contextDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 16,
    },
    contextItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    contextItemText: { fontSize: 16, fontWeight: '600', color: '#fff' },

    // Rename Modal
    renameModal: {
        position: 'absolute',
        top: height * 0.3,
        left: 30,
        right: 30,
        borderRadius: 24,
        overflow: 'hidden',
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    renameTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16 },
    renameInput: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    renameActions: { flexDirection: 'row', gap: 12 },
    renameBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    renameBtnCancel: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '700' },
    renameBtnPrimary: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
    renameBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 10 },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
