import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView from 'react-native-maps';

const { width, height } = Dimensions.get('window');

type RandomVoice = {
  id: string;
  emotion: string;
  duration: string;
  distance: string;
  isPlaying: boolean;
};

export default function RandomVoiceScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<RandomVoice | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  const mockRandomVoice: RandomVoice = {
    id: '1',
    emotion: '😊',
    duration: '1:23',
    distance: '0.3km',
    isPlaying: false,
  };

  useEffect(() => {
    setCurrentVoice(mockRandomVoice);
  }, []);

  const playRandomVoice = () => {
    setIsPlaying(true);
    setCurrentVoice(prev => prev ? { ...prev, isPlaying: true } : null);

    // Animate the emotion sticker
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Simulate voice playback
    setTimeout(() => {
      setIsPlaying(false);
      setCurrentVoice(prev => prev ? { ...prev, isPlaying: false } : null);
      fadeAnim.setValue(0);
    }, 5000);
  };

  const stopVoice = () => {
    setIsPlaying(false);
    setCurrentVoice(prev => prev ? { ...prev, isPlaying: false } : null);
    fadeAnim.setValue(0);
  };

  const skipVoice = () => {
    // Generate new random voice
    const emotions = ['😊', '🎵', '🌅', '📚', '🎉', '😢', '🤔', '💭'];
    const newVoice: RandomVoice = {
      id: Math.random().toString(),
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      duration: `${Math.floor(Math.random() * 3) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      distance: `${(Math.random() * 1).toFixed(1)}km`,
      isPlaying: false,
    };
    setCurrentVoice(newVoice);
    fadeAnim.setValue(0);
  };

  return (
    <View style={styles.container}>
      {/* Blurred Map Background */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        />
        <BlurView intensity={20} style={styles.blurOverlay} />
      </View>

      {/* Content Overlay */}
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Random Voice</Text>
          <Text style={styles.subtitle}>Discover voices from nearby</Text>
        </View>

        {/* Central Play Area */}
        <View style={styles.playArea}>
          {/* Emotion Sticker */}
          {currentVoice && (
            <Animated.View
              style={[
                styles.emotionContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={styles.emotionText}>{currentVoice.emotion}</Text>
            </Animated.View>
          )}

          {/* Play Button */}
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playingButton]}
            onPress={isPlaying ? stopVoice : playRandomVoice}
          >
            <Ionicons
              name={isPlaying ? 'stop' : 'play'}
              size={48}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* Voice Info */}
          {currentVoice && (
            <View style={styles.voiceInfo}>
              <Text style={styles.durationText}>{currentVoice.duration}</Text>
              <Text style={styles.distanceText}>{currentVoice.distance} away</Text>
            </View>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={skipVoice}>
            <Ionicons name="shuffle" size={24} color="#6b7280" />
            <Text style={styles.controlButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="heart-outline" size={24} color="#6b7280" />
            <Text style={styles.controlButtonText}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="share-outline" size={24} color="#6b7280" />
            <Text style={styles.controlButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Status Message */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isPlaying
              ? 'Playing anonymous voice...'
              : 'Tap to discover a random voice from within 1km'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  playArea: {
    alignItems: 'center',
    marginBottom: 60,
  },
  emotionContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  emotionText: {
    fontSize: 48,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  playingButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  voiceInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
