import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/Theme';
import { Visibility } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

type FilterToggleProps = {
    value: Visibility;
    onChange: (filter: Visibility) => void;
};

const OPTIONS: { value: Visibility; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'PRIVATE', label: 'Cá nhân', icon: 'lock-closed' },
    { value: 'FRIENDS', label: 'Bạn bè', icon: 'people' },
    { value: 'PUBLIC', label: 'Khám phá', icon: 'globe-outline' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_MARGIN = 16;
const CONTAINER_WIDTH = SCREEN_WIDTH - CONTAINER_MARGIN * 2;
const SEGMENT_WIDTH = (CONTAINER_WIDTH - 8) / 3; // 8 is padding * 2

const FilterToggle: React.FC<FilterToggleProps> = ({
    value,
    onChange,
}) => {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];

    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const index = OPTIONS.findIndex(opt => opt.value === value);
        Animated.spring(translateX, {
            toValue: index * SEGMENT_WIDTH,
            useNativeDriver: true,
            bounciness: 8,
            speed: 12,
        }).start();
    }, [value, translateX]);

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: currentTheme.colors.surfaceAlt,
                shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(0,0,0,0.1)',
            }
        ]}>
            {/* Animated Background Selector */}
            <Animated.View
                style={[
                    styles.selector,
                    {
                        width: SEGMENT_WIDTH,
                        backgroundColor: Colors.primary,
                        transform: [{ translateX }],
                    },
                ]}
            />

            {OPTIONS.map((opt) => {
                const isActive = value === opt.value;

                return (
                    <TouchableOpacity
                        key={opt.value}
                        activeOpacity={0.7}
                        style={styles.button}
                        onPress={() => onChange(opt.value)}
                    >
                        <View style={styles.content}>
                            <Ionicons
                                name={opt.icon}
                                size={14}
                                color={isActive ? Colors.white : currentTheme.colors.textMuted}
                            />
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.text,
                                    { color: currentTheme.colors.textMuted },
                                    isActive && { color: Colors.white, fontWeight: '700' }
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default FilterToggle;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: CONTAINER_MARGIN,
        right: CONTAINER_MARGIN,
        flexDirection: 'row',
        borderRadius: 24,
        padding: 4,
        height: 48,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6,
        zIndex: 100,
    },
    selector: {
        position: 'absolute',
        height: 40,
        left: 4,
        borderRadius: 20,
        zIndex: 0,
    },
    button: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
});