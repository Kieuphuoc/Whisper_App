import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
    Dimensions,
    Animated,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { authApis, endpoints } from '../../configs/Apis';
import { Visibility } from '../../types';
import { theme } from '@/constants/Theme';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from "expo-haptics";
import { MyUserContext } from '../../configs/Context';
import { VinylRecord } from './voice-pin/VinylRecord';

const { width } = Dimensions.get('window');

type Props = {
    visible: boolean;
    audioUri: string | null;
    photoUri: string | null;
    location: Location.LocationObject | null;
    visibility: Visibility;
    onClose: () => void;
    onUploadSuccess: () => void;
};

export default function VoiceUploadSheet({
    visible,
    audioUri,
    photoUri,
    location,
    visibility,
    onClose,
    onUploadSuccess,
}: Props) {
    const user = useContext(MyUserContext);
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const isDark = colorScheme === 'dark';
    
    const [selectedVisibility, setSelectedVisibility] = useState<Visibility>(visibility);
    const [uploading, setUploading] = useState(false);
    
    // Tonearm animation
    const armRotateAnim = useRef(new Animated.Value(0)).current;
    
    // Audio Player using new expo-audio API
    const player = useAudioPlayer(audioUri || "");
    const { playing, status } = useAudioPlayerStatus(player);
    
    const [transcription, setTranscription] = useState<string | null>(null);
    const [emotionLabel, setEmotionLabel] = useState<string>("NEW RECORD");
    const [isThinking, setIsThinking] = useState(false);
    const [showTranscription, setShowTranscription] = useState(false);
    
    const armRotate = armRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-10deg', '5deg']
    });

    useEffect(() => {
        if (playing) {
            animateArm(1);
        } else {
            animateArm(0);
        }
    }, [playing]);

    const togglePlayback = () => {
        if (!player) return;

        if (playing) {
            player.pause();
        } else {
            // If finished or near end, seek to start
            if (player.currentTime >= player.duration - 0.1) {
                player.seekTo(0);
            }
            player.play();
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleToggleTranscription = async () => {
        if (showTranscription) {
            setShowTranscription(false);
            return;
        }

        if (transcription) {
            setShowTranscription(true);
            return;
        }

        if (!audioUri) return;

        try {
            setIsThinking(true);
            const token = await AsyncStorage.getItem('token');
            const api = authApis(token || undefined);

            const formData = new FormData();
            const audioFileUri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;
            
            formData.append('file', {
                uri: audioFileUri,
                name: 'audio.m4a',
                type: 'audio/m4a',
            } as any);

            const res = await api.post(endpoints.voiceAnalyze, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.data) {
                const { transcript, emotion_label } = res.data.data;
                if (!transcript || transcript.trim().length === 0) {
                    setTranscription("Không tìm thấy nội dung trong đoạn ghi âm này...");
                    setEmotionLabel("SILENT");
                } else {
                    setTranscription(transcript);
                    if (emotion_label) setEmotionLabel(emotion_label);
                }
                setShowTranscription(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (err) {
            console.error('Transcription failed:', err);
            setTranscription("Rất tiếc, AI không thể xử lý âm thanh này lúc này. Hãy thử lại nhé!");
            setShowTranscription(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsThinking(false);
        }
    };

    const animateArm = (toValue: number) => {
        Animated.timing(armRotateAnim, {
            toValue,
            useNativeDriver: true,
            duration: 400,
        }).start();
    };

    const handleToggleVisibility = (v: Visibility) => {
        setSelectedVisibility(v);
    };

    const handleUpload = async () => {
        // Stop playback before upload
        if (player && playing) {
            player.pause();
        }

        if (!audioUri || !location) {
            Alert.alert('Lỗi', 'Thiếu file âm thanh hoặc vị trí.');
            return;
        }

        try {
            setUploading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Lỗi', 'Bạn chưa đăng nhập.');
                return;
            }

            let addressStr = '';
            try {
                const [place] = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
                if (place) {
                    const parts = [place.street, place.district, place.city, place.country].filter(Boolean);
                    addressStr = parts.join(', ');
                }
            } catch {
                // optional
            }

            const formData = new FormData();
            
            // Ensure URI starts with file:// for proper FormData handling in React Native
            const audioFileUri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;
            
            formData.append('file', {
                uri: audioFileUri,
                name: `voice_${Date.now()}.m4a`,
                type: 'audio/m4a',
            } as any);

            formData.append('latitude', String(location.coords.latitude));
            formData.append('longitude', String(location.coords.longitude));
            formData.append('visibility', selectedVisibility);

            if (addressStr) {
                formData.append('address', addressStr);
            }

            if (photoUri) {
                const imageFileUri = photoUri.startsWith('file://') ? photoUri : `file://${photoUri}`;
                formData.append('images', {
                    uri: imageFileUri,
                    name: `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                } as any);
            }

            if (__DEV__) {
                console.log('[VoiceUpload] Payload:', {
                    audio: audioFileUri,
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    visibility: selectedVisibility
                });
            }

            const api = authApis(token);
            await api.post(endpoints.createVoicePin, formData);

            onUploadSuccess();
            Alert.alert('Đã đăng!', 'Giọng nói của bạn đã lên bản đồ.');
        } catch (err: any) {
            console.error('Upload failed:', err.response?.data || err.message);
            
            const serverMessage = err.response?.data?.message;
            if (serverMessage && serverMessage.includes('too quiet')) {
                Alert.alert('Âm thanh quá nhỏ', 'Mình chưa nghe rõ. Bạn thử nói to hơn hoặc kiểm tra micro nhé!');
            } else if (serverMessage && serverMessage.includes('moderationReason')) {
                Alert.alert('Lỗi Database', 'Có lỗi xảy ra khi lưu dữ liệu. Hãy báo cho admin hoặc thử lại sau.');
            } else {
                Alert.alert('Đăng thất bại', 'Không thể tải lên giọng nói lúc này. Vui lòng thử lại sau.');
            }
        } finally {
            setUploading(false);
        }
    };

    const mockPin = {
        images: photoUri ? [{ imageUrl: photoUri }] : [],
        user: user,
        emotionLabel: emotionLabel,
        listensCount: 0,
        transcription: transcription,
    };

    const handleClose = () => {
        if (player && playing) {
            player.pause();
        }
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <Animated.View style={[styles.overlay, { backgroundColor: isDark ? "rgba(15, 23, 42, 0.55)" : "rgba(255, 255, 255, 0.4)" }]}>
                <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <TouchableOpacity
                    activeOpacity={1}
                    style={StyleSheet.absoluteFill}
                    onPress={handleClose}
                />
                
                <View style={styles.container}>
                    {/* Minimalist Cancel Button */}
                    <TouchableOpacity onPress={handleClose} style={styles.cancelBtn} disabled={uploading}>
                        <MotiView
                            from={{ opacity: 0, translateY: -10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: 200 }}
                        >
                            <Text style={[styles.cancelText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)" }]}>Hủy bản thảo</Text>
                        </MotiView>
                    </TouchableOpacity>

                    {/* The Vinyl Record */}
                    <MotiView
                        from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                        style={styles.cardContainer}
                    >
                        <VinylRecord
                            pin={mockPin}
                            playing={playing} 
                            spin={null} 
                            armRotate={armRotate} 
                            onPress={togglePlayback} 
                            verticalDateLabel={new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join(' . ')}
                            isCreationMode={true}
                            visibility={selectedVisibility}
                            onVisibilityChange={handleToggleVisibility} 
                            onPost={handleUpload}
                            theme={currentTheme}
                            onTranscriptionToggle={handleToggleTranscription}
                            isThinking={isThinking}
                            showTranscription={showTranscription}
                        />

                        {/* Transcription Content Display (Matched with VoicePinCard) */}
                        <AnimatePresence>
                            {showTranscription && transcription && (
                                <MotiView
                                    from={{ opacity: 0, translateY: 10 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    exit={{ opacity: 0, translateY: 5 }}
                                    style={[styles.transcriptionBox, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderColor: currentTheme.colors.primary + '44' }]}
                                >
                                    <Text style={[styles.transcriptionText, { color: currentTheme.colors.primary }]}>
                                        "{transcription}"
                                    </Text>
                                </MotiView>
                            )}
                        </AnimatePresence>
                    </MotiView>

                    {/* Progress Indicator when uploading */}
                    <AnimatePresence>
                        {uploading && (
                            <MotiView
                                from={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                style={styles.uploadingOverlay}
                            >
                                <BlurView intensity={20} tint="dark" style={styles.uploadingBlur}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.uploadingText}>Đang tải lên...</Text>
                                </BlurView>
                            </MotiView>
                        )}
                    </AnimatePresence>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    container: {
        width: width * 0.9,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    cancelBtn: {
        marginBottom: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    cancelText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    uploadingOverlay: {
        position: 'absolute',
        zIndex: 100,
    },
    uploadingBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    uploadingText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    transcriptionBox: {
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        width: width * 0.85,
    },
    transcriptionText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 22,
    },
});
