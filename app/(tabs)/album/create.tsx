import { SettingTabHeader } from '@/components/profile/SettingTabHeader';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { Album, Visibility } from '@/types';
import { theme } from '@/constants/Theme';
import { ALBUM_CARD_WIDTH } from '@/components/album/AlbumCard';

const STORAGE_KEY = 'whispery_user_albums';

const PRESET_GRADIENTS: { id: string; colors: [string, string]; label: string }[] = [
    { id: 'purple', colors: ['#7c3aed', '#4338ca'], label: 'Tím' },
    { id: 'rose', colors: ['#ec4899', '#be185d'], label: 'Hồng' },
    { id: 'emerald', colors: ['#059669', '#065f46'], label: 'Xanh lá' },
    { id: 'amber', colors: ['#b45309', '#92400e'], label: 'Hổ phách' },
    { id: 'sky', colors: ['#0369a1', '#1e3a5f'], label: 'Xanh dương' },
    { id: 'slate', colors: ['#64748b', '#334155'], label: 'Xám' },
    { id: 'sunset', colors: ['#f97316', '#9a3412'], label: 'Hoàng hôn' },
    { id: 'night', colors: ['#1e1b4b', '#312e81'], label: 'Đêm tối' },
];

const VISIBILITY_OPTIONS: { key: Visibility; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
    { key: 'PRIVATE', label: 'Riêng tư', icon: 'lock-closed-outline', desc: 'Chỉ mình bạn thấy' },
    { key: 'FRIENDS', label: 'Bạn bè', icon: 'people-outline', desc: 'Bạn bè của bạn' },
    { key: 'PUBLIC', label: 'Công khai', icon: 'earth-outline', desc: 'Tất cả mọi người' },
];

