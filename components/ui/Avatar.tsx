import React, { useMemo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, useColorScheme, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Text } from './text';
import { theme } from '@/constants/Theme';
import { BASE_URL } from '@/configs/Apis';

interface AvatarProps {
    uri?: string | null;
    size?: number;
    showLevel?: boolean;
    level?: number;
    showCamera?: boolean;
    onPress?: () => void;
    style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
    uri,
    size = 120,
    showLevel = false,
    level = 1,
    showCamera = false,
    onPress,
    style,
}) => {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];

    const avatarSource = useMemo(() => {
        if (!uri) return require('@/assets/images/avatar.png');
        const finalUri = uri.startsWith('http') ? uri : `${BASE_URL}${uri.startsWith('/') ? '' : '/'}${uri}`;
        return { uri: finalUri };
    }, [uri]);

    // Scale factors based on default size 120
    const scale = size / 120;
    const borderRadius = 36 * scale;
    const innerBorderRadius = 32 * scale;
    const cameraSize = 40 * scale;
    const cameraIconSize = 18 * scale;
    const levelFontSize = 13 * scale;

    const content = (
        <View style={[styles.avatarOuter, { 
            width: size, 
            height: size, 
            borderRadius,
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
        }, style]}>
            <Image source={avatarSource} style={[styles.avatar, { borderRadius: innerBorderRadius }]} />
            
            {showCamera && (
                <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 300, type: 'spring' }}
                    style={[styles.cameraIconContainer, { 
                        width: cameraSize, 
                        height: cameraSize, 
                        borderRadius: cameraSize / 2,
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    }]}
                >
                    <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    <Ionicons name="camera" size={cameraIconSize} color={isDark ? "#fff" : "#1a1a1a"} />
                </MotiView>
            )}

            {showLevel && (
                <MotiView
                    from={{ rotate: '45deg', scale: 0 }}
                    animate={{ rotate: '-35deg', scale: 1 }}
                    transition={{ delay: 200, type: 'spring' }}
                    style={[styles.levelCapsule, { 
                        backgroundColor: currentTheme.colors.primary,
                        top: -8 * scale,
                        left: -15 * scale,
                    }]}
                >
                    <Text style={[styles.levelText, { fontSize: levelFontSize }]}>XP {level}</Text>
                </MotiView>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    avatarOuter: {
        borderWidth: 3,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'visible',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        zIndex: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    levelCapsule: {
        position: 'absolute',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    levelText: {
        color: '#fff',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
