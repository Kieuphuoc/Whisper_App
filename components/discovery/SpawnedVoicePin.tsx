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
import { BASE_URL } from '@/configs/Apis';
import { Image } from 'react-native';

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

    const avatarUri = (() => {
        const userAvatar = pin.user?.avatar;
        if (!userAvatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
        if (userAvatar.startsWith('http')) return userAvatar;
        return `${BASE_URL}${userAvatar.startsWith('/') ? '' : '/'}${userAvatar}`;
    })();

    return (
        <Marker
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={onPress}
            anchor={{ x: 0.5, y: 1 }}
        >
            <View style={{ alignItems: 'center' }}>
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: '#a78bfa',
                        },
                        animatedPulse
                    ]}
                />
                <Animated.View
                    style={[
                        {
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: '#fff',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: '#8b5cf6',
                            shadowColor: '#8b5cf6',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 8,
                            elevation: 10,
                        },
                        animatedMarker
                    ]}
                >
                    <Image 
                        source={{ uri: avatarUri }} 
                        style={{ width: '100%', height: '100%', borderRadius: 12 }} 
                    />
                    <View style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: '#8b5cf6',
                        borderWidth: 2,
                        borderColor: '#fff',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <Ionicons name="sparkles" size={10} color="white" />
                    </View>
                </Animated.View>
                <Animated.View
                    style={[
                        {
                            width: 0,
                            height: 0,
                            borderLeftWidth: 6,
                            borderRightWidth: 6,
                            borderTopWidth: 10,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderTopColor: '#8b5cf6',
                            marginTop: -1,
                        },
                        animatedMarker
                    ]}
                />
            </View>
        </Marker>
    );
}
