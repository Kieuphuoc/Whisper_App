import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';

import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getLocationName } from '../utils/geocoding';

type MemoryCardProps = {
    memory: Memory;
    nameUser?: string; // <== optional
};

type Memory = {
    id: string;
    latitude: number;
    longitude: number;
    emotion: string;
    description: string;
    duration: number;
    visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
    audioUrl: string;
    imageUrl?: string;
    address?: string;
    createdAt: string;
    user?: {
        id: string,
        username: string;
        avatar?: string;
    };
    likes?: number;
    replies?: number;
};

export function MemoryCard({ memory, nameUser }: MemoryCardProps) {
    console.log("Uri", memory?.audioUrl)

    const player = useAudioPlayer(memory.audioUrl);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [positionMillis, setPositionMillis] = useState<number>(0);
    const [durationMillis, setDurationMillis] = useState<number>(0);
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
        const rounded = Math.round(seconds);
        const mins = Math.round(rounded / 60);
        const secs = rounded % 60;
        const paddedSecs = secs < 10 ? `0${secs}` : secs.toString();
        return `${mins}:${paddedSecs}`;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setDuration(formatDuration(player.duration));
            clearInterval(interval);
        }, 200);

        return () => clearInterval(interval);
    }, [player]);

    useEffect(() => {
        const loadLocationName = async () => {
            try {
                const name = await getLocationName(memory.latitude, memory.longitude);
                setLocationName(name);
            } catch (error) {
                console.error('Error loading location name:', error);
                setLocationName('Unknown Location');
            }
        };

        loadLocationName();
    }, [memory.latitude, memory.longitude]);

    const progress = useMemo(() => {
        if (!durationMillis) return 0;
        return positionMillis / durationMillis;
    }, [positionMillis, durationMillis]);
    
    return (
        <ThemedView style={styles.card}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.emotionContainer} onPress={() => {

                    router.push({ pathname: '/(home)/profile', params: { userId: memory?.user?.id } });

                }}>
                    {/* <Text style={styles.emotionText}>{memory.emotion}</Text> */}
                    {memory.user?.avatar ? (
                        <Image source={{ uri: memory.user.avatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Ionicons name="person" size={16} color={Colors.primary} />
                    )}
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                    <View style={styles.titleRow}>

                        {nameUser && <ThemedText type='defaultSemiBold'>{nameUser}</ThemedText>}
                        <Text style={styles.dateTime}>
                            {new Date(memory.createdAt).toLocaleDateString('en-GB', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>

                    <View style={styles.titleRow}>
                        {/* <ThemedText  type='defaultSemiBold'>{nameUser}<ThemedText/> */}
                        <ThemedText style={styles.duration}>
                            {duration ? duration : '---'}
                        </ThemedText>

                    </View>


                    <ThemedText style={styles.description}>
                        {memory.description}
                    </ThemedText>

                    <View style={styles.locationContainer}>
                        <Ionicons name="location" size={14} color="#6b7280" />
                        <Text style={styles.location}>
                            {locationName}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.playButton, isPlaying && styles.playingButton]}
                    onPress={play}
                >
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={isPlaying ? '#ffffff' : '#8b5cf6'}
                    />
                    <Text style={[styles.playButtonText, isPlaying && styles.playingButtonText]}>
                        {isPlaying ? 'Pause' : 'Play'}
                    </Text>
                </TouchableOpacity>
                {/* <View style={styles.progressWrap}>
                    <Pressable
                        style={styles.progressBar}
                        onPress={(e) => {
                            // const { locationX, nativeEvent } = e;
                            // const width = (nativeEvent as any).target ? undefined : undefined; // placeholder
                            // Use layout to compute ratio
                        }}
                    >
                        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
                    </Pressable>
                    <View style={styles.timeRow}>
                        <ThemedText style={styles.muted}>{formattedTime(positionMillis)}</ThemedText>
                        <ThemedText style={styles.muted}>{formattedTime(durationMillis)}</ThemedText>
                    </View>
                </View> */}

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="heart-outline" size={16} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="share-outline" size={16} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="bookmark-outline" size={16} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    muted: {
        color: '#888',
    },
    progressWrap: {
        flex: 1,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e5e5e5',
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
    },
    timeRow: {
        marginTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: "#ffffff",
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
        borderColor: '#f3f4f6',
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
        backgroundColor: '#faf5ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#8b5cf6',
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
        backgroundColor: '#f3e8ff',
        color: '#7c3aed',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        fontSize: 12,
        fontWeight: '600',
    },
    dateTime: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    description: {
        fontSize: 14,
        color: "#374151",
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
        color: "#6b7280",
        fontWeight: '400',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#faf5ff',
        borderWidth: 1,
        borderColor: '#8b5cf6',
    },
    playingButton: {
        backgroundColor: '#8b5cf6',
    },
    playButtonText: {
        fontSize: 12,
        color: '#8b5cf6',
        fontWeight: '600',
    },
    playingButtonText: {
        color: '#ffffff',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
