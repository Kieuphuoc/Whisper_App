import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    interpolate,
    Easing
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function RadarOverlay({ isScanning }: { isScanning: boolean }) {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
        if (isScanning) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 2000, easing: Easing.linear }),
                -1,
                false
            );
            scale.value = withRepeat(
                withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }),
                -1,
                false
            );
        } else {
            rotation.value = 0;
            scale.value = 0;
        }
    }, [isScanning]);

    const sweepStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const circleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value * 2 }],
        opacity: interpolate(scale.value, [0, 0.8, 1], [0, 0.4, 0]),
    }));

    const circleStyleInner = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value * 1.5 }],
        opacity: interpolate(scale.value, [0, 0.8, 1], [0, 0.4, 0]),
    }));

    if (!isScanning) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="z-10">
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />

            {/* Expanding Circles */}
            <View className="flex-1 justify-center items-center">
                <Animated.View
                    className="w-80 h-80 rounded-full border-2 border-violet-400 opacity-20"
                    style={circleStyle}
                />
                <Animated.View
                    className="w-80 h-80 rounded-full border-2 border-violet-300 opacity-10"
                    style={circleStyleInner}
                />

                {/* Radar Sweep */}
                <Animated.View
                    style={[sweepStyle, { width: width * 1.5, height: width * 1.5 }]}
                    className="absolute justify-center items-center"
                >
                    <View
                        className="w-1/2 h-full bg-violet-400/20"
                        style={{
                            borderTopRightRadius: width,
                            borderBottomRightRadius: width,
                            transform: [{ translateX: width * 0.375 }], // Center on sweep origin
                            opacity: 0.3
                        }}
                    />
                </Animated.View>
            </View>
        </View>
    );
}
