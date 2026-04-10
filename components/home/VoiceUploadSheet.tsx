import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
    Dimensions,
    Animated,
} from 'react-native';
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
    const { playing } = useAudioPlayerStatus(player);
    
    const armRotate = armRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '25deg']
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
            player.play();
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const animateArm = (toValue: number) => {
        Animated.spring(armRotateAnim, {
            toValue,
            useNativeDriver: true,
            tension: 20,
            friction: 5,
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
            Alert.alert('Đăng thất bại', 'Không thể tải lên giọng nói. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    const mockPin = {
        images: photoUri ? [{ imageUrl: photoUri }] : [],
        user: user,
        emotionLabel: "NEW RECORD",
        listensCount: 0,
    };

    const handleClose = () => {
        if (player && playing) {
            player.pause();
        }
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
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
                        from={{ scale: 0.9, opacity: 0, translateY: 40 }}
                        animate={{ scale: 1, opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    >
                        <VinylRecord
                            pin={mockPin}
                            playing={playing} 
                            spin={null} 
                            armRotate={armRotate} 
                            onPress={togglePlayback} 
                            isCreationMode={true}
                            visibility={selectedVisibility}
                            onVisibilityChange={handleToggleVisibility} 
                            onPost={handleUpload}
                            theme={currentTheme}
                        />
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
                                    <Text style={styles.uploadingText}>Truyền tín hiệu...</Text>
                                </BlurView>
                            </MotiView>
                        )}
                    </AnimatePresence>
                </View>
            </View>
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
});
