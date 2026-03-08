import React, { useEffect } from 'react';
import { TouchableOpacity, View, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSpring,
    interpolate
} from 'react-native-reanimated';
import { theme } from '@/constants/Theme';

type Props = {
    onPress: () => void;
    isScanning: boolean;
};

export default function ScanButton({ onPress, isScanning }: Props) {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
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
        <View style={styles.scanWrapper}>
            <Animated.View
                style={[
                    styles.pulse,
                    {
                        backgroundColor: currentTheme.colors.secondary + '66',
                        borderRadius: currentTheme.radius.full
                    },
                    animatedPulse
                ]}
            />
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isScanning}
                activeOpacity={1}
            >
                <Animated.View
                    style={[
                        styles.button,
                        {
                            backgroundColor: currentTheme.colors.background,
                            borderRadius: currentTheme.radius.full,
                            shadowColor: currentTheme.colors.primary
                        },
                        animatedButton
                    ]}
                >
                    <Ionicons
                        name={isScanning ? "radio-outline" : "scan-outline"}
                        size={24}
                        color={currentTheme.colors.primary}
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    scanWrapper: {
        position: 'absolute',
        top: 125,
        left: 20,
        zIndex: 50,
    },
    pulse: {
        position: 'absolute',
        width: 48,
        height: 48,
    },
    button: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.light.shadows.md,
    }
});
