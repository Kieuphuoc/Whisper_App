import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getLocationName } from '../utils/geocoding';

type VoicePin = {
    id: string;
    latitude: number;
    longitude: number;
    emotion: string;
    description: string;
    duration: number;
    visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
    audioUrl?: string;
    imageUrl?: string;
    address?: string;
    createdAt: string;
    user?: {
        id: number;
        username: string;
        displayName: string;
        avatar?: string;
    };
    likes?: number;
    replies?: number;
};

type Props = {
    voicePin: VoicePin;
};

export default function MiniVoiceCard({ voicePin }: Props) {
    const player = useAudioPlayer(voicePin.audioUrl);

    const [duration, setDuration] = useState<string | null>(null);
    const [locationName, setLocationName] = useState<string>('Loading...');
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const play = () => {
        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.seekTo(0);

            player.play();
            setIsPlaying(true);
        }
    }
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
                const name = await getLocationName(voicePin.latitude, voicePin.longitude);
                setLocationName(name);
            } catch (error) {
                console.error('Error loading location name:', error);
                setLocationName('Unknown Location');
            }
        };

        loadLocationName();
    }, [voicePin.latitude, voicePin.longitude]);

    return (
        <View style={styles.pinBento}>
            <View style={styles.pinHeader}>
                <View style={styles.pinIconContainer}>
                    <Text style={styles.pinEmoji}>🎧</Text>
                </View>
                <View style={styles.pinInfo}>
                    <Text style={styles.pinTitle}>{voicePin.description}</Text>
                    <Text style={styles.pinLocation}>{locationName}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.playButton, isPlaying && styles.playingButton]}
                    onPress={play}
                >
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={isPlaying ? '#ffffff' : '#8b5cf6'}
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.pinStats}>
                <View style={styles.pinStatItem}>
                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                    <Text style={styles.pinStatText}>{formatDuration(voicePin.duration)}</Text>
                </View>
                <View style={styles.pinStatItem}>
                    <Ionicons name="play-outline" size={14} color="#9ca3af" />
                    {/* <Text style={styles.pinStatText}>{voicePin.replies ?? 0}</Text> */}
                </View>
            </View>
        </View>
    );
};
const styles = StyleSheet.create({
    playButtonText: {
        fontSize: 12,
        color: '#8b5cf6',
        fontWeight: '600',
    },
    playingButton: {
        backgroundColor: '#8b5cf6',
    },
    pinBento: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
        marginBottom: 12,
    },
    pinHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    pinIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    pinEmoji: {
        fontSize: 18,
    },
    pinInfo: {
        flex: 1,
    },
    pinTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    pinLocation: {
        fontSize: 12,
        color: '#64748b',
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    pinStats: {
        flexDirection: 'row',
        gap: 16,
    },
    pinStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pinStatText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#6b7280',
    },
})