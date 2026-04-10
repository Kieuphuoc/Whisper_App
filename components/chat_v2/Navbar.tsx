import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const Navbar = ({ title = "Whisper Chat", subtitle = "Messaging with Voice Intelligence", avatarUrl = "" }) => {
    const router = useRouter();
    const scheme = useColorScheme() || 'light';
    const isDark = scheme === 'dark';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark ? ['rgba(139,92,246,0.34)', 'rgba(167,139,250,0.12)'] : ['rgba(139,92,246,0.16)', 'rgba(196,181,253,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.glassPanel,
                    {
                        backgroundColor: isDark ? 'rgba(12,16,31,0.62)' : 'rgba(255,255,255,0.72)',
                        borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)',
                    },
                ]}
            >
                <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={styles.headerRow}>
                    <View style={styles.headerTitleWrap}>
                        <View style={[styles.avatarRing, { borderColor: isDark ? 'rgba(167,139,250,0.55)' : 'rgba(139,92,246,0.35)' }]}>
                            <Image source={{ uri: avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' }} style={styles.avatar} />
                        </View>
                        <View style={styles.headerCopy}>
                            <Text style={[styles.headerEyebrow, { color: isDark ? "#ffffff" : "#111827" }]} numberOfLines={1}>{title}</Text>
                            <Text style={[styles.headerHint, { color: isDark ? "rgba(255,255,255,0.78)" : "#6B7280" }]} numberOfLines={1}>{subtitle}</Text>
                            <View style={styles.metaRow}>
                                <View style={[styles.metaPill, { backgroundColor: isDark ? 'rgba(139,92,246,0.28)' : 'rgba(139,92,246,0.12)' }]}>
                                    <Text style={[styles.metaText, { color: isDark ? '#E9D5FF' : '#6D28D9' }]}>Aura</Text>
                                </View>
                                <View style={[styles.metaPill, { backgroundColor: isDark ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.12)' }]}>
                                    <Text style={[styles.metaText, { color: isDark ? '#D1FAE5' : '#047857' }]}>Tần số</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.back()}
                        style={[styles.closeButton, {
                            backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.05)",
                            borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(17,24,39,0.12)",
                        }]}
                    >
                        <Ionicons name="close" size={18} color={isDark ? "#e5e7eb" : "#111827"} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 22,
        paddingVertical: 14,
        backgroundColor: 'transparent',
    },
    glassPanel: {
        borderWidth: 1.2,
        borderRadius: 28,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 8,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    headerTitleWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarRing: {
        width: 46,
        height: 46,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 40.5,
        height: 40.5,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
    },
    headerCopy: {
        flex: 1,
    },
    headerEyebrow: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "900",
        letterSpacing: 0.35,
    },
    headerHint: {
        marginTop: 3,
        fontSize: 11.5,
        lineHeight: 16,
        fontWeight: "600",
        letterSpacing: 0.25,
        textTransform: 'uppercase',
    },
    metaRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
    },
    metaPill: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
    },
    metaText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default Navbar;

