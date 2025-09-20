import { Header } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileStack() {
  return (
   <Stack>
       <Stack.Screen
         name="profile"
           options={{
                   header: () => <Header title="My Profile" />,
                 }}/>
     </Stack>
   );

}
