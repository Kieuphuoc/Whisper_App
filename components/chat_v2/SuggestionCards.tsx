import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const SUGGESTIONS = [
    {
        id: '1',
        icon: 'scan',
        title: 'Dò dị thường',
        accent: '#c4b5fd', 
        rotate: '-2deg',
    },
    {
        id: '2',
        icon: 'radio',
        title: 'Ping tần số',
        accent: '#a78bfa', 
        rotate: '1deg',
    },
    {
        id: '3',
        icon: 'color-wand',
        title: 'Aura filter',
        accent: '#ddd6fe', 
        rotate: '-1deg',
    }
];

const SuggestionCards = () => {
    const scheme = useColorScheme() || 'light';
    const isDark = scheme === 'dark';

    return (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.container}
        >
            {SUGGESTIONS.map((item) => (
                <TouchableOpacity 
                    key={item.id}
                    activeOpacity={0.8}
                    style={[styles.card, { transform: [{ rotate: item.rotate as any }] }]}
                >
                    <LinearGradient
                        colors={
                            isDark
                                ? ['rgba(139,92,246,0.24)', 'rgba(17,24,39,0.58)']
                                : ['rgba(139,92,246,0.15)', 'rgba(255,255,255,0.75)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.cardInner,
                            {
                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.92)',
                            },
                        ]}
                    >
                        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(17,24,39,0.06)' }]}>
                            <Ionicons name={item.icon as any} size={20} color={item.accent} />
                        </View>
                        <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#111827' }]}>{item.title}</Text>
                        <Text style={[styles.kicker, { color: isDark ? 'rgba(255,255,255,0.68)' : '#6B7280' }]}>Kích hoạt gợi ý</Text>
                    </LinearGradient>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    scrollContent: {
        paddingHorizontal: 12,
        gap: 12,
        paddingBottom: 4,
    },
    card: {
        width: 130,
        height: 112,
        borderRadius: 22,
    },
    cardInner: {
        borderRadius: 22,
        padding: 12,
        borderWidth: 1.2,
        justifyContent: "space-between",
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
        elevation: 5,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 13,
        fontWeight: "800",
        marginTop: 6,
        letterSpacing: 0.25,
    },
    kicker: {
        marginTop: 4,
        fontSize: 11,
        fontWeight: '600',
    },
});

export default SuggestionCards;
