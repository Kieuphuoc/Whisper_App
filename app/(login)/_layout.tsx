import { Stack } from 'expo-router';
import React from 'react';

export default function LoginStack() {
  return (
    <Stack>
      <Stack.Screen
            name="login"
            options={{
             headerShown:false,
            }}
          />
    </Stack>
  );
}
