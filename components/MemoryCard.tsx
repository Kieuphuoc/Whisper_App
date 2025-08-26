import React, { useEffect, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAudioPlayer } from 'expo-audio';
import * as Location from 'expo-location';


type Memory = {
    id: string;
    emoji: string;
    duration: string;
    createdAt: string;
    description: string;
    longitude: number;
    latitude: number;
    audioUrl: string; // URL âm thanh từ backend
};


export function MemoryCard({ memory }: { memory: Memory }) {
    const player = useAudioPlayer(memory.audioUrl);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false)

    const play = () => {
        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.play();
            setIsPlaying(true);
        }
    }

    const formatDuration = (seconds: number): string => {
        const rounded = Math.round(seconds); // Cắt phần thập phân
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
            <ThemedView style={styles.row}>
                <Pressable style={styles.button} onPress={play}>
                    <Text>{isPlaying ? 'Pause' : 'Play'}</Text>
                </Pressable>
                <ThemedText style={styles.emoji}>{memory.emoji}</ThemedText>
                <ThemedView style={styles.info}>
                    <ThemedText>{duration ? duration : '---'}</ThemedText>
                    <ThemedText style={styles.dateTime}>{new Date(memory.createdAt).toLocaleString()}</ThemedText>
                </ThemedView>
            </ThemedView>

            <ThemedText style={styles.description}>{memory.description}</ThemedText>
            <ThemedText style={styles.location}>đây là địa điểm voice</ThemedText>
        </ThemedView>
    );
}


const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    button: {
        backgroundColor: "#eee",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 10,
    },
    emoji: {
        fontSize: 28,
        marginRight: 10,
    },
    info: {
        flex: 1,
    },
    duration: {
        fontSize: 12,
        color: "#666",
    },
    dateTime: {
        fontSize: 12,
        color: "#999",
    },
    description: {
        fontSize: 14,
        color: "#333",
        marginBottom: 4,
    },
    location: {
        fontSize: 13,
        color: "#555",
        fontStyle: "italic",
        marginBottom: 8,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
    },
});
