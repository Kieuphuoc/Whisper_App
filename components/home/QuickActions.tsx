import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, useColorScheme } from "react-native";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/Theme";

type QuickActionsProps = {
    onExplore?: () => void;
    onFriends?: () => void;
    onNotifications?: () => void;
    onTrending?: () => void;
    isScanning?: boolean;
    receivedCount?: number;
    unreadCount?: number;
};

const QuickActions: React.FC<QuickActionsProps> = ({
    onExplore,
    onFriends,
    onNotifications,
    onTrending,
    isScanning,
    receivedCount = 0,
    unreadCount = 0,
}) => {
    const colorScheme = useColorScheme() || "light";
    const currentTheme = theme[colorScheme];

    return (
        <View style={[styles.quickActionsBento, {
            backgroundColor: currentTheme.colors.background + 'F2',
            borderColor: currentTheme.colors.primary + '1A',
        }]}>
            <TouchableOpacity style={styles.quickActionButton} onPress={onExplore} disabled={isScanning}>
                <View style={[styles.quickActionIcon, isScanning && { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                    {isScanning ? (
                        <ActivityIndicator size="small" color="#8b5cf6" />
                    ) : (
                        <Ionicons name="compass" size={20} color="#8b5cf6" />
                    )}
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton} onPress={onNotifications}>
                <View style={styles.quickActionIcon}>
                    <Ionicons name="notifications" size={20} color="#8b5cf6" />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton} onPress={onFriends}>
                <View style={styles.quickActionIcon}>
                    <Ionicons name="people" size={20} color="#8b5cf6" />
                    {receivedCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{receivedCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

        </View>
    );
};

export default QuickActions;

const styles = StyleSheet.create({
    quickActionsBento: {
        position: "absolute",
        top: 140,
        left: 16,
        borderRadius: 20,
        padding: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
    },

    quickActionButton: {
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginVertical: 4,
    },

    quickActionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
});