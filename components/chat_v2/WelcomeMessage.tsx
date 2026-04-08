import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface WelcomeMessageProps {
    name?: string;
    avatarUrl?: string;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ 
    name = "User", 
    avatarUrl = "https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg" 
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.avatarWrapper}>
                <Image 
                    source={{ uri: avatarUrl }} 
                    style={styles.avatar}
                    contentFit="cover"
                />
            </View>
            <View style={styles.copyWrapper}>
                <Text style={styles.greeting}>Hi, {name}!</Text>
                <Text style={styles.title}>How can I help you?</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 12,
        marginBottom: 8,
    },
    avatarWrapper: {
        shadowColor: "#0B0F19",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    copyWrapper: {
        marginLeft: 20,
    },
    greeting: {
        fontSize: 18,
        color: "#6B7280",
        fontWeight: "500",
    },
    title: {
        fontSize: 24,
        color: "#111827",
        fontWeight: "800",
        marginTop: 2,
    },
});

export default WelcomeMessage;

