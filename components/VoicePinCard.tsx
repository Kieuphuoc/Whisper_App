import { VoicePinCardProps } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { theme } from '@/constants/Theme';
import { Colors } from '@/constants/Colors';

export default function VoicePinCard({ voicePin, onClose }: VoicePinCardProps) {
  const colorScheme = useColorScheme() || 'light';
  const currentTheme = theme[colorScheme];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const player = useAudioPlayer(voicePin.audioUrl);
  const navigation = useNavigation<any>();

  const playPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const handlePress = useCallback(() => {
    if (voicePin) {
      navigation.navigate('voiceDetail', { voicePinId: voicePin.id });
    }
  }, [voicePin, navigation]);

  const formatTime = (seconds: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.primary + '1A' }]}>
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
          <Ionicons name="close" size={20} color={currentTheme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          {voicePin.user?.avatar ? (
            <Image source={{ uri: voicePin?.user?.avatar }} style={[styles.avatar, { borderColor: currentTheme.colors.primary }]} />
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.border }]}>
              <Ionicons name="person" size={20} color={currentTheme.colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: currentTheme.colors.text }]}>{voicePin?.user?.displayName || 'Anonymous'}</Text>
          <Text style={[styles.timestamp, { color: currentTheme.colors.textMuted }]}>
            {new Date(voicePin.createdAt).toLocaleDateString('vi-VN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: currentTheme.colors.textSecondary }]} numberOfLines={2}>
        {voicePin.content}
      </Text>

      {/* Audio Player */}
      <View style={[styles.audioSection, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
        <TouchableOpacity onPress={playPause} style={[styles.playButton, { backgroundColor: currentTheme.colors.primary }]}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>

        <View style={styles.audioInfo}>
          <View style={[styles.progressBar, { backgroundColor: currentTheme.colors.border }]}>
            <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: currentTheme.colors.primary }]} />
          </View>
          <View style={styles.timeInfo}>
            <Text style={[styles.timeText, { color: currentTheme.colors.textMuted }]}>{formatTime(currentTime)}</Text>
            <Text style={[styles.timeText, { color: currentTheme.colors.textMuted }]}>{formatTime(totalDuration)}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color={currentTheme.colors.textMuted} />
          <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>{voicePin.reactionsCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={currentTheme.colors.textMuted} />
          <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>{voicePin.commentsCount || 0}</Text>
        </View>
      </View>

      {/* View Detail Button */}
      <TouchableOpacity 
        style={[styles.detailButton, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.primary + '33' }]} 
        onPress={handlePress}
      >
        <Text style={[styles.detailButtonText, { color: currentTheme.colors.primary }]}>Detail Voice Pin</Text>
        <Ionicons name="arrow-forward" size={16} color={currentTheme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  audioSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
