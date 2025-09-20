import { Stack } from 'expo-router';
import React from 'react';

export default function MemoryStack() {
  return (
    <Stack>
      <Stack.Screen name="memory" options={{headerShown: false}}/>
    </Stack>
  )
}
