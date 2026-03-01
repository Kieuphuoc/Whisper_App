import { MyUserContext } from '@/configs/Context';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const user = useContext(MyUserContext);

  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
        },
        tabBarBackground: () => (
          <BlurView tint="light" intensity={60} style={{ flex: 1, borderRadius: 36, overflow: 'hidden' }} />
        ),
      }}
    >
      <Tabs.Screen name="home"
        options={{
          title: 'Bản đồ',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "map" : "map-outline"} size={26} color={color} />,
        }}
      />

      <Tabs.Screen name="memory"
        options={{
          title: 'Ký ức',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "heart" : "heart-outline"} size={26} color={color} />,
        }}
      />

      <Tabs.Screen name="notification/index"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#000000',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 4, // Slight adjustment to center within the circle visually
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
            }}>
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color="#ffffff" />
            </View>
          ),
        }}
      />

      <Tabs.Screen name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />,
        }}
      />

      <Tabs.Screen name="admin/index"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
