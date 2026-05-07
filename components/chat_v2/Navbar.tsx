import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const Navbar = ({ 
    title = "Whisper Chat", 
    subtitle = "Messaging", 
    avatarUrl = "", 
    isOnline = false,
    isLoading = false
}) => {
    const router = useRouter();
    const scheme = useColorScheme() || 'light';
    const isDark = scheme === 'dark';

    const defaultAvatar = require('@/assets/images/avatar.png');
    const avatarSource = avatarUrl ? { uri: avatarUrl } : defaultAvatar;

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
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(17,24,39,0.02)",
                            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={isDark ? "#e5e7eb" : "#111827"} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleWrap}>
                        <View style={[styles.avatarRing, { borderColor: isDark ? 'rgba(41, 26, 86, 0.55)' : 'rgba(139,92,246,0.35)' }]}>
                            {isLoading ? (
                                <View style={[styles.avatarSkeleton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />
                            ) : (
                                <>
                                    <Image source={avatarSource} style={styles.avatar} />
                                    {isOnline && <View style={styles.onlineDot} />}
                                </>
                            )}
                        </View>
                        <View style={styles.headerCopy}>
                            {isLoading ? (
                                <View style={styles.skeletonCol}>
                                    <View style={[styles.titleSkeleton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />
                                    <View style={[styles.subtitleSkeleton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]} />
                                </View>
                            ) : (
                                <>
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
                                </>
                            )}
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
        marginTop: 2,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "500",
        letterSpacing: 0.1,
        textTransform: 'capitalize',
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
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarSkeleton: {
        width: 40.5,
        height: 40.5,
        borderRadius: 12,
    },
    skeletonCol: {
        gap: 6,
    },
    titleSkeleton: {
        width: '60%',
        height: 16,
        borderRadius: 4,
    },
    subtitleSkeleton: {
        width: '40%',
        height: 12,
        borderRadius: 4,
    },
});

export default Navbar;

