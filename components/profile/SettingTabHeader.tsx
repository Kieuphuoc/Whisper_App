import React from 'react';
import { View, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import theme from '@/constants/Theme';

interface SettingTabHeaderProps {
    title: string;
    onLeftPress?: () => void;
    rightElement?: React.ReactNode;
    leftIcon?: keyof typeof Ionicons.glyphMap;
}

export const SettingTabHeader = ({ 
    title, 
    onLeftPress, 
    rightElement, 
    leftIcon = 'close'
}: SettingTabHeaderProps) => {
    const router = useRouter();
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme as 'light' | 'dark'];
    const textColor = currentTheme.colors.text;

    return (
        <View 
            className="h-24 pt-12 flex-row items-center justify-between px-4" 
            style={{ 
                backgroundColor: currentTheme.colors.background,
            }}
        >
            <TouchableOpacity 
                onPress={onLeftPress || (() => router.back())} 
                className="w-11 h-11 items-center justify-center"
                activeOpacity={0.7}
            >
                <Ionicons name={leftIcon} size={28} color={textColor} />
            </TouchableOpacity>
            
            <Text style={{ 
                fontSize: 24, 
                fontWeight: '700', 
                color: textColor,
            }}>
                {title}
            </Text>
            
            <View className="w-11 items-center justify-center">
                {rightElement || <View className="w-11" />}
            </View>
        </View>
    );
};
