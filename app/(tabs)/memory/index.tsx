import VoicePinTurntable from '@/components/home/VoicePinCard';
import { Colors } from '@/constants/Colors';
import { useMyPins } from '@/hooks/useMyPins';
import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation, SharedValue, withSpring } from 'react-native-reanimated';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.6;
export const CARD_SPACING = 12;

// ─── Emotion meta ─────────────────────────────────────────
const EMOTION_META: Record<string, { color: string; gradient: string; icon: keyof typeof Ionicons.glyphMap; vi: string }> = {
  Happy: { color: '#f59e0b', gradient: '#fef3c7', icon: 'sunny-outline', vi: 'Vui vẻ' },
  Sad: { color: '#3b82f6', gradient: '#dbeafe', icon: 'rainy-outline', vi: 'Buồn bã' },
  Calm: { color: '#10b981', gradient: '#d1fae5', icon: 'leaf-outline', vi: 'Bình yên' },
  Nostalgic: { color: '#ec4899', gradient: '#fce7f3', icon: 'hourglass-outline', vi: 'Nhớ nhung' },
  Romantic: { color: '#f43f5e', gradient: '#ffe4e6', icon: 'heart-outline', vi: 'Lãng mạn' },
  Curious: { color: '#8b5cf6', gradient: '#ede9fe', icon: 'telescope-outline', vi: 'Tò mò' },
  Angry: { color: '#ef4444', gradient: '#fee2e2', icon: 'flame-outline', vi: 'Bực bội' },
  Relaxed: { color: '#14b8a6', gradient: '#ccfbf1', icon: 'water-outline', vi: 'Thư giãn' },
  Excited: { color: '#f97316', gradient: '#ffedd5', icon: 'flash-outline', vi: 'Phấn khích' },
  Mysterious: { color: '#6366f1', gradient: '#e0e7ff', icon: 'eye-outline', vi: 'Bí ẩn' },
  Thoughtful: { color: '#8b5cf6', gradient: '#f3e8ff', icon: 'bulb-outline', vi: 'Trầm tư' },
  Enthusiastic: { color: '#f59e0b', gradient: '#fef9c3', icon: 'rocket-outline', vi: 'Nhiệt huyết' },
  Inspiring: { color: '#06b6d4', gradient: '#cffafe', icon: 'sparkles-outline', vi: 'Cảm hứng' },
};
const DEFAULT_META = { color: '#9ca3af', gradient: '#f3f4f6', icon: 'mic-outline' as keyof typeof Ionicons.glyphMap, vi: 'Khác' };

export function getMeta(label?: string) {
  return label ? (EMOTION_META[label] ?? DEFAULT_META) : DEFAULT_META;
}

export function getPinImage(pin: VoicePin): string | undefined {
  return pin.images?.[0]?.imageUrl ?? pin.imageUrl;
}

// ─── Filter chips ─────────────────────────────────────────
type FilterType = 'mood' | 'time' | 'visibility' | 'location';
const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'mood', label: 'Tâm trạng', icon: 'happy-outline' },
  { key: 'time', label: 'Thời gian', icon: 'time-outline' },
  { key: 'visibility', label: 'Quyền riêng tư', icon: 'lock-closed-outline' },
  { key: 'location', label: 'Địa điểm', icon: 'location-outline' },
];

function FilterChips({ active, onChange }: { active: FilterType; onChange: (f: FilterType) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterStyles.row}>
      {FILTERS.map(f => {
        const isActive = f.key === active;
        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[filterStyles.chip, isActive && filterStyles.chipActive]}
            activeOpacity={0.7}
          >
            <Ionicons name={f.icon} size={14} color={isActive ? '#fff' : '#6b7280'} />
            <Text style={[filterStyles.chipText, isActive && filterStyles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const filterStyles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
});

// ─── Waveform (visual only) ──────────────────────────────
export function Waveform({ color, barCount = 20 }: { color: string; barCount?: number }) {
  const bars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < barCount; i++) {
      // Create a gentle parabolic wave pattern with some randomness
      const norm = i / (barCount - 1);
      const base = Math.sin(norm * Math.PI) * 0.7 + 0.3;
      const random = 0.85 + Math.random() * 0.3;
      arr.push(Math.min(1, base * random));
    }
    return arr;
  }, [barCount]);

  return (
    <View style={waveStyles.container}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={[
            waveStyles.bar,
            {
              height: 4 + h * 18,
              backgroundColor: color,
              opacity: 0.4 + h * 0.5,
            },
          ]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
    height: 24,
    marginTop: 8,
  },
  bar: {
    width: 2.5,
    borderRadius: 2,
  },
});

