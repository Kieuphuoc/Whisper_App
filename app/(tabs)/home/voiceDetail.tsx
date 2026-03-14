import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function VoiceDetailScreen() {
  const { voicePinId } = useLocalSearchParams();
  console.log("Ma chi tiet voice", voicePinId);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Chi tiết giọng nói: {voicePinId}</Text>
    </View>
  );
}

