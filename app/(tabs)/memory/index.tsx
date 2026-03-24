import VoicePinTurntable from '@/components/home/VoicePinCard';
import { theme } from '@/constants/Theme';
import HistoryCalendar from '@/components/memory/HistoryCalendar';
import { useMyPins } from '@/hooks/useMyPins';
import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VoicePinCarousel from '@/components/memory/VoicePinCarousel';
import { VoicePinCarouselCard as MemoryCard } from '@/components/memory/VoicePinCarouselCard';
import React, { useCallback, useContext, useMemo, useState } from 'react';

export { MemoryCard };
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
  useColorScheme
} from 'react-native';
import { Text } from '@/components/ui/text';
import { MyUserContext } from '@/configs/Context';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.6;
export const CARD_SPACING = 12;

// ─── Emotion meta ─────────────────────────────────────────
const EMOTION_META: Record<string, { color: string; gradient: string; icon: keyof typeof Ionicons.glyphMap; vi: string }> = {
  Happy: { color: '#facc15', gradient: '#fef9c3', icon: 'sunny-outline', vi: 'Vui vẻ' },
  Sad: { color: '#60a5fa', gradient: '#eff6ff', icon: 'rainy-outline', vi: 'Buồn bã' },
  Calm: { color: '#34d399', gradient: '#ecfdf5', icon: 'leaf-outline', vi: 'Bình yên' },
  Nostalgic: { color: '#f472b6', gradient: '#fdf2f8', icon: 'hourglass-outline', vi: 'Nhớ nhung' },
  Romantic: { color: '#fb7185', gradient: '#fff1f2', icon: 'heart-outline', vi: 'Lãng mạn' },
  Curious: { color: '#a78bfa', gradient: '#f5f3ff', icon: 'telescope-outline', vi: 'Tò mò' },
  Angry: { color: '#f87171', gradient: '#fef2f2', icon: 'flame-outline', vi: 'Bực bội' },
};
const DEFAULT_META = { color: '#8b5cf6', gradient: '#f5f3ff', icon: 'mic-outline' as keyof typeof Ionicons.glyphMap, vi: 'Khác' };

export function getMeta(label?: string) {
  return label ? (EMOTION_META[label] ?? DEFAULT_META) : DEFAULT_META;
}

export function getPinImage(pin: VoicePin): string | undefined {
  return pin.images?.[0]?.imageUrl ?? pin.imageUrl;
}

// ─── Filter chips ─────────────────────────────────────────
type FilterType = 'mood' | 'time' | 'visibility' | 'location' | 'diary';
const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'mood', label: 'Tâm trạng', icon: 'happy-outline' },
  { key: 'diary', label: 'Nhật ký', icon: 'journal-outline' },
  { key: 'time', label: 'Thời gian', icon: 'time-outline' },
  { key: 'visibility', label: 'Quyền riêng tư', icon: 'lock-closed-outline' },
  { key: 'location', label: 'Địa điểm', icon: 'location-outline' },
];

