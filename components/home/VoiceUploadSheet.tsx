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
import { LinearGradient } from 'expo-linear-gradient';
import { MyUserContext } from '../../configs/Context';
import { DraftStorage } from '@/utils/draftStorage';
import { VinylRecord } from './voice-pin/VinylRecord';
import { useCelebration } from '@/components/ui/CelebrationOverlay';
import { AI_TRANSFORM_VOICES, DEFAULT_AI_TRANSFORM_VOICE_ID, type AiTransformOption } from '@/constants/aiTransform';
import { gradioService } from '@/services/gradioService';
import * as FileSystem from 'expo-file-system/legacy';

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
    initialAiTransform?: boolean;
    initialAiTransformVoiceId?: string;
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
    initialAiTransform = false,
    initialAiTransformVoiceId = DEFAULT_AI_TRANSFORM_VOICE_ID,
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
    const [transformedAudioUri, setTransformedAudioUri] = useState<string | null>(null);
    const [isTransforming, setIsTransforming] = useState(false);

    const player = useAudioPlayer((aiTransformEnabled && transformedAudioUri) ? transformedAudioUri : (audioUri || ""));
    const { playing, status } = useAudioPlayerStatus(player);

    const [transcription, setTranscription] = useState<string | null>(initialTranscription);
    const [emotionLabel, setEmotionLabel] = useState<string>(initialEmotionLabel);
    const [isThinking, setIsThinking] = useState(false);
    const [showTranscription, setShowTranscription] = useState(false);
    const [aiTransformEnabled, setAiTransformEnabled] = useState(!!initialAiTransform);
    const [aiTransformVoiceId, setAiTransformVoiceId] = useState(initialAiTransformVoiceId);
    const [showAiTransformModal, setShowAiTransformModal] = useState(false);

    useEffect(() => {
        if (visible) {
            setTranscription(initialTranscription);
            setEmotionLabel(initialEmotionLabel);
            setSelectedVisibility(visibility);
            setAiTransformEnabled(!!initialAiTransform);
            setAiTransformVoiceId(initialAiTransformVoiceId || DEFAULT_AI_TRANSFORM_VOICE_ID);
            setTransformedAudioUri(null);
            setIsTransforming(false);
            if (initialTranscription) {
                setShowTranscription(true);
            }
        }
    }, [visible, initialTranscription, initialEmotionLabel, visibility]);

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

    const handleTransformVoice = async (voiceId: string) => {
        if (!audioUri) return;
        
        try {
            setIsTransforming(true);
            const selectedVoice = AI_TRANSFORM_VOICES.find(v => v.id === voiceId);
            
            if (!selectedVoice) {
                throw new Error("Voice not found");
            }

            // Stop playback if playing
            if (player && playing) {
                player.pause();
            }

            const resultUri = await gradioService.transformVoice({
                audioUri,
                modelType: selectedVoice.modelType || "RVC v2",
                targetSpeaker: selectedVoice.targetSpeaker || 0,
                pitch: selectedVoice.pitch ?? 0,
            });

            // The Gradio result is a remote https URL on the HF Space. Download
            // it to a local cache file so the audio player and the upload
            // FormData can both consume it as a real file:// URI.
            let localUri = resultUri;
            if (resultUri.startsWith('http')) {
                const ext = resultUri.split('.').pop()?.split('?')[0] || 'wav';
                const dest = `${FileSystem.cacheDirectory}transformed_${Date.now()}.${ext}`;
                const dl = await FileSystem.downloadAsync(resultUri, dest);
                localUri = dl.uri;
            }
            setTransformedAudioUri(localUri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Auto-play the transformed voice
            setTimeout(() => {
                 if (player) {
                     player.seekTo(0);
                     player.play();
                 }
            }, 500);

        } catch (error: any) {
            console.error("Transform failed:", error);
            Alert.alert("Lỗi AI Transform", error.message || "Không thể biến đổi giọng nói lúc này.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsTransforming(false);
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
        if (isTransforming) {
            Alert.alert('AI Transform', 'Đang trong quá trình biến đổi giọng nói. Vui lòng đợi trong giây lát...');
            return;
        }

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
        if (aiTransformEnabled && !isRealTranscription) {
            Alert.alert(
                'AI Transform',
                'Cần có nội dung văn bản (transcript) để chuyển đổi giọng nói. Hãy bật xem nội dung và đợi AI phân tích xong nhé!',
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

            // Use transformed audio if AI Transform is enabled and available
            const finalAudioUri = (aiTransformEnabled && transformedAudioUri) ? transformedAudioUri : audioUri;
            const audioFileUri = finalAudioUri.startsWith('file://') ? finalAudioUri : `file://${finalAudioUri}`;

            // Derive extension + MIME from the actual file so multer's filter
            // (which checks mime type) doesn't reject transformed .wav files.
            const ext = (audioFileUri.split('.').pop() || 'm4a').toLowerCase().split('?')[0];
            const mimeMap: Record<string, string> = {
                m4a: 'audio/m4a',
                mp3: 'audio/mpeg',
                wav: 'audio/wav',
                ogg: 'audio/ogg',
                webm: 'audio/webm',
            };
            const audioMime = mimeMap[ext] || 'audio/m4a';
            const audioName = `voice_${Date.now()}.${ext in mimeMap ? ext : 'm4a'}`;

            formData.append('file', {
                uri: audioFileUri,
                name: audioName,
                type: audioMime,
            } as any);

            formData.append('latitude', String(location.coords.latitude));
            formData.append('longitude', String(location.coords.longitude));
            formData.append('visibility', selectedVisibility);
            formData.append('aiTransform', aiTransformEnabled ? 'true' : 'false');
            if (aiTransformEnabled) {
                formData.append('voiceId', aiTransformVoiceId);
            }
            const audioDurationSeconds = getAudioDurationSeconds();
            if (audioDurationSeconds !== null) {
                formData.append('audioDuration', String(audioDurationSeconds));
            }

            if (addressStr) {
                formData.append('address', addressStr);
            }

            // Gửi kết quả đã phân tích để server không cần re-analyze
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
            if (serverMessage && (serverMessage.includes('AI Transform') || serverMessage.includes('giọng AI') || serverMessage.includes('Azure'))) {
                Alert.alert('AI Transform', serverMessage);
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
            aiTransform: aiTransformEnabled,
            voiceId: aiTransformVoiceId,
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
                            aiTransformEnabled={aiTransformEnabled}
                            onAiTransformToggle={() => setAiTransformEnabled(!aiTransformEnabled)}
                            aiTransformVoiceId={aiTransformVoiceId}
                            onAiTransformVoiceChange={setAiTransformVoiceId}
                            onAiTransformPress={() => setShowAiTransformModal(true)}
                            onPost={handleUpload}
                            theme={currentTheme}
                            onTranscriptionToggle={handleToggleTranscription}
                            isThinking={isThinking || isTransforming}
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

                {/* AI Transform Selection Modal (Notification Style) */}
                <Modal
                    visible={showAiTransformModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowAiTransformModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowAiTransformModal(false)} />

                        <AnimatePresence>
                            {showAiTransformModal && (
                                <MotiView
                                    from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, translateY: 20 }}
                                    style={[styles.modalContent, { backgroundColor: isDark ? '#1e1e2e' : '#fff' }]}
                                >
                                    <View style={styles.modalHeader}>
                                        <View>
                                            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#111827' }]}>AI Transform</Text>
                                            <Text style={styles.modalSubtitle}>Chọn kiểu giọng AI bạn muốn chuyển đổi</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setShowAiTransformModal(false)} style={styles.modalCloseBtn}>
                                            <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.modalBody}>
                                        {AI_TRANSFORM_VOICES.map((v) => {
                                            const active = v.id === aiTransformVoiceId;
                                            return (
                                                <TouchableOpacity
                                                    key={v.id}
                                                    onPress={() => {
                                                        setAiTransformVoiceId(v.id);
                                                        setAiTransformEnabled(true);
                                                        Haptics.selectionAsync();
                                                    }}
                                                    activeOpacity={0.8}
                                                    style={[
                                                        styles.voiceItem,
                                                        {
                                                            borderColor: active ? currentTheme.colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                                                            backgroundColor: active 
                                                                ? (isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)') 
                                                                : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')
                                                        }
                                                    ]}
                                                >
                                                    <LinearGradient colors={v.colors as any} style={styles.voiceIconBox}>
                                                        <Ionicons name={v.icon as any} size={22} color="#fff" />
                                                    </LinearGradient>
                                                    <Text numberOfLines={1} style={[styles.voiceLabel, { color: active ? currentTheme.colors.primary : (isDark ? '#fff' : '#111827') }]}>
                                                        {v.label}
                                                    </Text>
                                                    
                                                    {active && (
                                                        <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} style={styles.checkIcon}>
                                                            <Ionicons name="checkmark-circle" size={16} color={currentTheme.colors.primary} />
                                                        </MotiView>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.modalConfirmBtn, 
                                            { backgroundColor: isTransforming ? '#9ca3af' : currentTheme.colors.primary }
                                        ]}
                                        disabled={isTransforming}
                                        onPress={() => {
                                            if (aiTransformEnabled && aiTransformVoiceId) {
                                                handleTransformVoice(aiTransformVoiceId);
                                            }
                                            setShowAiTransformModal(false);
                                        }}
                                    >
                                        {isTransforming ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.modalConfirmText}>
                                                {aiTransformEnabled ? 'Biến đổi & Hoàn tất' : 'Hoàn tất'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </MotiView>
                            )}
                        </AnimatePresence>
                    </View>
                </Modal>
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#9ca3af',
        fontWeight: '500',
        marginTop: 2,
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalBody: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 12,
        marginBottom: 24,
    },
    voiceItem: {
        width: (width * 0.9 - 48 - 24) / 3, // (ModalWidth - Padding - Gaps) / 3
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        position: 'relative',
    },
    voiceIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    voiceLabel: {
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
    },
    checkIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
    },
    modalConfirmBtn: {
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
