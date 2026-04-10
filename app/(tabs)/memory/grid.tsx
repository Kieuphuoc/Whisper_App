import React, { useMemo, useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, useColorScheme, StatusBar, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyPins } from '@/hooks/useMyPins';
import { VoicePin } from '@/types';
import VoicePinTurntable from '@/components/home/VoicePinCard';
import { theme } from '@/constants/Theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

import { MyUserContext } from '@/configs/Context';
import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { VoicePinCarouselCard as MemoryCard } from '@/components/memory/VoicePinCarouselCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_SPACING = 15;
const CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_SPACING) / 2;

export default function MemoryGridScreen() {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const { title, sectionKey, filter, query, userId } = useLocalSearchParams();
    const { pins: myPins } = useMyPins();
    const [externalPins, setExternalPins] = useState<VoicePin[]>([]);
    const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);
    const user = useContext(MyUserContext);

    useEffect(() => {
        if (!userId) return;
        const load = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;
                const res = await authApis(token).get(endpoints.voicePublicByUser(String(userId)));
                setExternalPins(res.data?.data ?? []);
            } catch { /* silent */ }
        };
        load();
    }, [userId]);

    const pins = userId ? externalPins : myPins;

    const coverUri = useMemo(() => {
        if (!user?.cover) return 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop';
        if (user.cover.startsWith('http')) return user.cover;
        return `${BASE_URL}${user.cover.startsWith('/') ? '' : '/'}${user.cover}`;
    }, [user]);

    const filteredPins = useMemo(() => {
        let list = pins;
        if (query) {
            const q = String(query).toLowerCase();
            list = list.filter(p =>
                (p.content?.toLowerCase().includes(q)) ||
                (p.address?.toLowerCase().includes(q)) ||
                (p.emotionLabel?.toLowerCase().includes(q))
            );
        }

        if (!sectionKey) return list;
        const sKey = String(sectionKey);
        const now = new Date();

        if (sKey === 'recent') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return list.filter(p => new Date(p.createdAt) >= sevenDaysAgo).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (sKey === 'month') {
            return list.filter(p => {
                const d = new Date(p.createdAt);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (sKey.startsWith('emo-')) {
            const emo = sKey.replace('emo-', '');
            return list.filter(p => (p.emotionLabel ?? 'Khác') === emo);
        }
        if (sKey.startsWith('vis-')) {
            const vis = sKey.replace('vis-', '');
            return list.filter(p => (p.visibility ?? 'PRIVATE') === vis);
        }
        if (sKey.startsWith('loc-')) {
            const loc = sKey.replace('loc-', '');
            return list.filter(p => {
                if (!p.address) return loc === 'unknown';
                const parts = p.address.split(',').map(s => s.trim());
                const cityKey = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
                return cityKey === loc;
            });
        }
        if (sKey.startsWith('time-')) {
            const tLabel = sKey.replace('time-', '');
            return list.filter(p => {
                const d = new Date(p.createdAt);
                return d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) === tLabel;
            }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return list;
    }, [pins, query, sectionKey]);

    if (selectedPin) {
        return (
            <VoicePinTurntable
                pin={selectedPin}
                onClose={() => setSelectedPin(null)}
            />
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* FULL SCREEN BACKGROUND */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: coverUri }}
                    style={styles.fullscreenBackground}
                    blurRadius={15}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <BlurView intensity={30} tint="light" style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
                <MotiView
                    from={{ opacity: 0, translateX: 20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    style={{ flex: 1, marginLeft: 15 }}
                >
                    <Text style={styles.title}>{title || 'Tất cả ký ức'}</Text>
                    <Text style={styles.subtitle}>{filteredPins.length} kết quả</Text>
                </MotiView>
            </View>

            <FlatList
                data={filteredPins}
                keyExtractor={p => String(p.id)}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <MotiView
                        from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        transition={{ delay: 100 * (index % 10) }}
                    >
                        <MemoryCard
                            pin={item}
                            onPress={() => setSelectedPin(item)}
                            cardWidth={CARD_WIDTH}
                            cardSpacing={0}
                            currentTheme={{
                                ...currentTheme,
                                colors: { ...currentTheme.colors, text: '#fff' }
                            }}
                            isGrid={true}
                        />
                    </MotiView>
                )}
            />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
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
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        padding: GRID_PADDING,
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: GRID_SPACING,
    },
});
