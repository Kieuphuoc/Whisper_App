import { VoicePin } from '@/types';
import { Audio } from 'expo-av';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  voice: VoicePin | null;
  onRandomPress: () => void;
};

export default function RandomVoicePlayer({ voice, onRandomPress }: Props) {
  const playSound = async () => {
    if (!voice) return;

    const { sound } = await Audio.Sound.createAsync({
      uri: voice.audioUrl,
    });

    await sound.playAsync();
  };

  return (
    <View style={styles.container}>
      {voice ? (
        <>
          {voice.imageUrl && (
            <Image source={{ uri: voice.imageUrl }} style={styles.image} />
          )}

          <Text style={styles.content}>{voice.content}</Text>

          <Text style={styles.meta}>
            📍 {voice.address}
          </Text>

          <Text style={styles.meta}>
            🙂 {voice.emotionLabel}
          </Text>

          <TouchableOpacity style={styles.playBtn} onPress={playSound}>
            <Text style={styles.playText}>▶ Nghe voice</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.empty}>
          Không có voice nào quanh bạn
        </Text>
      )}

      <TouchableOpacity style={styles.randomBtn} onPress={onRandomPress}>
        <Text style={styles.randomText}>🎧 Random Voice</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
  },
  content: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 6,
  },
  meta: {
    color: '#aaa',
    fontSize: 13,
  },
  playBtn: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
  },
  playText: {
    color: '#fff',
  },
  randomBtn: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#6d28d9',
    borderRadius: 10,
    alignItems: 'center',
  },
  randomText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
  },
});
