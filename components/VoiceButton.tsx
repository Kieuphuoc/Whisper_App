// components/VoiceButton/index.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

type VoiceButtonProps = {
    isRecording: boolean;
    onPress: () => void;
};

export default function VoiceButton({ isRecording, onPress }: VoiceButtonProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRecording) {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Rotate animation
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            pulseAnim.setValue(1);
            rotateAnim.setValue(0);
        }
    }, [isRecording]);

    const handlePress = () => {
        // Scale animation on press
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        onPress();
    };

    return (
        <Animated.View style={[
            styles.container,
            {
                transform: [
                    { scale: pulseAnim },
                    { scale: scaleAnim },
                ],
            },
        ]}>
            <TouchableOpacity 
                style={[styles.button, isRecording && styles.recordingButton]} 
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <Animated.View style={{
                    transform: [{
                        rotate: rotateAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                        }),
                    }],
                }}>
                    <Ionicons 
                        name={isRecording ? 'stop' : 'mic'} 
                        size={28} 
                        color="white" 
                    />
                </Animated.View>
            </TouchableOpacity>
            
            {isRecording && (
                <Animated.View style={[
                    styles.pulseRing,
                    {
                        transform: [{ scale: pulseAnim }],
                    },
                ]} />
            )}
            
            <Animated.View style={[
                styles.glowRing,
                {
                    transform: [{ scale: pulseAnim }],
                    opacity: isRecording ? 0.6 : 0.3,
                },
            ]} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    recordingButton: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
    },
    pulseRing: {
        position: 'absolute',
        top: -8,
        left: -8,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    glowRing: {
        position: 'absolute',
        top: -16,
        left: -16,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
});