// ─── Memory Card ──────────────────────────────────────────
export function MemoryCard({ pin, onPress, customWidth, customMarginRight, index, scrollX }: { pin: VoicePin; onPress: () => void; customWidth?: number; customMarginRight?: number; index?: number; scrollX?: SharedValue<number> }) {
  const meta = getMeta(pin.emotionLabel);
  const imgUrl = getPinImage(pin);
  const pressedScale = useSharedValue(1);

  const handlePressIn = () => {
    pressedScale.value = withSpring(0.96, { mass: 1, damping: 20, stiffness: 300 });
  };
  const handlePressOut = () => {
    pressedScale.value = withSpring(1, { mass: 1, damping: 20, stiffness: 300 });
  };

  const ITEM_SIZE = CARD_WIDTH + CARD_SPACING;

  const animatedStyle = useAnimatedStyle(() => {
    let carouselScale = 1;
    let opacity = 1;

    if (index !== undefined && scrollX !== undefined) {
      carouselScale = interpolate(
        scrollX.value,
        [(index - 1) * ITEM_SIZE, index * ITEM_SIZE, (index + 1) * ITEM_SIZE],
        [0.85, 1, 0.85],
        Extrapolation.CLAMP
      );
      opacity = interpolate(
        scrollX.value,
        [(index - 1.5) * ITEM_SIZE, index * ITEM_SIZE, (index + 1.5) * ITEM_SIZE],
        [0.7, 1, 0.7],
        Extrapolation.CLAMP
      );
    }

    return {
      transform: [{ scale: carouselScale * pressedScale.value }],
      opacity,
    };
  });

  const dateStr = new Date(pin.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
  });

  const w = customWidth ?? CARD_WIDTH;
  const mr = customMarginRight ?? CARD_SPACING;

  return (
    <Animated.View style={[{ width: w, marginRight: mr }, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        className="rounded-[20px] overflow-hidden"
        style={{
          backgroundColor: meta.gradient,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 5
        }}
      >
        {/* Mood badge */}
        <View className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full justify-center items-center" style={{ backgroundColor: meta.color + '20' }}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
        </View>

        {/* Image */}
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} className="w-full bg-gray-100" style={{ height: w * 0.6 }} />
        ) : (
          <View className="w-full bg-gray-100 justify-center items-center" style={{ height: w * 0.6 }}>
            <Ionicons name="musical-notes-outline" size={32} color={meta.color + '60'} />
          </View>
        )}

        {/* Info */}
        <View className="p-3 gap-0.5">
          <Text className="text-[13px] font-bold text-gray-800 leading-[18px]" numberOfLines={2}>
            {pin.content ?? 'Ký ức giọng nói'}
          </Text>

          <View className="flex-row items-center gap-[3px] mt-[3px]">
            <Ionicons name="location-outline" size={11} color="#9ca3af" />
            <Text className="text-[10px] text-gray-400 flex-1" numberOfLines={1}>
              {pin.address ?? 'Không rõ vị trí'}
            </Text>
          </View>

          <Waveform color={meta.color} />

          <View className="flex-row justify-between items-center mt-1.5">
            <Text className="text-[10px] text-[#b0b0b0] font-medium">{dateStr}</Text>
            <View className="flex-row items-center gap-[2px]">
              <Ionicons name="headset-outline" size={10} color="#9ca3af" />
              <Text className="text-[10px] text-[#b0b0b0] ml-[2px]">{pin.listensCount ?? 0}</Text>
              <Ionicons name="heart" size={10} color="#f9a8d4" style={{ marginLeft: 6 }} />
              <Text className="text-[10px] text-[#b0b0b0] ml-[2px]">{pin.reactionsCount ?? 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const memCard = StyleSheet.create({
  wrapper: { width: CARD_WIDTH, marginRight: CARD_SPACING },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  moodBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 0.6,
    backgroundColor: '#f3f4f6',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: 12,
    gap: 2,
  },
  content: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  metaText: {
    fontSize: 10,
    color: '#9ca3af',
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    fontSize: 10,
    color: '#b0b0b0',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontSize: 10,
    color: '#b0b0b0',
    marginLeft: 2,
  },
});

