import React, { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface VoiceMessage {
  id: string;
  emotion: string;
  isOwn: boolean;
  username: string;
}

interface MainScreenProps {
  voices: VoiceMessage[];
  onVoiceSelect: (voice: VoiceMessage) => void;
}

const { width, height } = Dimensions.get('window');

export default function MapScreen({ voices, onVoiceSelect }: MainScreenProps) {
  const [filter, setFilter] = useState<'all' | 'friends' | 'mine'>('all');
  const [isRecording, setIsRecording] = useState(false);

  const filteredVoices = voices.filter((voice) => {
    if (filter === 'mine') return voice.isOwn;
    if (filter === 'friends') return !voice.isOwn && voice.username !== 'Anonymous';
    return true;
  });

  const handleRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
    }, 3000);
  };

  return (
    <View style={styles.container}>
      Filter Bar
      

      {/* Map Background Placeholder */}
      <View style={styles.mapPlaceholder}>
        {/* Fake Voice Pins */}
        {filteredVoices.map((voice) => {
          const left = Math.random() * (width - 50);
          const top = Math.random() * (height - 200);
          return (
            <TouchableOpacity
              key={voice.id}
              onPress={() => onVoiceSelect(voice)}
              style={[styles.voicePin, { left, top }]}
            >
              <View style={styles.pinCircle}>
                <Text style={styles.emotionText}>{voice.emotion}</Text>
              </View>
              <View style={styles.pinTail} />
            </TouchableOpacity>
          );
        })}

        {/* Record Button */}
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingActive]}
          onPress={handleRecord}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <View style={styles.innerRecordButton}>
              <View style={styles.innerDot} />
            </View>
          )}
        </TouchableOpacity>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingTextContainer}>
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Light green-ish background
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 40,
    marginHorizontal: 16,
    justifyContent: 'space-between',
    backgroundColor: '#ffffffdd',
    padding: 6,
    borderRadius: 30,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#22c55e',
  },
  filterButtonText: {
    color: '#555',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e5f9e5',
    position: 'relative',
  },
  voicePin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#22c55e',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pinTail: {
    width: 10,
    height: 10,
    backgroundColor: '#22c55e',
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
  },
  emotionText: {
    color: '#fff',
    fontSize: 18,
  },
  recordButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  recordingActive: {
    backgroundColor: '#ef4444',
  },
  innerRecordButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDot: {
    width: 16,
    height: 16,
    backgroundColor: '#22c55e',
    borderRadius: 8,
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  recordingTextContainer: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
  },
});
