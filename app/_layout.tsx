import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // const user = useContext(MyUserContext); // lấy user từ context
  const user = { id: 1, name: 'Phuoc' };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />



     
          <Tabs.Screen
            name="(memory)"
            options={{
              title: 'Memory',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="(profile)"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
            }}
          />
           <Tabs.Screen
        name="(login)"
        options={{
          title: 'Login',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
          
      <Tabs.Screen
        name="(register)"
        options={{
          title: 'Register',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
