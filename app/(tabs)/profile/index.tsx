import { authApis, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { VoicePin, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Emotion colours ─────────────────────────────────────
const EMOTION_COLOR: Record<string, string> = {
  Happy: '#facc15', Sad: '#60a5fa', Calm: '#34d399',
  Nostalgic: '#f472b6', Romantic: '#fb7185', Curious: '#a78bfa', Angry: '#f87171',
};
const EMOTION_VI: Record<string, string> = {
  Happy: 'Vui vẻ', Sad: 'Buồn bã', Calm: 'Bình yên',
  Nostalgic: 'Nhớ nhung', Romantic: 'Lãng mạn', Curious: 'Tò mò', Angry: 'Bực bội',
};
function emotionColor(e?: string) { return e ? (EMOTION_COLOR[e] ?? '#8b5cf6') : '#8b5cf6'; }
function emotionVi(e?: string) { return e ? (EMOTION_VI[e] ?? e) : '—'; }
function fmtDur(s?: number | null) {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Stats ────────────────────────────────────────────────
interface Stats { voicePinCount?: number; totalListens?: number; locationCount?: number; friendCount?: number; }

// ─── Pin row card ─────────────────────────────────────────
function PinCard({ pin }: { pin: VoicePin }) {
  const color = emotionColor(pin.emotionLabel);
  return (
    <View style={pc.card}>
      {/* Emotion tag */}
      <View style={[pc.tag, { backgroundColor: color + '22' }]}>
        <View style={[pc.dot, { backgroundColor: color }]} />
        <Text style={[pc.tagText, { color }]}>{emotionVi(pin.emotionLabel)}</Text>
      </View>

      {/* Content */}
      <Text style={pc.content} numberOfLines={1}>
        {pin.content ?? 'Ký ức không có tiêu đề'}
      </Text>

      {/* Meta row */}
      <View style={pc.meta}>
        <Ionicons name="location-outline" size={11} color="#9ca3af" />
        <Text style={pc.metaText} numberOfLines={1}>{pin.address ?? '—'}</Text>
        <Text style={pc.metaDot}>·</Text>
        <Text style={pc.metaText}>{fmtDate(pin.createdAt)}</Text>
      </View>

      {/* Stats row */}
      <View style={pc.stats}>
        {fmtDur(pin.duration) && (
          <View style={pc.stat}>
            <Ionicons name="timer-outline" size={12} color="#9ca3af" />
            <Text style={pc.statTxt}>{fmtDur(pin.duration)}</Text>
          </View>
        )}
        <View style={pc.stat}>
          <Ionicons name="headset-outline" size={12} color="#9ca3af" />
          <Text style={pc.statTxt}>{pin.listensCount ?? 0}</Text>
        </View>
        <View style={pc.stat}>
          <Ionicons name="heart-outline" size={12} color="#f87171" />
          <Text style={pc.statTxt}>{pin.reactionsCount ?? 0}</Text>
        </View>
        <View style={pc.stat}>
          <Ionicons name="chatbubble-outline" size={12} color="#60a5fa" />
          <Text style={pc.statTxt}>{pin.commentsCount ?? 0}</Text>
        </View>
        <View style={[pc.visBadge, { backgroundColor: pin.visibility === 'PUBLIC' ? '#ecfdf5' : pin.visibility === 'FRIENDS' ? '#eff6ff' : '#fdf4ff' }]}>
          <Text style={[pc.visText, { color: pin.visibility === 'PUBLIC' ? '#10b981' : pin.visibility === 'FRIENDS' ? '#60a5fa' : '#a78bfa' }]}>
            {pin.visibility === 'PUBLIC' ? 'Công khai' : pin.visibility === 'FRIENDS' ? 'Bạn bè' : 'Riêng tư'}
          </Text>
        </View>
      </View>
    </View>
  );
}
const pc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 10, fontWeight: '700' },
  content: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6, flexWrap: 'nowrap' },
  metaText: { fontSize: 11, color: '#9ca3af', flexShrink: 1 },
  metaDot: { color: '#d1d5db', fontSize: 12 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statTxt: { fontSize: 11, color: '#6b7280' },
  visBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 'auto' },
  visText: { fontSize: 10, fontWeight: '700' },
});

