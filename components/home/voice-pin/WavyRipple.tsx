import React from "react";
import { View, StyleSheet } from "react-native";
import { View as MotiView } from "moti";
import { Easing } from "react-native-reanimated";

interface WavyRippleProps {
  isPlaying: boolean;
  color: string;
  emotionLabel?: string;
}

export function WavyRipple({ isPlaying, color, emotionLabel }: WavyRippleProps) {
  if (!isPlaying) return null;

  const rippleColor = color || '#fb7185';
  
  // Determine intensity based on emotion
  const isSad = ['U sầu', 'Cô đơn', 'Hoài niệm', 'Bình yên'].includes(emotionLabel || '');
  const isStrong = ['Vui vẻ', 'Năng động', 'Giận dữ', 'Truyền cảm hứng'].includes(emotionLabel || '');
  
  const duration = isStrong ? 2000 : isSad ? 5000 : 3500;
  const maxScale = isStrong ? 3.0 : isSad ? 1.8 : 2.4;
  const rippleCount = isStrong ? 4 : 2;

  return (
    <View style={styles.rippleContainer} pointerEvents="none">
      {/* Background Glow Layers */}
      {[0, 1].map((i) => (
        <MotiView
          key={`glow-${i}`}
          from={{ scale: 0.8, opacity: 0.2 }}
          animate={{
            scale: 1.5,
            opacity: 0.05,
          }}
          transition={{
            type: "timing",
            duration: duration * 1.5,
            loop: true,
            delay: i * 800,
            easing: Easing.out(Easing.exp),
          }}
          style={[styles.glowLayer, { backgroundColor: rippleColor }]}
        />
      ))}

      {/* Main Radar Ripples */}
      {Array.from({ length: rippleCount }).map((_, i) => (
        <MotiView
          key={`ripple-${i}`}
          from={{ scale: 0.8, opacity: 0.5 }}
          animate={{
            scale: maxScale,
            opacity: 0,
          }}
          transition={{
            type: "timing",
            duration: duration,
            loop: true,
            delay: i * (duration / rippleCount),
            easing: Easing.out(Easing.quad),
          }}
          style={[styles.rippleRing, { borderColor: rippleColor, borderWidth: isSad ? 1 : 2 }]}
        />
      ))}
      
      {/* Inner Pulses for Deep Emotions */}
      {!isStrong && (
        <MotiView
          from={{ scale: 0.9, opacity: 0.3 }}
          animate={{
            scale: 1.1,
            opacity: 0.1,
          }}
          transition={{
            type: "timing",
            duration: duration * 0.8,
            loop: true,
            repeatReverse: true,
            easing: Easing.inOut(Easing.sin),
          }}
          style={[styles.rippleRing, { borderColor: rippleColor, borderWidth: 1, borderStyle: 'dotted' }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rippleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  rippleRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowLayer: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  }
});
