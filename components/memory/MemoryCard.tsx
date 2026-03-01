import { VoicePin } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

type Props = {
  item: VoicePin;
  onPress: () => void;
};

export function MemoryCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.emotion}>{item.emotionLabel}</Text>
      <Text style={styles.content} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.time}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  emotion: {
    fontSize: 14,
    marginBottom: 6,
  },
  content: {
    fontSize: 16,
    color: '#fff',
  },
  time: {
    marginTop: 8,
    fontSize: 12,
    color: '#aaa',
  },
});
