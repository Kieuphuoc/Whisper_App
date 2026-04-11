import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function VoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  console.log("Ma chi tiet voice", id);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Chi tiết giọng nói: {id}</Text>
    </View>
  );
}

