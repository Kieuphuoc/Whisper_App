import React, { useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAudioPlayer } from 'expo-audio';

type Memory = {
    id: string;
    emoji: string;
    duration: string;
    createdAt: string;
    description: string;
    longitude: number;
    latitude: number;
    progressColor: string;
    audioUrl: string; // URL âm thanh từ backend


};

export function MemoryCard({ memory }: { memory: Memory }) {
    const player = useAudioPlayer(memory.audioUrl); // <-- tạo player từ URL
    const [isPlaying, setIsPlaying] = useState(false); // <- biến riêng lưu status
    const handleToggle = async () => {
  if (isPlaying) {
    await player.pause();
    setIsPlaying(false);
  } else {
    await player.play();
    setIsPlaying(true);
  }
};


    return (
        <ThemedView style={styles.card}>
            <ThemedView style={styles.row}>
                <Pressable style={styles.button} onPress={handleToggle}
                >
                    <Text>
                        {isPlaying ? 'Pause' : 'Play'}
                    </Text>
                </Pressable>
                <ThemedView style={styles.imageBox}>``
                    <ThemedText style={styles.emoji}>{memory.emoji}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.content}>
                    <ThemedView style={styles.row}>
                        <ThemedText style={styles.duration}>{player.duration}</ThemedText>
                        <ThemedText type="default" style={styles.dateTime}>
                            {new Date(memory.createdAt).toLocaleString()}
                        </ThemedText>
                    </ThemedView>
                    <ThemedText type="default">{memory.description}</ThemedText>
                    <ThemedText type="default" style={styles.location}>
                        📍 {memory.latitude.toFixed(5)}, {memory.longitude.toFixed(5)}
                    </ThemedText>
                </ThemedView>
            </ThemedView>
            <ThemedView
                style={[styles.progressBar, { backgroundColor: memory.progressColor }]}
            />
        </ThemedView>
    );
}


const styles = StyleSheet.create({
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
    },
    card: {
        marginVertical: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    emoji: {
        fontSize: 24,
    },
    content: {
        flex: 1,
    },
    duration: {
        fontWeight: 'bold',
        marginRight: 8,
    },
    dateTime: {
        color: '#888',
    },
    location: {
        marginTop: 4,
        fontStyle: 'italic',
        color: '#666',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        marginTop: 8,
    },
});
