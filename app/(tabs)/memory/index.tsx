import VoicePinTurntable from '@/components/home/VoicePinCard';
import { useMyPins } from '@/hooks/useMyPins';
import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

// ─── Emotion meta ─────────────────────────────────────────
const EMOTION_META: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap; vi: string }> = {
  Happy: { color: '#facc15', bg: '#fffbeb', icon: 'sunny-outline', vi: 'Vui vẻ' },
  Sad: { color: '#60a5fa', bg: '#eff6ff', icon: 'rainy-outline', vi: 'Buồn bã' },
  Calm: { color: '#34d399', bg: '#ecfdf5', icon: 'leaf-outline', vi: 'Bình yên' },
  Nostalgic: { color: '#f472b6', bg: '#fdf2f8', icon: 'hourglass-outline', vi: 'Nhớ nhung' },
  Romantic: { color: '#fb7185', bg: '#fff1f2', icon: 'heart-outline', vi: 'Lãng mạn' },
  Curious: { color: '#a78bfa', bg: '#f5f3ff', icon: 'telescope-outline', vi: 'Tò mò' },
  Angry: { color: '#f87171', bg: '#fef2f2', icon: 'flame-outline', vi: 'Bực bội' },
};
const DEFAULT_META = { color: '#9ca3af', bg: '#f9fafb', icon: 'mic-outline' as keyof typeof Ionicons.glyphMap, vi: 'Chưa phân loại' };

function getEmotionMeta(label?: string) {
  return label ? (EMOTION_META[label] ?? DEFAULT_META) : DEFAULT_META;
}

