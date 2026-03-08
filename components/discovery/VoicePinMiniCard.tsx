import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { VoicePin } from '@/types';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/Theme';

type Props = {
    pin: VoicePin;
    onClose: () => void;
    onRandomAgain: () => void;
};

export default function VoicePinMiniCard({ pin, onClose, onRandomAgain }: Props) {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const togglePlayback = async () => {
        if (!sound) {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: pin.audioUrl },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlaying(true);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } else {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const navigateToProfile = () => {
        if (!pin.isAnonymous && pin.userId) {
            onClose();
            router.push(`/user/${pin.userId}`);
        }
    };

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={styles.container}
        >
            <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={[styles.blurView, { borderRadius: currentTheme.radius.xl + 4 }]}>
                <View style={[styles.content, { padding: currentTheme.spacing.lg }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={navigateToProfile} style={styles.headerInfo}>
                            <Text style={[styles.category, { color: currentTheme.colors.primary }]}>
                                {pin.isAnonymous ? "ẨN DANH" : (pin.user?.displayName || pin.user?.username || "NGƯỜI DÙNG")} • KHÁM PHÁ
                            </Text>
                            <Text style={[styles.pinContent, { color: currentTheme.colors.text }]} numberOfLines={2}>
                                {pin.content || "Một ký ức thầm lặng..."}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: currentTheme.colors.icon + '20' }]}>
                            <Ionicons name="close" size={20} color={currentTheme.colors.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* Info */}
                    <View style={[styles.infoRow, { gap: currentTheme.spacing.md }]}>
                        <View style={styles.infoItem}>
                            <Ionicons name="location" size={14} color={currentTheme.colors.icon} />
                            <Text style={[styles.infoText, { color: currentTheme.colors.icon }]}>Gần bạn</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="time" size={14} color={currentTheme.colors.icon} />
                            <Text style={[styles.infoText, { color: currentTheme.colors.icon }]}>
                                {new Date(pin.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    </View>

                    {/* Controls */}
                    <View style={styles.controlsRow}>
                        <View style={[styles.actionsGroup, { gap: currentTheme.spacing.sm }]}>
                            <TouchableOpacity
                                onPress={handleSkip}
                                style={[styles.actionBtn, { backgroundColor: currentTheme.colors.icon + '10', borderRadius: currentTheme.radius.lg }]}
                            >
                                <Text style={[styles.actionBtnText, { color: currentTheme.colors.icon }]}>Bỏ qua</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onRandomAgain}
                                style={[styles.actionBtn, { backgroundColor: currentTheme.colors.primary + '10', borderRadius: currentTheme.radius.lg }]}
                            >
                                <Ionicons name="refresh" size={16} color={currentTheme.colors.primary} />
                                <Text style={[styles.actionBtnText, { color: currentTheme.colors.primary }]}>Tìm tiếp</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={togglePlayback}
                            style={[
                                styles.playBtn,
                                {
                                    backgroundColor: currentTheme.colors.primary,
                                    borderRadius: currentTheme.radius.full,
                                    shadowColor: currentTheme.colors.primary
                                }
                            ]}
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={28}
                                color="white"
                                style={{ marginLeft: isPlaying ? 0 : 4 }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        zIndex: 60,
    },
    blurView: {
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerInfo: {
        flex: 1,
        marginRight: 16,
    },
    category: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    pinContent: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
    },
    closeBtn: {
        padding: 4,
        borderRadius: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 12,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    actionsGroup: {
        flexDirection: 'row',
    },
    actionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    playBtn: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.light.shadows.md,
    },
});
