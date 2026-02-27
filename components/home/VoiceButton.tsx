import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';

type VoiceButtonProps = {
    isRecording: boolean;
    onPress: () => void;
};

export default function VoiceButton({ isRecording, onPress }: VoiceButtonProps) {
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // 1. Animation nhấp nhô (Floating) khi ở trạng thái chờ
        const float = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -15, // Bay lên 15px
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        // 2. Animation tỏa vòng tròn (Pulse) khi đang ghi âm
        const pulse = Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            })
        );

        if (isRecording) {
            float.stop(); // Ngừng nhấp nhô khi đang ghi
            floatAnim.setValue(0);
            pulse.start();

            // Hiệu ứng "giật mình" nhẹ khi bắt đầu nhấn
            Animated.spring(scaleAnim, {
                toValue: 1.1,
                friction: 3,
                useNativeDriver: true,
            }).start();
        } else {
            pulse.stop();
            pulseAnim.setValue(0);
            float.start();

            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
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
            {/* Vòng tròn tỏa ra phía sau (Chỉ hiện khi ghi âm) */}
            {isRecording && (
                <Animated.View
                    style={[
                        styles.pulseRing,
                        {
                            transform: [{
                                scale: pulseAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 2.2]
                                })
                            }],
                            opacity: pulseAnim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.4, 0]
                            }),
                        },
                    ]}
                />
            )}

            {/* Nút chính */}
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
                    style={[styles.button, isRecording && styles.recordingButton]}
                    onPress={onPress}
                >
                    <Ionicons
                        name={isRecording ? 'stop' : 'mic'}
                        size={30}
                        color="white"
                    />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // Nổi tuyệt đối ở chính giữa bên dưới
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    button: {
        width: 75,
        height: 75,
        borderRadius: 40,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        // Đổ bóng cho iOS
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        // Đổ bóng cho Android
        elevation: 12,
        borderWidth: 4,
        borderColor: '#ffffff',
    },
    recordingButton: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
    },
    pulseRing: {
        position: 'absolute',
        width: 75,
        height: 75,
        borderRadius: 40,
        backgroundColor: '#ef4444',
    },
});