function FilterChips({ active, onChange, currentTheme }: { active: FilterType; onChange: (f: FilterType) => void; currentTheme: any }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterStyles.row}>
      {FILTERS.map(f => {
        const isActive = f.key === active;
        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[
              filterStyles.chip,
              { backgroundColor: currentTheme.colors.background },
              isActive && { backgroundColor: currentTheme.colors.primary }
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name={f.icon} size={14} color={isActive ? '#fff' : currentTheme.colors.icon} />
            <Text style={[
              filterStyles.chipText,
              { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.sm },
              isActive && filterStyles.chipTextActive
            ]}>{f.label}</Text>
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
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chipText: { fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});

// ─── Waveform (visual only) ──────────────────────────────
export function Waveform({ color, barCount = 20 }: { color: string; barCount?: number }) {
  const bars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < barCount; i++) {
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

// Removed MemoryCard and Section - now using VoicePinCarousel

export default function MemoryScreen() {
  const colorScheme = useColorScheme() || 'light';
  const currentTheme = theme[colorScheme];
  const router = useRouter();
  const user = useContext(MyUserContext);
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
        result.push({ key: 'recent', title: 'Mới thêm gần đây', icon: 'time-outline', iconColor: currentTheme.colors.primary, pins: recent });
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

      const timeMap: Record<string, VoicePin[]> = {};
      for (const p of filtered) {
        const d = new Date(p.createdAt);
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

    const seen = new Set<string>();
    return result.filter(s => {
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return true;
    });
  }, [filtered, activeFilter]);

  if (selectedPin) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        {/* Import would be needed if VoicePinTurntable was used, but it's imported at top */}
        {/* Actually, let's keep it consistent, if it was imported, it works */}
        <VoicePinTurntable
            pin={selectedPin}
            onClose={() => setSelectedPin(null)}
        />
      </View>
    );
  }

  return (
    <View style={[main.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.colors.primary} />
        }
      >
        {/* Header */}
        <View style={main.header}>
          <Text style={[main.title, { color: currentTheme.colors.text, fontSize: 24, fontWeight: 'bold' }]}>Ký ức của tôi</Text>
          <Text style={[main.subtitle, { color: currentTheme.colors.icon, fontSize: 14 }]}>
            {pins.length > 0 ? `${pins.length} khoảnh khắc` : 'Bắt đầu ghi lại kỷ niệm'}
          </Text>
        </View>

        {/* Search */}
        <View style={[main.searchContainer, { backgroundColor: currentTheme.colors.icon + '10', borderRadius: currentTheme.radius.md }]}>
          <Ionicons name="search-outline" size={16} color={currentTheme.colors.icon} style={{ marginLeft: 14 }} />
          <TextInput
            style={[main.searchInput, { color: currentTheme.colors.text, fontSize: currentTheme.typography.fontSizes.sm }]}
            placeholder="Tìm theo nội dung, địa điểm..."
            placeholderTextColor={currentTheme.colors.icon + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingRight: 14 }}>
              <Ionicons name="close-circle" size={16} color={currentTheme.colors.icon + '40'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View style={{ marginBottom: 24 }}>
          <FilterChips active={activeFilter} onChange={handleFilterChange} currentTheme={currentTheme} />
        </View>

        {/* Loading */}
        {loading && (
          <View style={main.center}>
            <ActivityIndicator size="large" color={currentTheme.colors.primary} />
            <Text style={[main.centerText, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.sm }]}>Đang tải ký ức...</Text>
          </View>
        )}

        {/* Error */}
        {!!error && !loading && (
          <View style={main.center}>
            <Ionicons name="cloud-offline-outline" size={48} color={currentTheme.colors.icon + '40'} />
            <Text style={[main.centerText, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.sm }]}>{error}</Text>
            <TouchableOpacity
              style={[main.retryBtn, { backgroundColor: currentTheme.colors.primary, borderRadius: currentTheme.radius.full }]}
              onPress={refetch}
            >
              <Text style={main.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty */}
        {!loading && !error && pins.length === 0 && (
          <View style={main.emptyContainer}>
            <View style={[main.emptyIconBg, { backgroundColor: currentTheme.colors.primary + '10' }]}>
              <Ionicons name="musical-notes-outline" size={40} color={currentTheme.colors.primary} />
            </View>
            <Text style={[main.emptyTitle, { color: currentTheme.colors.text, fontSize: currentTheme.typography.fontSizes.lg }]}>Chưa có ký ức nào</Text>
            <Text style={[main.emptySubtitle, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.sm }]}>
              Hãy ghi lại giọng nói đầu tiên{'\n'}để bắt đầu bộ sưu tập của bạn
            </Text>
          </View>
        )}

        {/* No search results */}
        {!loading && !error && pins.length > 0 && filtered.length === 0 && (
          <View style={main.center}>
            <Ionicons name="search-outline" size={40} color={currentTheme.colors.icon + '40'} />
            <Text style={[main.centerText, { color: currentTheme.colors.icon, fontSize: currentTheme.typography.fontSizes.sm }]}>Không tìm thấy ký ức nào</Text>
          </View>
        )}

        {/* Sections */}
        {!loading && activeFilter !== 'diary' && sections.map(s => (
          <VoicePinCarousel
            key={s.key}
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
                params: { title: s.title, sectionKey: s.key, filter: activeFilter, query: searchQuery }
              });
            }}
          />
        ))}

        {/* Diary (Calendar) View */}
        {!loading && activeFilter === 'diary' && (
          <HistoryCalendar
            pins={filtered}
            currentTheme={currentTheme}
            onSelectPin={(p) => setSelectedPin(p)}
            startDate={user?.createdAt}
            onPressAddToday={() => {
              // Go back to the Map/Home tab so user can create a new voice pin
              router.replace('/home');
            }}
          />
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const main = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 4,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
