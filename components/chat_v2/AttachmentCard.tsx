import React from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AttachmentCardProps {
    type?: 'pdf' | 'doc';
    label?: string;
}

const AttachmentCard: React.FC<AttachmentCardProps> = ({ type = 'pdf', label = 'Chat Files' }) => {
    const isPdf = type === 'pdf';
    const scheme = useColorScheme() || 'light';
    const isDark = scheme === 'dark';

    return (
        <TouchableOpacity activeOpacity={0.82} style={styles.wrapper}>
            <LinearGradient
                colors={
                    isDark
                        ? ['rgba(255,255,255,0.12)', 'rgba(139,92,246,0.16)']
                        : ['rgba(255,255,255,0.92)', 'rgba(139,92,246,0.10)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.container,
                    {
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
                    },
                ]}
            >
                <View style={[styles.iconBox, { backgroundColor: isPdf ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)' }]}>
                    <Ionicons
                        name={isPdf ? "document-outline" : "document-text-outline"}
                        size={16}
                        color={isPdf ? "#ef4444" : "#3b82f6"}
                    />
                </View>
                <View>
                    <Text style={[styles.label, { color: isDark ? '#F3F4F6' : '#111827' }]}>{label}</Text>
                    <Text style={[styles.sub, { color: isDark ? 'rgba(255,255,255,0.62)' : '#6B7280' }]}>Chạm để mở</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 6,
        alignSelf: 'flex-end',
        minWidth: 150,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1.1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
    },
    sub: {
        marginTop: 1,
        fontSize: 10.5,
        fontWeight: '600',
    },
});

export default AttachmentCard;
