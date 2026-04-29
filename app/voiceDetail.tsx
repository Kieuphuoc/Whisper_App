import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authApis, endpoints } from '@/configs/Apis';
import { VoicePin } from '@/types';
import VoicePinTurntable from '@/components/home/VoicePinCard';
import { theme } from '@/constants/Theme';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function VoiceDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];

    const [pin, setPin] = useState<VoicePin | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVoiceDetail = async () => {
            if (!id) return;
            try {
                const res = await authApis().get(endpoints.voiceDetail(id as string));
                setPin(res.data?.data || res.data);
            } catch (error) {
                console.error("Fetch voice detail error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVoiceDetail();
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: currentTheme.colors.background }]}>
                <ActivityIndicator size="large" color={currentTheme.colors.primary} />
            </View>
        );
    }

    if (!pin) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: currentTheme.colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.colors.text} />
                </TouchableOpacity>
                <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* We use the VoicePinTurntable component directly as the screen content */}
            <VoicePinTurntable
                pin={pin}
                onClose={() => router.back()}
                autoPlay={true}
            />
            
            {/* Floating Back Button for redundancy */}
            <TouchableOpacity 
                onPress={() => router.back()} 
                style={styles.floatingBack}
            >
                <BlurView intensity={20} tint="dark" style={styles.backBlur}>
                    <Ionicons name="close" size={24} color="#fff" />
                </BlurView>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
    },
    floatingBack: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 11000, // Above Turntable
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    backBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
