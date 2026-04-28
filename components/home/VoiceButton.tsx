import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { theme } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

type VoiceButtonProps = {
    isRecording: boolean;
    onPress: () => void;
};

export default function VoiceButton({ isRecording, onPress }: VoiceButtonProps) {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Floating animation
        const float = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -8,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        // Pulse animation
        const pulse = Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            })
        );

        if (isRecording) {
            float.stop();
            floatAnim.setValue(0);
            pulse.start();

            Animated.spring(scaleAnim, {
                toValue: 1.15,
                friction: 4,
                useNativeDriver: true,
            }).start();
        } else {
            pulse.stop();
            pulseAnim.setValue(0);
            float.start();

            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }).start();
        }

        return () => {
            float.stop();
            pulse.stop();
        };
    }, [isRecording]);

    return (
        <View style={styles.container}>
            {/* Pulse rings */}
            {isRecording && (
                <>
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                transform: [{
                                    scale: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 2.5]
                                    })
                                }],
                                opacity: pulseAnim.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [0, 0.4, 0]
                                }),
                                backgroundColor: currentTheme.colors.primary,
                            },
                        ]}
                    />
                </>
            )}

            {/* Main Button */}
            <Animated.View
                style={{
                    transform: [
                        { translateY: floatAnim },
                        { scale: scaleAnim }
                    ]
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onPress}
                >
                    <LinearGradient
                        colors={isRecording ? ['#ef4444', '#b91c1c'] : ['#8b5cf6', '#6d28d9']}
                        style={[
                            styles.button,
                            { borderRadius: 35 },
                            !isRecording && styles.shadow
                        ]}
                    >
                        <Ionicons
                            name={isRecording ? 'stop' : 'mic'}
                            size={32}
                            color="white"
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 110,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    button: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    shadow: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 12,
    },
    pulseRing: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
    },
});

