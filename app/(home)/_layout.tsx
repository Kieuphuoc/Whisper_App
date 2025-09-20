import Header from '@/components/Header';
import { Stack } from 'expo-router';
import React from 'react';

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="voiceDetail"
        options={{
          header: () => <Header title="Voice Detail" />,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          header: () => <Header title="Profile User" />,
        }}
      />
      <Stack.Screen
        name="listfriend"
        options={{
          header: () => <Header title="List Friend" />,
        }}
      />
    </Stack>
  );
}
