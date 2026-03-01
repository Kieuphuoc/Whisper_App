import { VoicePin } from '@/types';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import VoiceBloomPin from './VoiceBloomPin';

type Props = {
  pins: VoicePin[];
  onSelect: (pin: VoicePin) => void;
  onClose: () => void;
};

export default function VoiceBloom({ pins, onSelect, onClose }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
      <View style={styles.center}>
        {pins.map((pin, index) => (
          <VoiceBloomPin
            key={pin.id}
            pin={pin}
            index={index}
            total={pins.length}
            progress={progress}
            onPress={() => onSelect(pin)}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -1,
    marginTop: -1,
  },
});
