import { VoicePin } from '@/types';
import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

type Props = {
  pin: VoicePin;
  index: number;
  total: number;
  progress: Animated.Value;
  onPress: () => void;
};

const RADIUS = 70;

export default function VoiceBloomPin({
  pin,
  index,
  total,
  progress,
  onPress,
}: Props) {
  const angle = (2 * Math.PI * index) / total;

  const x = Math.cos(angle) * RADIUS;
  const y = Math.sin(angle) * RADIUS;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, x],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, y],
  });

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.pin,
        {
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <Pressable style={styles.inner} onPress={onPress} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: 'absolute',
  },
  inner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    opacity: 0.9,
  },
});
