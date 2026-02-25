import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  voice: VoicePin;
  onHide: () => void;
  onDelete: () => void;
};

export function VoiceRow({ voice, onHide, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {voice.imageUrl && (
          <Image
            source={{ uri: voice.imageUrl }}
            style={styles.image}
          />
        )}

        <View style={styles.content}>
          <Text style={styles.idText}>ID: {voice.id}</Text>
          <Text style={styles.contentText} numberOfLines={2}>{voice.content}</Text>
          <Text style={styles.addressText} numberOfLines={1}>📍 {voice.address}</Text>
          <Text style={styles.infoText}>
            Visible: {voice.visibility} | {voice.isAnonymous ? '👤 Anonymous' : '👥 Public'}
          </Text>
          <Text style={styles.statsText}>
            🎧 {voice.listensCount} · ❤️ {voice.reactionsCount} · 💬 {voice.commentsCount}
          </Text>
          <Text style={styles.emotionText}>
            Mood: {voice.emotionLabel} ({voice.emotionScore})
          </Text>

          <View style={styles.audioPlaceholder}>
            <Ionicons name="musical-note" size={14} color="#8b5cf6" />
            <Text style={styles.audioText}>Audio: {voice.audioUrl.split('/').pop()}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onHide} style={styles.actionButton}>
            <Ionicons name="eye-off-outline" size={20} color="#6b7280" />
            <Text style={styles.actionText}>Hide</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete} style={[styles.actionButton, { marginTop: 12 }]}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  content: {
    flex: 1,
  },
  idText: {
    color: '#8b5cf6',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  contentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 11,
    marginBottom: 2,
  },
  statsText: {
    color: '#8b5cf6',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  emotionText: {
    color: '#6b7280',
    fontSize: 11,
  },
  audioPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 6,
    borderRadius: 6,
  },
  audioText: {
    color: '#8b5cf6',
    fontSize: 10,
  },
  actions: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
});