function StackedThumbs({ pins }: { pins: VoicePin[] }) {
  const top3 = pins.slice(0, 3);
  return (
    <View style={stack.container}>
      {top3.map((p, i) => {
        const angle = (i - 1) * 7; // -7, 0, +7 degrees
        const zI = top3.length - i;
        return (
          <View
            key={p.id}
            style={[
              stack.frame,
              {
                transform: [{ rotate: `${angle}deg` }],
                zIndex: zI,
                left: i * 6,
                top: i * 2,
              },
            ]}
          >
            {p.imageUrl ? (
              <Image source={{ uri: p.imageUrl }} style={stack.img} />
            ) : (
              <View style={[stack.img, stack.placeholder]}>
                <Ionicons name="mic" size={26} color="#d1d5db" />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const stack = StyleSheet.create({
  container: {
    width: CARD_W - 24,
    height: (CARD_W - 24) * 0.75,
    position: 'relative',
    marginBottom: 12,
    alignSelf: 'center',
  },
  frame: {
    position: 'absolute',
    width: (CARD_W - 40),
    height: (CARD_W - 40) * 0.75,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: '#e5e7eb',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Album card (one emotion group) ──────────────────────
function AlbumCard({ emotion, pins, onPress }: { emotion: string; pins: VoicePin[]; onPress: () => void }) {
  const meta = getEmotionMeta(emotion);
  return (
    <TouchableOpacity style={[card.container, { backgroundColor: meta.bg }]} onPress={onPress} activeOpacity={0.88}>
      <StackedThumbs pins={pins} />
      <View style={card.footer}>
        <View style={[card.iconBadge, { backgroundColor: meta.color + '22' }]}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
        </View>
        <Text style={card.label} numberOfLines={1}>{meta.vi}</Text>
      </View>
      <View style={card.countBadge}>
        <Text style={card.countText}>{pins.length}</Text>
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  container: {
    width: CARD_W,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    position: 'relative',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.08,
    // shadowRadius: 12,
    elevation: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  countBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Emotion detail list ──────────────────────────────────
function EmotionDetail({
  emotion, pins, onBack, onSelectPin,
}: { emotion: string; pins: VoicePin[]; onBack: () => void; onSelectPin: (p: VoicePin) => void }) {
  const meta = getEmotionMeta(emotion);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatDur = (s?: number) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--:--';

  return (
    <View style={[detail.container, { backgroundColor: meta.bg }]}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={detail.header}>
        <TouchableOpacity onPress={onBack} style={detail.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <View style={detail.headerTitle}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
          <Text style={detail.titleText}>{meta.vi}</Text>
        </View>
        <Text style={detail.countLabel}>{pins.length} ký ức</Text>
      </View>

      <FlatList
        data={pins}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        renderItem={({ item: pin }) => (
          <TouchableOpacity style={detail.pinCard} onPress={() => onSelectPin(pin)} activeOpacity={0.85}>
            {pin.imageUrl ? (
              <Image source={{ uri: pin.imageUrl }} style={detail.pinThumb} />
            ) : (
              <View style={[detail.pinThumb, detail.pinThumbPlaceholder]}>
                <Ionicons name="mic" size={22} color={meta.color} />
              </View>
            )}
            <View style={detail.pinInfo}>
              <Text style={detail.pinContent} numberOfLines={2}>
                {pin.content ?? 'Ký ức không có tiêu đề'}
              </Text>
              <View style={detail.pinMeta}>
                <Ionicons name="location-outline" size={12} color="#9ca3af" />
                <Text style={detail.pinMetaText} numberOfLines={1}>
                  {pin.address ?? 'Vị trí không xác định'}
                </Text>
              </View>
              <View style={detail.pinMeta}>
                <Ionicons name="time-outline" size={12} color="#9ca3af" />
                <Text style={detail.pinMetaText}>{formatDate(pin.createdAt)}</Text>
                <Ionicons name="timer-outline" size={12} color="#9ca3af" style={{ marginLeft: 8 }} />
                <Text style={detail.pinMetaText}>{formatDur(pin.duration)}</Text>
              </View>
              <View style={detail.pinStats}>
                <Ionicons name="headset-outline" size={12} color="#8b5cf6" />
                <Text style={detail.statText}>{pin.listensCount}</Text>
                <Ionicons name="heart-outline" size={12} color="#f87171" style={{ marginLeft: 8 }} />
                <Text style={detail.statText}>{pin.reactionsCount}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const detail = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleText: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  countLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pinThumb: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
  },
  pinThumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInfo: { flex: 1, gap: 4 },
  pinContent: { fontSize: 14, fontWeight: '600', color: '#1f2937', lineHeight: 19 },
  pinMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinMetaText: { fontSize: 11, color: '#9ca3af', flex: 1 },
  pinStats: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statText: { fontSize: 11, color: '#6b7280', marginLeft: 3 },
});

// ─── Main Memory Screen ───────────────────────────────────
export default function MemoryScreen() {
  const { pins, loading, error, refetch } = useMyPins();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);

  // Group pins by emotionLabel
  const groups = useMemo(() => {
    const map: Record<string, VoicePin[]> = {};
    for (const p of pins) {
      const key = p.emotionLabel ?? 'Chưa phân loại';
      (map[key] = map[key] ?? []).push(p);
    }
    // Sort groups by count desc
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [pins]);

  const totalCount = pins.length;

  // ── Show VoicePinCard overlay ─────────────────────────
  if (selectedPin) {
    return (
      <VoicePinTurntable
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
      />
    );
  }

  // ── Show emotion detail ───────────────────────────────
  if (selectedEmotion) {
    const emotionPins = groups.find(([e]) => e === selectedEmotion)?.[1] ?? [];
    return (
      <EmotionDetail
        emotion={selectedEmotion}
        pins={emotionPins}
        onBack={() => setSelectedEmotion(null)}
        onSelectPin={(p) => setSelectedPin(p)}
      />
    );
  }

  // ── Bookshelf grid ────────────────────────────────────
  return (
    <View style={main.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={main.header}>
        <View>
          <Text style={main.title}>Ký ức của tôi</Text>
          <Text style={main.subtitle}>{totalCount} giọng nói đã lưu</Text>
        </View>
        <TouchableOpacity onPress={refetch} style={main.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      {/* Loading / Error */}
      {loading && (
        <View style={main.center}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={main.centerText}>Đang tải ký ức...</Text>
        </View>
      )}
      {!!error && !loading && (
        <View style={main.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#d1d5db" />
          <Text style={main.centerText}>{error}</Text>
          <TouchableOpacity style={main.retryBtn} onPress={refetch}>
            <Text style={main.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
      {!loading && !error && groups.length === 0 && (
        <View style={main.center}>
          <Ionicons name="mic-off-outline" size={56} color="#d1d5db" />
          <Text style={main.emptyTitle}>Chưa có ký ức nào</Text>
          <Text style={main.emptySubtitle}>Hãy ghi âm giọng nói đầu tiên của bạn!</Text>
        </View>
      )}

      {/* 2-column bookshelf grid */}
      {!loading && groups.length > 0 && (
        <ScrollView contentContainerStyle={main.grid} showsVerticalScrollIndicator={false}>
          {/* Pair up groups into rows */}
          {Array.from({ length: Math.ceil(groups.length / 2) }, (_, i) => {
            const left = groups[i * 2];
            const right = groups[i * 2 + 1];
            return (
              <View key={i} style={main.row}>
                <AlbumCard
                  emotion={left[0]}
                  pins={left[1]}
                  onPress={() => setSelectedEmotion(left[0])}
                />
                {right ? (
                  <AlbumCard
                    emotion={right[0]}
                    pins={right[1]}
                    onPress={() => setSelectedEmotion(right[0])}
                  />
                ) : (
                  <View style={{ width: CARD_W }} />
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const main = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fafafa',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 3 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: { paddingHorizontal: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  centerText: { color: '#9ca3af', fontSize: 15, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
