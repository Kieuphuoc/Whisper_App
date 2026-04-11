import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface WelcomeMessageProps {
    name?: string;
    avatarUrl?: string;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ 
    name = "User", 
    avatarUrl = "" 
}) => {
    const scheme = useColorScheme() || 'light';
    const isDark = scheme === 'dark';

    return (
        <LinearGradient
            colors={isDark ? ['rgba(139,92,246,0.18)', 'rgba(16,185,129,0.08)'] : ['rgba(139,92,246,0.10)', 'rgba(16,185,129,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.container,
                {
                    backgroundColor: isDark ? 'rgba(8,10,22,0.55)' : 'rgba(255,255,255,0.72)',
                    borderColor: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.9)',
                },
            ]}
        >
            <BlurView intensity={22} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.badgeWrap}>
                <Text style={[styles.badgeText, { color: isDark ? '#d8b4fe' : '#6d28d9' }]}>AURA LINK</Text>
            </View>
            <View style={styles.avatarWrapper}>
                <Image
                    source={avatarUrl ? { uri: avatarUrl } : require('@/assets/images/avatar.png')}
                    style={[styles.avatar, { borderColor: isDark ? '#a78bfa' : '#8b5cf6' }]}
                    contentFit="cover"
                />
            </View>
            <Text style={[styles.title, { color: isDark ? "#ffffff" : "#111827" }]}>{name}</Text>
            <Text style={[styles.subtitle, { color: isDark ? "#a78bfa" : "#8b5cf6" }]}>TẦN SỐ KẾT NỐI BÍ MẬT</Text>
            <Text style={[styles.disclaimer, { color: isDark ? "rgba(255,255,255,0.58)" : "rgba(17,24,39,0.55)" }]}>Giao tiếp ẩn danh đã được mã hóa hai đầu.</Text>
            <View style={styles.infoRow}>
                <View style={[styles.infoPill, { transform: [{ rotate: '-2.5deg' }], backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)' }]}>
                    <Text style={[styles.infoText, { color: isDark ? '#E9D5FF' : '#6D28D9' }]}>Dị thường: ẩn danh</Text>
                </View>
                <View style={[styles.infoPill, { transform: [{ rotate: '2deg' }], backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.1)' }]}>
                    <Text style={[styles.infoText, { color: isDark ? '#D1FAE5' : '#047857' }]}>Tín hiệu: ổn định</Text>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 26,
        marginBottom: 12,
        marginHorizontal: 14,
        borderRadius: 30,
        borderWidth: 1.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 8,
    },
    badgeWrap: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(139,92,246,0.14)',
        marginBottom: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    avatarWrapper: {
        marginBottom: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 28,
        backgroundColor: '#E5E7EB',
        borderWidth: 2,
    },
    title: {
        fontSize: 23,
        color: "#ffffff",
        fontWeight: "900",
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 13,
        color: "#a78bfa",
        fontWeight: "800",
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    disclaimer: {
        fontSize: 11.5,
        color: "rgba(255,255,255,0.5)",
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    infoPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    infoText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
});

export default WelcomeMessage;