// ─── Main ProfileScreen ───────────────────────────────────
export default function ProfileScreen() {
  const user = useContext(MyUserContext) as User | null;
  const dispatch = useContext(MyDispatchContext);

  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pins, setPins] = useState<VoicePin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pins' | 'top'>('pins');

  const fetchAll = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const api = authApis(token);
      const [pRes, sRes, vRes] = await Promise.all([
        api.get(endpoints.userMe),
        api.get(endpoints.userStats).catch(() => ({ data: {} })),
        api.get(endpoints.voice),
      ]);
      setProfile(pRes.data?.data ?? pRes.data);
      setStats(sRes.data?.data ?? sRes.data ?? {});
      const raw = vRes.data?.data ?? vRes.data ?? [];
      setPins(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const topPins = [...pins].sort((a, b) => (b.listensCount ?? 0) - (a.listensCount ?? 0)).slice(0, 10);
  const displayPins = activeTab === 'pins' ? pins : topPins;

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      if (dispatch) dispatch({ type: 'LOGOUT' });
    } catch (e) { console.error('Logout failed', e); }
  };

  const displayName = profile?.displayName || profile?.username || user?.username || 'Người dùng';
  const avatarUri = (profile as any)?.avatar;

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Hồ sơ</Text>
        <TouchableOpacity onPress={logout} style={s.iconBtn}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor="#8b5cf6" />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── Avatar + name ── */}
          <View style={s.avatarSection}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{displayName.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <Text style={s.displayName}>{displayName}</Text>
            <Text style={s.username}>@{profile?.username ?? '—'}</Text>
            <Text style={s.joinDate}>Tham gia {(profile as any)?.createdAt ? fmtDate((profile as any).createdAt) : '—'}</Text>
          </View>

          {/* ── Stats row ── */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statVal}>{stats?.voicePinCount ?? pins.length}</Text>
              <Text style={s.statLbl}>Giọng nói</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statVal}>{stats?.totalListens ?? pins.reduce((acc, p) => acc + (p.listensCount ?? 0), 0)}</Text>
              <Text style={s.statLbl}>Lượt nghe</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statVal}>{stats?.locationCount ?? new Set(pins.map(p => p.address).filter(Boolean)).size}</Text>
              <Text style={s.statLbl}>Địa điểm</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statVal}>{pins.reduce((acc, p) => acc + (p.reactionsCount ?? 0), 0)}</Text>
              <Text style={s.statLbl}>Cảm xúc</Text>
            </View>
          </View>

          {/* ── Emotion distribution ── */}
          {pins.length > 0 && (() => {
            const emotionMap: Record<string, number> = {};
            pins.forEach(p => { const k = p.emotionLabel ?? 'Khác'; emotionMap[k] = (emotionMap[k] ?? 0) + 1; });
            const sorted = Object.entries(emotionMap).sort((a, b) => b[1] - a[1]);
            return (
              <View style={s.emotionSection}>
                <Text style={s.sectionTitle}>Cảm xúc của tôi</Text>
                <View style={s.emotionRow}>
                  {sorted.map(([emo, count]) => (
                    <View key={emo} style={[s.emoBadge, { backgroundColor: emotionColor(emo) + '22' }]}>
                      <Text style={[s.emoText, { color: emotionColor(emo) }]}>{emotionVi(emo)}</Text>
                      <Text style={[s.emoCount, { color: emotionColor(emo) }]}>{count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* ── Tabs ── */}
          <View style={s.tabBar}>
            <TouchableOpacity style={[s.tabBtn, activeTab === 'pins' && s.tabBtnActive]} onPress={() => setActiveTab('pins')}>
              <Ionicons name="mic-outline" size={14} color={activeTab === 'pins' ? '#8b5cf6' : '#9ca3af'} />
              <Text style={[s.tabTxt, activeTab === 'pins' && s.tabTxtActive]}>Tất cả ({pins.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tabBtn, activeTab === 'top' && s.tabBtnActive]} onPress={() => setActiveTab('top')}>
              <Ionicons name="trophy-outline" size={14} color={activeTab === 'top' ? '#8b5cf6' : '#9ca3af'} />
              <Text style={[s.tabTxt, activeTab === 'top' && s.tabTxtActive]}>Nổi bật</Text>
            </TouchableOpacity>
          </View>

          {/* ── Pin list ── */}
          <View style={s.pinList}>
            {displayPins.length === 0 ? (
              <View style={s.center}>
                <Ionicons name="mic-off-outline" size={40} color="#e5e7eb" />
                <Text style={s.emptyTxt}>Chưa có giọng nói nào</Text>
              </View>
            ) : (
              displayPins.map(pin => <PinCard key={pin.id} pin={pin} />)
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#fafafa',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },

  center: { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40, minHeight: 200 },

  // Avatar section
  avatarSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#ede9fe' },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: '#8b5cf6' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 12 },
  username: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  joinDate: { fontSize: 12, color: '#d1d5db', marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLbl: { fontSize: 10, color: '#9ca3af', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: '#f3f4f6' },

  // Emotion
  emotionSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  emoText: { fontSize: 12, fontWeight: '700' },
  emoCount: { fontSize: 12, fontWeight: '600' },

  // Tabs
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#f3f4f6', borderRadius: 14, padding: 4,
  },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabTxt: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  tabTxtActive: { color: '#8b5cf6' },

  // Pin list
  pinList: { paddingHorizontal: 16 },
  emptyTxt: { color: '#9ca3af', fontSize: 14 },
});
