import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, useColorScheme, StatusBar } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyPins } from '@/hooks/useMyPins';
import { VoicePin } from '@/types';
import VoicePinTurntable from '@/components/home/VoicePinCard';
import { theme } from '@/constants/Theme';

// Import from index
import { MemoryCard } from './index';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_SPACING = 12;
// 2 columns
const CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_SPACING) / 2;

export default function MemoryGridScreen() {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const { title, sectionKey, filter, query } = useLocalSearchParams();
    const { pins } = useMyPins();
    const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);

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
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: currentTheme.colors.icon + '10' }]}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: currentTheme.colors.text, fontSize: 24, fontWeight: 'bold' }]}>{title || 'Tất cả ký ức'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={filteredPins}
                keyExtractor={p => String(p.id)}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <MemoryCard
                        pin={item}
                        onPress={() => setSelectedPin(item)}
                        cardWidth={CARD_WIDTH}
                        cardSpacing={0}
                        currentTheme={currentTheme}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    title: {
        fontWeight: '700',
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
