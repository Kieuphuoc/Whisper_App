import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioRecorder } from 'expo-audio';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type VoicePinPreviewProps = {
  message: string;
  isOwn?: boolean;
  recorder: ReturnType<typeof useAudioRecorder>;
};

export default function VoicePinPreview({ message, isOwn = false, recorder }: VoicePinPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [description, setDescription] = useState('');

  const intervalRef = useRef<any>(null);
    const player = useAudioPlayer(recorder.uri);
    // console.log(
    //   player
    // )
    const play = () => {
        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.play();
            setIsPlaying(true);
        }
    };

  const formatMillis = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>{message}</Text>

        {/* Audio controls */}
        <View style={styles.audioControls}>
          <TouchableOpacity onPress={play}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#8b5cf6" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.duration}>{formatMillis(player.duration)}</Text>
        </View>

        {/* Description input */}
        <TextInput
          style={styles.input}
          placeholder="Nhập mô tả..."
          value={description}
          onChangeText={setDescription}
        />

        {/* Tail */}
        <View style={[styles.tail, isOwn ? styles.ownTail : styles.otherTail]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    position: 'relative',
    backgroundColor: 'white',
  },
  ownBubble: {
    borderTopRightRadius: 0,
  },
  otherBubble: {
    borderTopLeftRadius: 0,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  ownText: {
    color: '#111827',
  },
  otherText: {
    color: '#111827',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  duration: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    color: '#6b7280',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#111827',
  },
  tail: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  ownTail: {
    right: -6,
    borderTopWidth: 10,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderLeftColor: 'white',
  },
  otherTail: {
    left: -6,
    borderTopWidth: 10,
    borderRightWidth: 12,
    borderTopColor: 'transparent',
    borderRightColor: 'white',
  },
});
