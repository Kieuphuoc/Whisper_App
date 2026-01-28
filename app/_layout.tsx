import { MyDispatchContext, MyUserContext, User, userReducer } from '@/configs/Context';
import { Stack } from 'expo-router';
import React, { useReducer } from 'react';

export default function RootLayout() {
  const [user, dispatch] = useReducer(userReducer, null);

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="voiceDetail" />
        </Stack>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
}
