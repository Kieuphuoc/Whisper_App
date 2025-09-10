import { Stack } from 'expo-router';
import React from 'react';

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{headerShown: false}}/>
      <Stack.Screen name="voiceDetail" />\
      <Stack.Screen name="profile" />
    </Stack>
  )
}
