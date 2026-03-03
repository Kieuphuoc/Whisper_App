import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { VoicePin } from '@/types';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

type Props = {
    pin: VoicePin;
    onClose: () => void;
    onRandomAgain: () => void;
};

export default function VoicePinMiniCard({ pin, onClose, onRandomAgain }: Props) {
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const togglePlayback = async () => {
        if (!sound) {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: pin.audioUrl },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlaying(true);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } else {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const navigateToProfile = () => {
        if (!pin.isAnonymous && pin.userId) {
            onClose();
            router.push(`/user/${pin.userId}`);
        }
    };

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            className="absolute bottom-10 left-5 right-5 z-[60]"
        >
            <BlurView intensity={80} tint="light" className="rounded-3xl overflow-hidden border border-white/40 shadow-xl">
                <View className="p-5">
                    {/* Header */}
                    <View className="flex-row justify-between items-start mb-4">
                        <TouchableOpacity onPress={navigateToProfile} className="flex-1 mr-4">
                            <Text className="text-violet-600 font-bold text-xs mb-1">
                                {pin.isAnonymous ? "ẨN DANH" : (pin.user?.displayName || pin.user?.username || "NGƯỜI DÙNG")} • KHÁM PHÁ
                            </Text>
                            <Text className="text-gray-800 text-lg font-bold leading-6" numberOfLines={2}>
                                {pin.content || "Một ký ức thầm lặng..."}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} className="bg-gray-200/50 p-1 rounded-full">
                            <Ionicons name="close" size={20} color="#4b5563" />
                        </TouchableOpacity>
                    </View>

                    {/* Info */}
                    <View className="flex-row items-center gap-4 mb-5">
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons name="location" size={14} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs">Gần bạn</Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons name="time" size={14} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs">
                                {new Date(pin.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    </View>

                    {/* Controls */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={handleSkip}
                                className="px-4 py-2.5 rounded-2xl bg-gray-100 flex-row items-center gap-2"
                            >
                                <Text className="text-gray-600 font-semibold text-sm">Bỏ qua</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onRandomAgain}
                                className="px-4 py-2.5 rounded-2xl bg-violet-50 flex-row items-center gap-2"
                            >
                                <Ionicons name="refresh" size={16} color="#8b5cf6" />
                                <Text className="text-violet-600 font-semibold text-sm">Tìm tiếp</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={togglePlayback}
                            className="w-14 h-14 rounded-full bg-violet-600 justify-center items-center shadow-lg shadow-violet-300"
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={28}
                                color="white"
                                style={{ marginLeft: isPlaying ? 0 : 4 }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
}
