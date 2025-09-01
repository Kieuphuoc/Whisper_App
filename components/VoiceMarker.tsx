import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Marker } from 'react-native-maps';

type VoiceMarkerProps = {
  latitude: number;
  longitude: number;
  title: string;
  voicePin: {
    id: string;
    description: string;
    duration: number;
    audioUrl: string;
    createdAt: string;
    user?: {
      name: string;
      avatar?: string;
    };
    likes?: number;
    replies?: number;
  };
  onPress: (voicePin: any) => void;
  isFocused?: boolean;
};

export default function VoiceMarker({ 
  latitude, 
  longitude, 
  voicePin, 
  onPress, 
  isFocused = false 
}: VoiceMarkerProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      // Animate when focused
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [isFocused]);

  const handlePress = () => {
    setIsPressed(true);
    onPress(voicePin);
    
    // Reset pressed state after a short delay
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <Marker
      coordinate={{
        latitude: latitude,
        longitude: longitude,
      }}  
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[
          styles.markerContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          <View style={[
            styles.markerBackground,
            isFocused && styles.focusedMarkerBackground
          ]}>
            <Ionicons 
              name="mic" 
              size={20} 
              color={isFocused ? "#ffffff" : "#8b5cf6"} 
            />
          </View>
          
          {isFocused && (
            <Animated.View 
              style={[
                styles.markerPulse,
                { transform: [{ scale: pulseAnim }] }
              ]} 
            />
          )}
          
          <View style={[
            styles.markerGlow,
            isFocused && styles.focusedMarkerGlow
          ]} />
        </Animated.View>
      </TouchableOpacity>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  focusedMarkerBackground: {
    backgroundColor: '#8b5cf6',
    borderColor: '#ffffff',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  markerPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.6)',
  },
  markerGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  focusedMarkerGlow: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
});