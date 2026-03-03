import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { VoicePin } from '@/types';

type Props = {
    pin: VoicePin;
    onPress: () => void;
};

export default function SpawnedVoicePin({ pin, onPress }: Props) {
    const scale = useSharedValue(0);
    const translateY = useSharedValue(30);
    const pulse = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12 });
        translateY.value = withSpring(0, { damping: 12 });
        pulse.value = withRepeat(
            withTiming(1.4, { duration: 1500 }),
            -1,
            true
        );
    }, []);

    const animatedMarker = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value }
        ],
    }));

    const animatedPulse = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: interpolate(pulse.value, [1, 1.4], [0.5, 0]),
    }));

    return (
        <Marker
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={onPress}
            anchor={{ x: 0.5, y: 1 }}
        >
            <View className="items-center">
                <Animated.View
                    className="absolute w-10 h-10 rounded-full bg-violet-400"
                    style={animatedPulse}
                />
                <Animated.View
                    className="w-9 h-9 rounded-full bg-violet-600 justify-center items-center border-[2.5px] border-white shadow-md shadow-violet-500"
                    style={animatedMarker}
                >
                    <Ionicons name="sparkles" size={18} color="white" />
                </Animated.View>
                <Animated.View
                    className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent border-t-violet-600 -mt-0.5"
                    style={animatedMarker}
                />
            </View>
        </Marker>
    );
}
