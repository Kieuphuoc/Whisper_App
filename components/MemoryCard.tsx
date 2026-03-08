import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { getLocationName } from '../utils/geocoding';
import { theme } from '@/constants/Theme';
import { Colors } from '@/constants/Colors';

type Props = {
    item: VoicePin;
    onPress?: () => void;
};

export function MemoryCard({ item, onPress }: Props) {
    const player = useAudioPlayer(item.audioUrl);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<string | null>(null);
    const [positionMillis, setPositionMillis] = useState<number>(0);
    const [durationMillis, setDurationMillis] = useState<number>(0);
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const [locationName, setLocationName] = useState<string>('Loading...');

    const play = () => {
        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.seekTo(0);
            player.play();
            setIsPlaying(true);
        }
    };

    const formatDuration = (seconds: number): string => {
        if (!seconds) return '0:00';
        const rounded = Math.round(seconds);
        const mins = Math.floor(rounded / 60);
        const secs = rounded % 60;
        const paddedSecs = secs < 10 ? `0${secs}` : secs.toString();
        return `${mins}:${paddedSecs}`;
    };

    useEffect(() => {
        if (player.duration) {
            setDuration(formatDuration(player.duration));
        }
    }, [player.duration]);

    useEffect(() => {
        const loadLocationName = async () => {
            try {
                const name = await getLocationName(item.latitude, item.longitude);
                setLocationName(name);
            } catch (error) {
                console.error('Error loading location name:', error);
                setLocationName('Unknown Location');
            }
        };

        if (item.latitude && item.longitude) {
            loadLocationName();
        }
    }, [item.latitude, item.longitude]);

    return (
        <ThemedView style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }]}>
            <View style={styles.header}>
                <View style={[styles.emotionContainer, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.primary }]}>
                    <Text style={styles.emotionText}>{item.emotionLabel || '🎵'}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.dateTime, { color: currentTheme.colors.textSecondary }]}>
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>

                    <View style={styles.titleRow}>
                        <ThemedText style={[styles.duration, { backgroundColor: currentTheme.colors.surfaceAlt, color: currentTheme.colors.primary }]}>
                            {duration ? duration : '---'}
                        </ThemedText>
                    </View>

                    <ThemedText style={[styles.description, { color: currentTheme.colors.text }]}>
                        {item.content}
                    </ThemedText>

                    <View style={styles.locationContainer}>
                        <Ionicons name="location" size={14} color={currentTheme.colors.textMuted} />
                        <Text style={[styles.location, { color: currentTheme.colors.textMuted }]}>
                            {locationName || item.address || 'Unknown location'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[styles.actions, { borderTopColor: currentTheme.colors.border }]}>
                <TouchableOpacity
                    style={[
                        styles.playButton, 
                        { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.primary },
                        isPlaying && { backgroundColor: currentTheme.colors.primary }
                    ]}
                    onPress={play}
                >
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={isPlaying ? Colors.white : currentTheme.colors.primary}
                    />
                    <Text style={[styles.playButtonText, { color: isPlaying ? Colors.white : currentTheme.colors.primary }]}>
                        {isPlaying ? 'Pause' : 'Play'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
                        <Ionicons name="heart-outline" size={16} color={currentTheme.colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
                        <Ionicons name="share-outline" size={16} color={currentTheme.colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
                        <Ionicons name="bookmark-outline" size={16} color={currentTheme.colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 6,
        marginHorizontal: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
    },
    header: {
        flexDirection: "row",
        marginBottom: 16,
        gap: 12,
    },
    emotionContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        overflow: 'hidden'
    },
    emotionText: {
        fontSize: 24,
    },
    infoContainer: {
        flex: 1,
        gap: 6,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    duration: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        fontSize: 12,
        fontWeight: '600',
    },
    dateTime: {
        fontSize: 12,
        fontWeight: '500',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    location: {
        fontSize: 12,
        fontWeight: '400',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    playButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
