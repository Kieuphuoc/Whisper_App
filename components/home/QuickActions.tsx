import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/Theme";

type QuickActionsProps = {
    onFriends?: () => void;
    onNotifications?: () => void;
    onChat?: () => void;
    receivedCount?: number;
    unreadCount?: number;
};

const QuickActions: React.FC<QuickActionsProps> = ({
    onFriends,
    onNotifications,
    onChat,
    receivedCount = 0,
    unreadCount = 0,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const colorScheme = useColorScheme() || "light";
    const isDark = colorScheme === 'dark';
    
    // Animation for expansion
    const [animation] = useState(new Animated.Value(0));

    const toggleMenu = () => {
        const toValue = isExpanded ? 0 : 1;
        Animated.spring(animation, {
            toValue,
            useNativeDriver: true,
            friction: 5,
        }).start();
        setIsExpanded(!isExpanded);
    };

    const totalBadge = receivedCount + unreadCount;

    const renderItem = (icon: keyof typeof Ionicons.glyphMap, onPress: () => void, delay: number, badge?: number) => {
        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -60 * delay],
        });
        const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
        });

        return (
            <Animated.View style={[styles.menuItem, { transform: [{ translateY }], opacity }]}>
                <TouchableOpacity style={styles.actionButton} onPress={() => { onPress(); toggleMenu(); }}>
                    <View style={[
                        styles.iconCircle, 
                        { 
                            backgroundColor: isDark ? 'rgba(18,18,18,0.9)' : 'rgba(255,255,255,0.95)',
                            overflow: 'hidden'
                        }
                    ]}>
                        <BlurView
                            intensity={isDark ? 20 : 40}
                            tint={isDark ? 'dark' : 'light'}
                            style={StyleSheet.absoluteFill}
                        />
                        <Ionicons name={icon} size={22} color="#8b5cf6" />
                        {badge > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{badge}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {renderItem("chatbubble-ellipses", onChat!, 2)}
            {renderItem("notifications", onNotifications!, 1, unreadCount)}

            <TouchableOpacity
                activeOpacity={0.9}
                style={[
                    styles.mainButton,
                    {
                        backgroundColor: isDark ? 'rgba(18,18,18,0.9)' : 'rgba(255,255,255,0.95)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                    }
                ]}
                onPress={toggleMenu}
            >
                <BlurView
                    intensity={isDark ? 20 : 40}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View style={{
                    transform: [{
                        rotate: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '45deg']
                        })
                    }]
                }}>
                    <Ionicons name="grid" size={24} color="#8b5cf6" />
                </Animated.View>
                {unreadCount > 0 && !isExpanded && (
                    <View style={styles.mainBadge}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default QuickActions;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 20,
        bottom: 110,
        zIndex: 1000,
        alignItems: 'center',
    },
    mainButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuItem: {
        position: 'absolute',
        bottom: 0,
    },
    actionButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    mainBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ef4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
});


