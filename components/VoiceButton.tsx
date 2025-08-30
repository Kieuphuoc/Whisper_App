import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

type VoiceButtonProps = {
    isRecording: boolean;
    onPress: () => void;
};

export default function VoiceButton({ isRecording, onPress }: VoiceButtonProps) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={24} color="white" />
        </TouchableOpacity>
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
