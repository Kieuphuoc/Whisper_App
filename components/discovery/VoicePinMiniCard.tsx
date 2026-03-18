import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Animated, { FadeIn, FadeOut, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { VoicePin } from '@/types';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/Theme';

type Props = {
    pin: VoicePin;
    onClose: () => void;
    onRandomAgain: () => void;
    onPlayVoice?: (pin: VoicePin) => void;
};

export default function VoicePinMiniCard({ pin, onClose, onRandomAgain, onPlayVoice }: Props) {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    
    const player = useAudioPlayer(pin.audioUrl);
    const { playing, isBuffering, isLoaded } = useAudioPlayerStatus(player);

    useEffect(() => {
        // Auto-play when loaded if we want, but user asked specifically for play button
        player.loop = false;
    }, [player]);

    const togglePlayback = () => {
        if (onPlayVoice) {
            onPlayVoice(pin);
        } else {
            if (playing) {
                player.pause();
            } else {
                player.play();
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
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.container}
        >
            <TouchableOpacity 
                style={StyleSheet.absoluteFill} 
                activeOpacity={1} 
                onPress={onClose} 
            />
            <Animated.View
                entering={FadeInUp.springify().damping(15)}
                exiting={FadeOutDown}
                style={{ width: '100%' }}
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
                            disabled={!isLoaded && !isBuffering}
                            style={[
                                styles.playBtn,
                                {
                                    backgroundColor: currentTheme.colors.primary,
                                    borderRadius: currentTheme.radius.full,
                                    shadowColor: currentTheme.colors.primary,
                                    opacity: (isLoaded || isBuffering) ? 1 : 0.6
                                }
                            ]}
                        >
                            {isBuffering ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons
                                    name={playing ? "pause" : "play"}
                                    size={28}
                                    color="white"
                                    style={{ marginLeft: playing ? 0 : 4 }}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20,
        zIndex: 2000,
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
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    pinContent: {
        fontSize: 17,
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
        fontSize: 14,
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
