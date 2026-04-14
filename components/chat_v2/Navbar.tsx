import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const Navbar = ({ title = "Whisper Chat", subtitle = "Messaging with Voice Intelligence", avatarUrl = "", isOnline = false }) => {
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
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.back()}
                        style={[styles.closeButton, {
                            backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.05)",
                            borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(17,24,39,0.12)",
                        }]}
                    >
                        <Ionicons name="chevron-back" size={20} color={isDark ? "#e5e7eb" : "#111827"} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleWrap}>
                        <View style={[styles.avatarRing, { borderColor: isDark ? 'rgba(167,139,250,0.55)' : 'rgba(139,92,246,0.35)' }]}>
                            <Image source={{ uri: avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' }} style={styles.avatar} />
                            {isOnline && <View style={styles.onlineDot} />}
                        </View>
                        <View style={styles.headerCopy}>
                            <Text style={[styles.headerEyebrow, { color: isDark ? "#ffffff" : "#111827" }]} numberOfLines={1}>{title}</Text>
                            <View style={styles.statusRow}>
                                {isOnline ? (
                                    <>
                                        <View style={styles.statusDot} />
                                        <Text style={[styles.statusText, { color: isDark ? "#10b981" : "#059669" }]}>Đang hoạt động</Text>
                                    </>
                                ) : (
                                    <Text style={[styles.headerHint, { color: isDark ? "rgba(255,255,255,0.78)" : "#6B7280" }]} numberOfLines={1}>{subtitle}</Text>
                                )}
                            </View>
                        </View>
                    </View>
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
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 40.5,
        height: 40.5,
        borderRadius: 12,
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
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#fff',
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

