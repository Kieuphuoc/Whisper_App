import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { reverseGeocode } from '@/utils/geocoding';
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
import { DraftStorage } from '@/utils/draftStorage';
import { VinylRecord } from './voice-pin/VinylRecord';
import { useCelebration } from '@/components/ui/CelebrationOverlay';
import { DEFAULT_GHOST_TTS_VOICE_ID } from '@/constants/ghostTtsVoices';
import { DEFAULT_GHOST_ENGINE_ID, type GhostEngineId } from '@/constants/ghostEngines';

const { width } = Dimensions.get('window');

type Props = {
    visible: boolean;
    audioUri: string | null;
    photoUri: string | null;
    location: Location.LocationObject | null;
    visibility: Visibility;
    onClose: () => void;
    onUploadSuccess: () => void;
    initialTranscription?: string | null;
    initialEmotionLabel?: string;
    /** Ghost Voice: chuyển lời nói sang giọng AI (TTS) khi đăng */
    initialGhostVoice?: boolean;
    initialGhostTtsVoiceId?: string;
    initialGhostEngine?: GhostEngineId;
};

export default function VoiceUploadSheet({
    visible,
    audioUri,
    photoUri,
    location,
    visibility,
    onClose,
    onUploadSuccess,
    initialTranscription = null,
    initialEmotionLabel = "Bình yên",
    initialGhostVoice = false,
    initialGhostTtsVoiceId = DEFAULT_GHOST_TTS_VOICE_ID,
    initialGhostEngine = DEFAULT_GHOST_ENGINE_ID,
}: Props) {
    const user = useContext(MyUserContext);
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const isDark = colorScheme === 'dark';
    const { celebrate } = useCelebration();

    const [selectedVisibility, setSelectedVisibility] = useState<Visibility>(visibility);
    const [uploading, setUploading] = useState(false);

    // Tonearm animation
    const armRotateAnim = useRef(new Animated.Value(0)).current;

    // Audio Player using new expo-audio API
    const player = useAudioPlayer(audioUri || "");
    const { playing, status } = useAudioPlayerStatus(player);

    const [transcription, setTranscription] = useState<string | null>(initialTranscription);
    const [emotionLabel, setEmotionLabel] = useState<string>(initialEmotionLabel);
    const [isThinking, setIsThinking] = useState(false);
    const [showTranscription, setShowTranscription] = useState(false);
    const [ghostVoice, setGhostVoice] = useState(!!initialGhostVoice);
    const [ghostTtsVoiceId, setGhostTtsVoiceId] = useState(initialGhostTtsVoiceId);
    const [ghostEngine, setGhostEngine] = useState<GhostEngineId>(initialGhostEngine);

    useEffect(() => {
        if (visible) {
            setTranscription(initialTranscription);
            setEmotionLabel(initialEmotionLabel);
            setSelectedVisibility(visibility);
            setGhostVoice(!!initialGhostVoice);
            setGhostTtsVoiceId(initialGhostTtsVoiceId || DEFAULT_GHOST_TTS_VOICE_ID);
            setGhostEngine(initialGhostEngine || DEFAULT_GHOST_ENGINE_ID);
            if (initialTranscription) {
                setShowTranscription(true);
            }
        }
    }, [visible, initialTranscription, initialEmotionLabel, visibility, initialGhostVoice, initialGhostTtsVoiceId, initialGhostEngine]);

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
                const { transcript, emotion_label, analysis_source } = res.data.data;
                console.log('[VoiceUpload] Transcript result:', {
                    source: analysis_source ?? 'unknown',
                    transcript,
                    emotionLabel: emotion_label ?? null,
                });
                // Cập nhật văn bản (nếu rỗng thì báo không tìm thấy)
                setTranscription(transcript && transcript.trim().length > 0 ? transcript : "Không tìm thấy nội dung lời nói...");

                // Ưu tiên nhãn cảm xúc từ AI nếu có, nếu không thì giữ nguyên mặc định
                if (emotion_label) {
                    setEmotionLabel(emotion_label);
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

    const getAudioDurationSeconds = () => {
        const duration = Number((status as any)?.duration ?? (player as any)?.duration ?? 0);
        return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
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

        const isRealTranscription = transcription &&
            !transcription.startsWith('Rất tiếc') &&
            !transcription.startsWith('Không tìm thấy');
        if (ghostVoice && ghostEngine === 'tts' && !isRealTranscription) {
            Alert.alert(
                'Ghost Voice (TTS)',
                'Cần có transcript để đọc TTS. Hãy bật xem nội dung / đợi phân tích, hoặc chuyển sang chế độ Đổi timbre (RVC) nếu server RVC đã sẵn sàng.',
            );
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
                const geocoded = await reverseGeocode(
                    location.coords.latitude,
                    location.coords.longitude,
                );
                if (geocoded) addressStr = geocoded.detailedAddress;
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
            formData.append('ghostVoice', ghostVoice ? 'true' : 'false');
            if (ghostVoice) {
                formData.append('ghostEngine', ghostEngine);
                formData.append('ttsVoice', ghostTtsVoiceId);
            }
            const audioDurationSeconds = getAudioDurationSeconds();
            if (audioDurationSeconds !== null) {
                formData.append('audioDuration', String(audioDurationSeconds));
            }

            if (addressStr) {
                formData.append('address', addressStr);
            }

            // Gửi kết quả đã phân tích để server không cần re-analyze (Ghost Voice TTS dùng transcript này)
            if (isRealTranscription) {
                formData.append('transcription', transcription!);
            }
            formData.append('emotionLabel', emotionLabel);

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
                    visibility: selectedVisibility,
                    ghostVoice,
                    ghostEngine,
                    ttsVoice: ghostTtsVoiceId,
                    audioDuration: audioDurationSeconds,
                });
            }

            const api = authApis(token);
            const res = await api.post(endpoints.createVoicePin, formData);

            setUploading(false);
            onUploadSuccess();

            // Celebrate success!
            if (res.data?.data?.isFirstPost) {
                celebrate({
                    title: 'Ký ức đã tỏa sáng!',
                    subtitle: 'Giọng nói của bạn đã chính thức lên bản đồ Whispery.',
                    achievementKey: 'first_voice',
                    type: 'achievement'
                });
            } else {
                celebrate({
                    title: 'Kỷ niệm đã được gửi gắm!',
                    subtitle: 'Giọng nói của bạn đã hòa mình vào bản đồ Whispery.',
                    type: 'success'
                });
            }
        } catch (err: any) {
            console.error('Upload failed:', err.response?.data || err.message);

            const serverMessage = err.response?.data?.message as string | undefined;
            if (serverMessage && (serverMessage.includes('Ghost Voice') || serverMessage.includes('giọng AI') || serverMessage.includes('Azure') || serverMessage.includes('RVC') || serverMessage.includes('So-VITS') || serverMessage.includes('timbre') || serverMessage.includes('VOICE_CONVERSION'))) {
                Alert.alert('Ghost Voice', serverMessage);
            } else if (serverMessage && serverMessage.includes('too quiet')) {
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

    const mockPin = useMemo(
        () => ({
            images: photoUri ? [{ imageUrl: photoUri }] : [],
            user,
            emotionLabel: emotionLabel,
            listensCount: 0,
            transcription: transcription,
        }),
        [photoUri, user, emotionLabel, transcription],
    );

    const handleSaveDraft = async () => {
        if (!audioUri) return;
        
        await DraftStorage.saveDraft({
            audioUri,
            photoUri,
            location,
            visibility: selectedVisibility,
            ghostVoice,
            ghostEngine,
            ttsVoice: ghostTtsVoiceId,
            transcription,
            emotionLabel,
        });
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
    };

    const handleClose = () => {
        if (player && playing) {
            player.pause();
        }

        Alert.alert(
            "Rời khỏi",
            "Bạn có muốn lưu lại bản nháp này để đăng sau không?",
            [
                {
                    text: "Hủy bỏ",
                    onPress: () => onClose(),
                    style: "destructive"
                },
                {
                    text: "Lưu nháp",
                    onPress: handleSaveDraft,
                },
                {
                    text: "Tiếp tục",
                    style: "cancel"
                }
            ]
        );
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
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        >
                            <Ionicons name="close-circle-outline" size={16} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
                            <Text style={[styles.cancelText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)" }]}>Đóng</Text>
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
                            ghostVoice={ghostVoice}
                            onGhostVoiceChange={setGhostVoice}
                            ghostTtsVoiceId={ghostTtsVoiceId}
                            onGhostTtsVoiceChange={setGhostTtsVoiceId}
                            ghostEngine={ghostEngine}
                            onGhostEngineChange={setGhostEngine}
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
                                        {transcription}
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
        lineHeight: 20,
    },
});