// ─── Section (carousel) ──────────────────────────────────
function Section({
  title,
  icon,
  iconColor,
  pins,
  onSeeAll,
  onSelectPin,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  pins: VoicePin[];
  onSeeAll?: () => void;
  onSelectPin: (p: VoicePin) => void;
}) {
  if (pins.length === 0) return null;
  const displayPins = pins.slice(0, 10);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View className="mb-7">
      <View className="flex-row justify-between items-center px-5 mb-3.5">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full justify-center items-center" style={{ backgroundColor: iconColor + '18' }}>
            <Ionicons name={icon} size={14} color={iconColor} />
          </View>
          <Text className="text-base font-bold text-gray-800 tracking-tight">{title}</Text>
        </View>
        {pins.length > 10 && onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} className="flex-row items-center gap-0.5">
            <Text className="text-xs font-semibold" style={{ color: Colors.primary }}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        data={displayPins}
        horizontal
        keyExtractor={p => String(p.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <MemoryCard pin={item} onPress={() => onSelectPin(item)} index={index} scrollX={scrollX} />
        )}
      />
    </View>
  );
}

const section = StyleSheet.create({
  container: { marginBottom: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});

// ─── Main Memory Screen ───────────────────────────────────
export default function MemoryScreen() {
  const router = useRouter();
  const { pins, loading, error, refetch } = useMyPins();
  const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('mood');
  const [refreshing, setRefreshing] = useState(false);

  const handleFilterChange = (f: FilterType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(f);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return pins;
    const q = searchQuery.toLowerCase();
    return pins.filter(p =>
      (p.content?.toLowerCase().includes(q)) ||
      (p.address?.toLowerCase().includes(q)) ||
      (p.emotionLabel?.toLowerCase().includes(q))
    );
  }, [pins, searchQuery]);

  // Build sections
  const sections = useMemo(() => {
    const now = new Date();
    const result: { key: string; title: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; pins: VoicePin[] }[] = [];

    if (activeFilter === 'time') {
      // 1. Recently Added (last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recent = filtered
        .filter(p => new Date(p.createdAt) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (recent.length > 0) {
        result.push({ key: 'recent', title: 'Mới thêm gần đây', icon: 'time-outline', iconColor: '#8b5cf6', pins: recent });
      }

      // 2. This Month
      const thisMonth = filtered
        .filter(p => {
          const d = new Date(p.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (thisMonth.length > 0) {
        result.push({ key: 'month', title: 'Tháng này', icon: 'calendar-outline', iconColor: '#3b82f6', pins: thisMonth });
      }

      // Group by month-year for older ones
      const timeMap: Record<string, VoicePin[]> = {};
      for (const p of filtered) {
        const d = new Date(p.createdAt);
        // Avoid grouping this month and recent here to avoid duplicates
        const isRecent = new Date(p.createdAt) >= sevenDaysAgo;
        const isThisMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (isRecent || isThisMonth) continue;

        const key = d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
        (timeMap[key] = timeMap[key] ?? []).push(p);
      }
      const sortedTime = Object.entries(timeMap)
        .sort((a, b) => new Date(b[1][0].createdAt).getTime() - new Date(a[1][0].createdAt).getTime());
      for (const [label, tpins] of sortedTime) {
        result.push({ key: `time-${label}`, title: label, icon: 'calendar-outline', iconColor: '#10b981', pins: tpins });
      }
    }

    if (activeFilter === 'mood') {
      // Group by emotion
      const emotionMap: Record<string, VoicePin[]> = {};
      for (const p of filtered) {
        const key = p.emotionLabel ?? 'Khác';
        (emotionMap[key] = emotionMap[key] ?? []).push(p);
      }
      const sorted = Object.entries(emotionMap).sort((a, b) => b[1].length - a[1].length);
      for (const [emotion, epins] of sorted) {
        const meta = getMeta(emotion);
        result.push({ key: `emo-${emotion}`, title: meta.vi, icon: meta.icon, iconColor: meta.color, pins: epins });
      }
    }

    if (activeFilter === 'visibility') {
      const visMap: Record<string, VoicePin[]> = {};
      for (const p of filtered) {
        const key = p.visibility ?? 'PRIVATE';
        (visMap[key] = visMap[key] ?? []).push(p);
      }
      const VIS_META: Record<string, { label: string, icon: keyof typeof Ionicons.glyphMap, color: string }> = {
        'PRIVATE': { label: 'Chỉ mình tôi', icon: 'lock-closed-outline', color: '#6b7280' },
        'FRIENDS': { label: 'Bạn bè', icon: 'people-outline', color: '#3b82f6' },
        'PUBLIC': { label: 'Công khai', icon: 'earth-outline', color: '#10b981' }
      };

      const sorted = Object.entries(visMap).sort((a, b) => b[1].length - a[1].length);
      for (const [vis, vpins] of sorted) {
        const meta = VIS_META[vis] || VIS_META['PRIVATE'];
        result.push({ key: `vis-${vis}`, title: meta.label, icon: meta.icon, iconColor: meta.color, pins: vpins });
      }
    }

    if (activeFilter === 'location') {
      // Group by location (extract city/district)
      const locMap: Record<string, VoicePin[]> = {};
      for (const p of filtered) {
        if (!p.address) continue;
        const parts = p.address.split(',').map(s => s.trim());
        const cityKey = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
        (locMap[cityKey] = locMap[cityKey] ?? []).push(p);
      }
      const sortedLoc = Object.entries(locMap).sort((a, b) => b[1].length - a[1].length);
      for (const [loc, lpins] of sortedLoc) {
        if (lpins.length >= 1) {
          result.push({ key: `loc-${loc}`, title: loc, icon: 'location-outline', iconColor: '#f59e0b', pins: lpins });
        }
      }

      const noLoc = filtered.filter(p => !p.address);
      if (noLoc.length > 0) {
        result.push({ key: `loc-unknown`, title: 'Không rõ vị trí', icon: 'help-circle-outline', iconColor: '#9ca3af', pins: noLoc });
      }
    }

    // Deduplicate: remove sections with same key
    const seen = new Set<string>();
    return result.filter(s => {
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return true;
    });
  }, [filtered, activeFilter]);

  // ── Show VoicePinCard overlay ─────────────────────────
  if (selectedPin) {
    return (
      <VoicePinTurntable
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
      />
    );
  }

  return (
    <View style={main.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ── Header ─────────────────────────────── */}
        <View style={main.header}>
          <Text style={main.title}>Ký ức của tôi</Text>
          <Text style={main.subtitle}>
            {pins.length > 0 ? `${pins.length} khoảnh khắc` : 'Bắt đầu ghi lại kỷ niệm'}
          </Text>
        </View>

        {/* ── Search ─────────────────────────────── */}
        <View style={main.searchContainer}>
          <Ionicons name="search-outline" size={16} color="#b0b0b0" style={{ marginLeft: 14 }} />
          <TextInput
            style={main.searchInput}
            placeholder="Tìm theo nội dung, địa điểm..."
            placeholderTextColor="#c5c5c5"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingRight: 14 }}>
              <Ionicons name="close-circle" size={16} color="#d1d5db" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter chips ───────────────────────── */}
        <View style={{ marginBottom: 24 }}>
          <FilterChips active={activeFilter} onChange={handleFilterChange} />
        </View>

        {/* ── Loading ─────────────────────────────── */}
        {loading && (
          <View style={main.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={main.centerText}>Đang tải ký ức...</Text>
          </View>
        )}

        {/* ── Error ──────────────────────────────── */}
        {!!error && !loading && (
          <View style={main.center}>
            <Ionicons name="cloud-offline-outline" size={48} color="#d1d5db" />
            <Text style={main.centerText}>{error}</Text>
            <TouchableOpacity style={main.retryBtn} onPress={refetch}>
              <Text style={main.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Empty ──────────────────────────────── */}
        {!loading && !error && pins.length === 0 && (
          <View style={main.emptyContainer}>
            <View style={main.emptyIconBg}>
              <Ionicons name="musical-notes-outline" size={40} color={Colors.primary} />
            </View>
            <Text style={main.emptyTitle}>Chưa có ký ức nào</Text>
            <Text style={main.emptySubtitle}>
              Hãy ghi lại giọng nói đầu tiên{'\n'}để bắt đầu bộ sưu tập của bạn
            </Text>
          </View>
        )}

        {/* ── No search results ──────────────────── */}
        {!loading && !error && pins.length > 0 && filtered.length === 0 && (
          <View style={main.center}>
            <Ionicons name="search-outline" size={40} color="#d1d5db" />
            <Text style={main.centerText}>Không tìm thấy ký ức nào</Text>
          </View>
        )}

        {/* ── Sections ─────────────────────────────── */}
        {!loading && sections.map(s => (
          <Section
            key={s.key}
            title={s.title}
            icon={s.icon}
            iconColor={s.iconColor}
            pins={s.pins}
            onSelectPin={p => setSelectedPin(p)}
            onSeeAll={() => {
              router.push({
                pathname: '/(tabs)/memory/grid',
                params: { title: s.title, sectionKey: s.key, filter: activeFilter, query: searchQuery }
              });
            }}
          />
        ))}

        {/* Bottom breathing space */}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const main = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfd',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 13,
    color: '#b0b0b0',
    marginTop: 4,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  centerText: {
    color: '#b0b0b0',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#b0b0b0',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
