import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Memory = {
    id: string;
    emoji: string;
    duration: string;
    createdAt: string;
    description: string;
    longitude: number;
    latitude: number;
    audioUrl: string;
    location: string;
    emotion: string;
};

export function MemoryCard({ memory }: { memory: Memory }) {
    const player = useAudioPlayer(memory.audioUrl);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const play = () => {
        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
        } else {
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

    return (
        <ThemedView style={styles.card}>
            <View style={styles.header}>
                <View style={styles.emotionContainer}>
                    <Text style={styles.emotionText}>{memory.emotion}</Text>
                </View>
                
                <View style={styles.infoContainer}>
                    <View style={styles.titleRow}>
                        <ThemedText style={styles.duration}>
                            {duration ? duration : '---'}
                        </ThemedText>
                        <Text style={styles.dateTime}>
                            {new Date(memory.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                    
                    <ThemedText style={styles.description}>
                        {memory.description}
                    </ThemedText>
                    
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={14} color="#6b7280" />
                        <Text style={styles.location}>
                            {memory.location || 'Unknown location'}
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
                        color={isPlaying ? '#ffffff' : '#22c55e'} 
                    />
                    <Text style={[styles.playButtonText, isPlaying && styles.playingButtonText]}>
                        {isPlaying ? 'Pause' : 'Play'}
                    </Text>
                </TouchableOpacity>

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
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginVertical: 6,
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
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#22c55e',
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
        backgroundColor: '#d1fbe3',
        color: '#1A936F',
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
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#22c55e',
    },
    playingButton: {
        backgroundColor: '#22c55e',
    },
    playButtonText: {
        fontSize: 12,
        color: '#22c55e',
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
