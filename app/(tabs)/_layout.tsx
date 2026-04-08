import { MyUserContext } from '@/configs/Context';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useSegments } from 'expo-router';
import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '@/configs/Apis';
import { useSocket } from '@/hooks/useSocket';
import { View, StyleSheet, Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '@/services/notificationService';

export default function TabLayout() {
    const user = useContext(MyUserContext);
    const segments = useSegments();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const isFetchingRef = useRef(false);

    const fetchUnreadCount = useCallback(async () => {
        if (isFetchingRef.current) return;
        try {
            isFetchingRef.current = true;
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);
            const res = await api.get(endpoints.notificationsUnread);
            setUnreadCount(res.data?.unreadCount || 0);
        } catch (e: any) {
            if (e.response?.status !== 401) {
                console.error('Fetch unread count error in TabLayout:', e.message || e);
            }
        } finally {
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        AsyncStorage.getItem('token').then(() => setIsReady(true)).catch(() => setIsReady(true));
    }, []);

    const { on, off } = useSocket(user?.id);

    useEffect(() => {
        if (user) {
            AsyncStorage.getItem('token').then((token) => {
                if (token) registerForPushNotificationsAsync(token);
            });

            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);

            on('new_message', () => fetchUnreadCount());

            return () => {
                clearInterval(interval);
                off('new_message');
            };
        }
    }, [user, fetchUnreadCount, on, off]);

    if (!isReady) return null;
    if (!user) return <Redirect href="/login" />;

    const shouldHideTabBar = segments[0] === '(tabs)' && segments[1] === 'home' && segments[2] === 'chat';

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
                    display: shouldHideTabBar ? 'none' : 'flex',
                },
                tabBarBackground: () => (
                    <BlurView tint="light" intensity={60} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 36, overflow: 'hidden' }} />
                ),
            }}
        >
            <Tabs.Screen name="memory"
                options={{
                    title: 'Ký ức',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "planet" : "planet-outline"} size={26} color={color} />
                    ),
                }}
            />

            <Tabs.Screen name="album"
                options={{
                    title: 'Album',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "library" : "library-outline"} size={26} color={color} />
                    ),
                }}
            />

            <Tabs.Screen name="home"
                options={{
                    title: 'Bản đồ',
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.homeIconContainer}>
                            <Ionicons name={focused ? "compass" : "compass-outline"} size={24} color="#ffffff" />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen name="profile"
                options={{
                    title: 'Hồ sơ',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "search" : "search-outline"} size={26} color={color} />
                    ),
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 'bold',
                        marginTop: 2,
                    }
                }}
            />

            <Tabs.Screen name="notification/index"
                options={{ href: null }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    homeIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 15 : 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
});
