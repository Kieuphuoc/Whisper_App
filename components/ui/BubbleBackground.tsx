import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { theme } from '@/constants/Theme';

/**
 * A reusable background component featuring two animated, subtle bubbles.
 * Designed to provide a premium, dynamic feel without distracting from content.
 */
export const BubbleBackground = () => {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Bubble 1 (Top Left) */}
            <MotiView
                from={{ opacity: 0.1, scale: 1 }}
                animate={{ 
                    opacity: isDark ? 0.15 : 0.12, 
                    scale: 1.4 
                }}
                transition={{ loop: true, type: 'timing', duration: 12000, repeatReverse: true }}
                style={[
                    styles.auraCircle, 
                    { 
                        backgroundColor: currentTheme.colors.primary, 
                        top: '-14%', 
                        left: '-22%' 
                    }
                ]}
            />
            {/* Bubble 2 (Bottom Right) */}
            <MotiView
                from={{ opacity: 0.08, scale: 1.2 }}
                animate={{ 
                    opacity: isDark ? 0.12 : 0.1, 
                    scale: 0.9 
                }}
                transition={{ loop: true, type: 'timing', duration: 15000, repeatReverse: true }}
                style={[
                    styles.auraCircle, 
                    { 
                        backgroundColor: '#3b82f6', 
                        bottom: '10%', 
                        right: '-24%' 
                    }
                ]}
            />
            
            {/* Overlay Blur for smoothness */}
            <BlurView intensity={isDark ? 40 : 20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        </View>
    );
};

const styles = StyleSheet.create({
    auraCircle: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
    },
});

export default BubbleBackground;
