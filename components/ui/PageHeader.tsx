import React from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from './text';
import { theme } from '@/constants/Theme';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    backIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightPress?: () => void;
    rightElement?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    showBack = true,
    onBack,
    backIcon = 'arrow-back',
    rightIcon,
    onRightPress,
    rightElement,
}) => {
    const router = useRouter();
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/home');
            }
        }
    };

    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                {showBack && (
                    <TouchableOpacity
                        onPress={handleBack}
                        style={[
                            styles.headerIconBtn,
                            { 
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                            }
                        ]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={backIcon} size={20} color={currentTheme.colors.primary} />
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </View>

            {rightElement ? (
                rightElement
            ) : rightIcon ? (
                <TouchableOpacity
                    onPress={onRightPress}
                    style={[
                        styles.headerIconBtn,
                        { 
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                        }
                    ]}
                    activeOpacity={0.8}
                >
                    <Ionicons name={rightIcon} size={20} color={currentTheme.colors.primary} />
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60, // Standard padding for screens with status bar
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    title: { 
        fontSize: 32, 
        fontWeight: '900', 
        letterSpacing: -1.5,
        lineHeight: 38,
    },
    subtitle: { 
        fontSize: 13, 
        color: '#9ca3af', 
        fontWeight: '500', 
        marginTop: -2 
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
});
