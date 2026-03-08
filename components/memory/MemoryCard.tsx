import { VoicePin } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { theme } from '@/constants/Theme';

type Props = {
  item: VoicePin;
  onPress: () => void;
};

export function MemoryCard({ item, onPress }: Props) {
  const colorScheme = useColorScheme() || 'light';
  const currentTheme = theme[colorScheme];

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }]} 
      onPress={onPress}
    >
      <Text style={[styles.emotion, { color: currentTheme.colors.primary }]}>{item.emotionLabel || '🎵'}</Text>
      <Text style={[styles.content, { color: currentTheme.colors.text }]} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={[styles.time, { color: currentTheme.colors.textMuted }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  emotion: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '700',
  },
  content: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  time: {
    marginTop: 8,
    fontSize: 12,
  },
});
