// components/CustomHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
    title: string;
    subtitle?: string;
    showSettings?: boolean;
};

export default function CustomHeader({ title, subtitle, showSettings }: Props) {
    const router = useRouter();

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="#8b5cf6" />
            </TouchableOpacity>

            <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{title}</Text>
                {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 92, 246, 0.1)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    headerInfo: {
        position: 'absolute',
        left: 140,
        top: 60,
        marginHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
});
