import { Stack } from 'expo-router';
import React from 'react';

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{headerShown: false}}/>
      <Stack.Screen name="profile" />
    </Stack>
  )
}