export default function CreateAlbumScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedGradient, setSelectedGradient] = useState(PRESET_GRADIENTS[0]);
    const [visibility, setVisibility] = useState<Visibility>('PRIVATE');
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên cho album.');
            return;
        }
        setSaving(true);
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const existing: Album[] = stored ? JSON.parse(stored) : [];

            const newAlbum: Album = {
                id: `user-${Date.now()}`,
                name: trimmed,
                description: description.trim() || undefined,
                coverGradient: selectedGradient.colors,
                accentColor: selectedGradient.colors[0],
                pinCount: 0,
                pinIds: [],
                type: 'user',
                visibility,
                createdAt: new Date().toISOString(),
            };

            const updated = [newAlbum, ...existing];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            router.back();
        } catch {
            Alert.alert('Lỗi', 'Không thể tạo album. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

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

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.headerIconBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#111827'} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>Tạo Album</Text>
                    <Text style={styles.subtitle}>Thiết lập bộ sưu tập mới</Text>
                </View>
                <TouchableOpacity onPress={handleCreate} disabled={saving || !name.trim()} style={[styles.headerIconBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Ionicons name="checkmark" size={24} color={(!name.trim() || saving) ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : currentTheme.colors.primary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Preview ── */}
                    <MotiView
                        from={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 14 }}
                        style={styles.previewContainer}
                    >
                        <View style={styles.previewCard}>
                            <LinearGradient
                                colors={selectedGradient.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <LinearGradient
                                colors={['rgba(255,255,255,0.08)', 'transparent', 'rgba(0,0,0,0.2)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <MotiView
                                from={{ opacity: 0.3, scale: 0.9 }}
                                animate={{ opacity: 0.5, scale: 1.1 }}
                                transition={{ loop: true, type: 'timing', duration: 3000 }}
                                style={[styles.previewGlow, { backgroundColor: selectedGradient.colors[0] }]}
                            />
                            <View style={styles.previewIconWrap}>
                                <BlurView intensity={25} tint="dark" style={styles.previewIconBlur}>
                                    <Ionicons name="albums" size={30} color="#fff" />
                                </BlurView>
                            </View>
                            <View style={styles.previewBottomBar}>
                                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                <Text style={styles.previewName} numberOfLines={1}>
                                    {name.trim() || 'Tên album'}
                                </Text>
                                <Text style={styles.previewCount}>0 chốt</Text>
                            </View>
                        </View>
                    </MotiView>

                    {/* ── Name Input ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 100 }}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDash, { backgroundColor: selectedGradient.colors[0] }]} />
                            <Text style={styles.sectionTitle}>Tên album</Text>
                        </View>
                        <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.inputWrapper, { 
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'
                        }]}>
                            <TextInput
                                style={[styles.input, { color: isDark ? '#fff' : '#111827' }]}
                                placeholder="Nhập tên album..."
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.35)" : "#9ca3af"}
                                value={name}
                                onChangeText={setName}
                                maxLength={50}
                                autoCapitalize="sentences"
                            />
                        </BlurView>
                        <Text style={[styles.inputHint, { color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }]}>{name.length}/50</Text>
                    </MotiView>

                    {/* ── Description Input ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 150 }}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDash, { backgroundColor: selectedGradient.colors[0] }]} />
                            <Text style={styles.sectionTitle}>Mô tả (tuỳ chọn)</Text>
                        </View>
                        <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.inputWrapper, { 
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'
                        }]}>
                            <TextInput
                                style={[styles.textArea, { color: isDark ? '#fff' : '#111827' }]}
                                placeholder="Mô tả ngắn về album này..."
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.35)" : "#9ca3af"}
                                value={description}
                                onChangeText={setDescription}
                                maxLength={120}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </BlurView>
                    </MotiView>

                    {/* ── Gradient Picker ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 200 }}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDash, { backgroundColor: selectedGradient.colors[0] }]} />
                            <Text style={styles.sectionTitle}>Màu sắc</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.gradientRow}
                        >
                            {PRESET_GRADIENTS.map(g => {
                                const isSelected = g.id === selectedGradient.id;
                                return (
                                    <TouchableOpacity
                                        key={g.id}
                                        onPress={() => setSelectedGradient(g)}
                                        activeOpacity={0.85}
                                        style={[styles.gradientSwatch, isSelected && styles.gradientSwatchSelected]}
                                    >
                                        <LinearGradient
                                            colors={g.colors}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        {isSelected && (
                                            <MotiView
                                                from={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', damping: 12 }}
                                                style={styles.gradientCheckWrap}
                                            >
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            </MotiView>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </MotiView>

                    {/* ── Visibility Picker ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 250 }}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDash, { backgroundColor: selectedGradient.colors[0] }]} />
                            <Text style={styles.sectionTitle}>Quyền truy cập</Text>
                        </View>
                        <View style={styles.visibilityGroup}>
                            {VISIBILITY_OPTIONS.map((opt, i) => {
                                const isSelected = opt.key === visibility;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        onPress={() => setVisibility(opt.key)}
                                        activeOpacity={0.8}
                                        style={[
                                            styles.visibilityOption,
                                            {
                                                borderColor: isSelected
                                                    ? selectedGradient.colors[0] + '60'
                                                    : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                                                backgroundColor: isSelected
                                                    ? selectedGradient.colors[0] + '12'
                                                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'),
                                            },
                                        ]}
                                    >
                                        <BlurView intensity={isSelected ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                                        <View style={[styles.visIconWrap, { backgroundColor: isSelected ? selectedGradient.colors[0] + '22' : 'rgba(0,0,0,0.05)' }]}>
                                            <Ionicons
                                                name={opt.icon}
                                                size={18}
                                                color={isSelected ? selectedGradient.colors[0] : (isDark ? 'rgba(255,255,255,0.5)' : '#6b7280')}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.visLabel, { color: isDark ? '#fff' : '#111827' }]}>{opt.label}</Text>
                                            <Text style={[styles.visDesc, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }]}>{opt.desc}</Text>
                                        </View>
                                        {isSelected && (
                                            <View style={[styles.visCheck, { backgroundColor: selectedGradient.colors[0] }]}>
                                                <Ionicons name="checkmark" size={12} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </MotiView>

                    {/* ── Create Button ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 320 }}
                        style={styles.section}
                    >
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={saving || !name.trim()}
                            activeOpacity={0.85}
                            style={[styles.createBtn, (!name.trim() || saving) && styles.createBtnDisabled]}
                        >
                            <LinearGradient
                                colors={selectedGradient.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <Ionicons
                                name={saving ? 'hourglass-outline' : 'albums'}
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.createBtnText}>
                                {saving ? 'Đang tạo...' : 'Tạo Album'}
                            </Text>
                        </TouchableOpacity>
                    </MotiView>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    auraCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    scrollContent: { paddingBottom: 40, paddingTop: 10 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 70,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerTitleWrap: {
        alignItems: 'center',
    },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
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

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 15,
        gap: 10,
    },
    sectionDash: { width: 3, height: 14, borderRadius: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af' },

    // Preview Card
    previewContainer: { alignItems: 'center', paddingVertical: 28 },
    previewCard: {
        width: ALBUM_CARD_WIDTH * 1.1,
        height: ALBUM_CARD_WIDTH * 1.1 * 1.3,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    previewGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        top: -30,
        right: -30,
        opacity: 0.4,
    },
    previewIconWrap: {
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: [{ translateX: -32 }, { translateY: -32 }],
    },
    previewIconBlur: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    previewBottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingVertical: 12,
        overflow: 'hidden',
    },
    previewName: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
    previewCount: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginTop: 2 },

    // Sections
    section: { paddingHorizontal: 24, marginBottom: 12 },

    // Inputs
    inputWrapper: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
    input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600' },
    textArea: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', minHeight: 100 },
    inputHint: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'right' },

    // Gradient row
    gradientRow: { gap: 10, paddingVertical: 4 },
    gradientSwatch: {
        width: 52,
        height: 52,
        borderRadius: 16,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    gradientSwatchSelected: {
        borderColor: '#fff',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradientCheckWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Visibility
    visibilityGroup: { gap: 10 },
    visibilityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    visIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visLabel: { fontSize: 15, fontWeight: '700' },
    visDesc: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    visCheck: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Create Button
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 14,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
    },
    createBtnDisabled: { opacity: 0.45 },
    createBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
});
