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
                tabBarActiveTintColor: '#7c3aed',
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
            <Tabs.Screen name="memory"
                options={{
                    title: 'Ký ức',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "heart" : "heart-outline"} size={26} color={color} />,
                }}
            />

            <Tabs.Screen name="home/index"
                options={{
                    title: 'Bản đồ',
                    tabBarIcon: ({ focused }) => (
                        <View style={{
                            width: 52,
                            height: 52,
                            borderRadius: 26,
                            backgroundColor: '#000000',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 4,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.2,
                            shadowRadius: 12,
                            elevation: 6,
                        }}>
                            <Ionicons name={focused ? "map" : "map-outline"} size={24} color="#ffffff" />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen name="notification/index"
                options={{
                    title: 'Tín hiệu',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "notifications" : "notifications-outline"} size={26} color={color} />,
                }}
            />

            <Tabs.Screen name="profile/index"
                options={{
                    title: 'Hồ sơ',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />,
                }}
            />
        </Tabs>
    );
}
