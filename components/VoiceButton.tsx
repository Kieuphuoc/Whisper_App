// components/VoiceButton/index.tsx
import { Ionicons } from '@expo/vector-icons';

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
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
    button: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF4E4E',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateX: -30 }, { translateY: -30 }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
});
