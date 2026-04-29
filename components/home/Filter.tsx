import { theme } from '@/constants/Theme';
import { Visibility } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { BlurView } from 'expo-blur';

type FilterToggleProps = {
    value: Visibility;
    onChange: (filter: Visibility) => void;
};

const OPTIONS: { value: Visibility; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'PRIVATE', label: 'Cá nhân', icon: 'lock-closed' },
    { value: 'FRIENDS', label: 'Bạn bè', icon: 'people' },
    { value: 'PUBLIC', label: 'Công khai', icon: 'globe-outline' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_MARGIN = 20;
const CONTAINER_WIDTH = SCREEN_WIDTH - CONTAINER_MARGIN * 2;
const SEGMENT_WIDTH = (CONTAINER_WIDTH - 8) / 3;

const FilterToggle: React.FC<FilterToggleProps> = ({
    value,
    onChange,
}) => {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const isDark = colorScheme === 'dark';

    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const index = OPTIONS.findIndex(opt => opt.value === value);
        Animated.spring(translateX, {
            toValue: index * SEGMENT_WIDTH,
            useNativeDriver: true,
            bounciness: 4,
            speed: 10,
        }).start();
    }, [value, translateX]);

    return (
        <View style={styles.outerContainer}>
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: isDark ? 'rgba(18,18,18,0.9)' : 'rgba(255,255,255,0.95)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                    }
                ]}
            >
                <BlurView
                    intensity={isDark ? 20 : 40}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
                
                {/* Animated Background Selector */}
                <Animated.View
                    style={[
                        styles.selector,
                        {
                            width: SEGMENT_WIDTH,
                            backgroundColor: '#8b5cf6',
                            transform: [{ translateX }],
                        },
                    ]}
                />

                {OPTIONS.map((opt) => {
                    const isActive = value === opt.value;

                    return (
                        <TouchableOpacity
                            key={opt.value}
                            activeOpacity={0.8}
                            style={styles.button}
                            onPress={() => onChange(opt.value)}
                        >
                            <View style={styles.content}>
                                <Ionicons
                                    name={opt.icon}
                                    size={16}
                                    color={isActive ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)')}
                                    style={{ marginRight: 6 }}
                                />
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.text,
                                        { color: isActive ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') }
                                    ]}
                                >
                                    {opt.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default FilterToggle;

const styles = StyleSheet.create({
    outerContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 100,
        alignItems: 'center',
    },
    container: {
        flexDirection: 'row',
        borderRadius: 24,
        padding: 4,
        height: 48,
        width: CONTAINER_WIDTH,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
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
        justifyContent: 'center',
        width: '100%',
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
});

