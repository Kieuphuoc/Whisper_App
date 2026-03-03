import React, { useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSpring,
    interpolate
} from 'react-native-reanimated';

type Props = {
    onPress: () => void;
    isScanning: boolean;
};

export default function ScanButton({ onPress, isScanning }: Props) {
    const pulse = useSharedValue(1);
    const pressed = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1.1, { duration: 1500 }),
            -1,
            true
        );
    }, []);

    const animatedPulse = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: interpolate(pulse.value, [1, 1.1], [0.6, 0.2]),
    }));

    const animatedButton = useAnimatedStyle(() => ({
        transform: [{ scale: pressed.value }],
    }));

    const handlePressIn = () => {
        pressed.value = withSpring(0.9);
    };

    const handlePressOut = () => {
        pressed.value = withSpring(1);
    };

    return (
        <View className="absolute top-[125px] left-5 z-50">
            <Animated.View
                className="absolute w-12 h-12 rounded-full bg-violet-400"
                style={animatedPulse}
            />
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isScanning}
                activeOpacity={1}
            >
                <Animated.View
                    className="w-12 h-12 rounded-full bg-white justify-center items-center shadow-lg"
                    style={[{
                        elevation: 5,
                        shadowColor: '#8b5cf6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8
                    }, animatedButton]}
                >
                    <Ionicons
                        name={isScanning ? "radio-outline" : "scan-outline"}
                        size={24}
                        color="#8b5cf6"
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}
