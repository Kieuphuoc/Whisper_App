import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { authApis, endpoints } from '../../configs/Apis';
import { Visibility, VISIBILITY_LABEL, VISIBILITY_LIST } from '../../types';
import { theme } from '@/constants/Theme';
import { Colors } from '@/constants/Colors';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';

const VISIBILITY_ICON: Record<Visibility, keyof typeof Ionicons.glyphMap> = {
    PUBLIC: 'earth-outline',
    FRIENDS: 'people-outline',
    PRIVATE: 'lock-closed-outline',
};

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
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const isDark = colorScheme === 'dark';
    const [selectedVisibility, setSelectedVisibility] = useState<Visibility>(visibility);
    const [uploading, setUploading] = useState(false);

    const scanAnim = useSharedValue(0);
    const shimmerProgress = useSharedValue(0);
    const buttonGlow = useSharedValue(0);

    React.useEffect(() => {
        if (visible) {
            // Start the periodic shimmer animation (every 5 seconds)
            shimmerProgress.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                    withDelay(3500, withTiming(0, { duration: 0 }))
                ),
                -1,
                false
            );

            // Start a subtle periodic glow (every 8 seconds)
            buttonGlow.value = withRepeat(
                withSequence(
                    withDelay(6000, withTiming(1, { duration: 1000 })),
                    withTiming(0, { duration: 1000 })
                ),
                -1,
                false
            );
        }
    }, [visible]);

    React.useEffect(() => {
        if (uploading) {
            scanAnim.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
        } else {
            scanAnim.value = 0;
        }
    }, [uploading]);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(shimmerProgress.value, [0, 1], [-200, 400]) },
            { skewX: '-20deg' }
        ],
        opacity: interpolate(shimmerProgress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: buttonGlow.value * 0.5,
        transform: [{ scale: interpolate(buttonGlow.value, [0, 1], [1, 1.1]) }]
    }));

    const scanStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(scanAnim.value, [0, 1], [-20, 100]) }],
        opacity: interpolate(scanAnim.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    }));

    const handleUpload = async () => {
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

            // Reverse-geocode to get address
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
            formData.append('file', {
                uri: audioUri,
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
                formData.append('images', {
                    uri: photoUri,
                    name: `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                } as any);
            }

            const api = authApis(token);
            await api.post(endpoints.createVoicePin, formData);

            onUploadSuccess();
            Alert.alert('Đã đăng!', 'Giọng nói của bạn đã lên bản đồ.');
        } catch (err) {
            console.error('Upload failed:', err);
            Alert.alert('Đăng thất bại', 'Không thể tải lên giọng nói. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                {/* Background Aura */}
                <MotiView
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.3, scale: 1.5 }}
                    transition={{ duration: 1000, type: 'timing' }}
                    style={StyleSheet.absoluteFill}
                >
                    <LinearGradient
                        colors={[currentTheme.colors.primary, 'transparent']}
                        style={{ width: '100%', height: '100%', position: 'absolute', top: '50%', left: 0 }}
                    />
                </MotiView>

                <TouchableOpacity
                    activeOpacity={1}
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />
                
                <MotiView
                    from={{ translateY: 500, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    exit={{ translateY: 500, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 90 }}
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                        }
                    ]}
                >
                    <BlurView intensity={isDark ? 50 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    
                    {/* Inner Gradient for better glass look */}
                    <LinearGradient
                        colors={['rgba(255,255,255,0.15)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.handle} />

                    {/* Header Section */}
                    <View style={styles.header}>
                        <MotiView
                            from={{ translateX: -30, opacity: 0 }}
                            animate={{ translateX: 0, opacity: 1 }}
                            transition={{ delay: 200, type: 'spring' }}
                            style={styles.headerLeft}
                        >
                            <LinearGradient
                                colors={['#7c3aed', '#4338ca']}
                                style={styles.titleIconBg}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="radio" size={20} color="#fff" />
                            </LinearGradient>
                            <View>
                                <Text style={[styles.headerSub, { color: currentTheme.colors.primary }]}>NEW FREQUENCY</Text>
                                <Text style={[styles.title, { color: currentTheme.colors.text }]}>Phát Tín Hiệu</Text>
                            </View>
                        </MotiView>
                        
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={uploading}>
                            <BlurView intensity={30} tint="light" style={styles.closeBlur}>
                                <Ionicons name="close" size={22} color={isDark ? "#fff" : "#000"} />
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    {/* Photo Preview - Ultra Modern Floating Style */}
                    {!!photoUri && (
                        <MotiView
                            from={{ scale: 0.9, rotate: '10deg', opacity: 0, translateY: 20 }}
                            animate={{ scale: 1, rotate: '0deg', opacity: 1, translateY: 0 }}
                            transition={{ delay: 400, type: 'spring', damping: 12 }}
                            style={[
                                styles.photoContainer,
                                { 
                                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                    shadowColor: currentTheme.colors.primary,
                                }
                            ]}
                        >
                            <Image source={{ uri: photoUri }} style={styles.photoFull} />
                            <BlurView intensity={40} tint="dark" style={styles.photoOverlay}>
                                <MotiView
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2000 }}
                                >
                                    <Ionicons name="sparkles" size={14} color="#A78BFA" />
                                </MotiView>
                                <Text style={styles.photoOverlayText}>Khoảnh khắc đã sẵn sàng</Text>
                            </BlurView>
                        </MotiView>
                    )}

                    {/* Status Badge */}
                    <MotiView
                        from={{ opacity: 0, translateX: 50 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ delay: 300 }}
                        style={[styles.statusBadge, { backgroundColor: currentTheme.colors.primary + '20' }]}
                    >
                        <MotiView
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1500 }}
                            style={[styles.pulseDot, { backgroundColor: currentTheme.colors.primary }]}
                        />
                        <Text style={[styles.statusText, { color: currentTheme.colors.primary }]}>Đồng bộ tín hiệu thành công</Text>
                    </MotiView>

                    {/* Visibility Picker - Avant Garde Asymmetric */}
                    <Text style={[styles.label, { color: currentTheme.colors.text }]}>Ai có thể nhận tín hiệu này?</Text>
                    <View style={styles.visibilityRow}>
                        {VISIBILITY_LIST.map((v, i) => (
                            <TouchableOpacity
                                key={v}
                                style={styles.visBtnContainer}
                                onPress={() => setSelectedVisibility(v)}
                                disabled={uploading}
                                activeOpacity={0.8}
                            >
                                <MotiView
                                    animate={{
                                        scale: selectedVisibility === v ? 1.05 : 0.95,
                                        translateY: selectedVisibility === v ? -5 : 0,
                                    }}
                                    transition={{ type: 'spring', damping: 15 }}
                                    style={[
                                        styles.visBtnGlass,
                                        {
                                            backgroundColor: selectedVisibility === v 
                                                ? currentTheme.colors.primary 
                                                : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                            borderColor: selectedVisibility === v 
                                                ? currentTheme.colors.primary 
                                                : 'rgba(255,255,255,0.15)',
                                            // ASYMMETRIC RADIUS based on profile style
                                            borderTopLeftRadius: i === 0 ? 32 : 12,
                                            borderTopRightRadius: i === 1 ? 32 : 12,
                                            borderBottomLeftRadius: i === 2 ? 32 : 12,
                                            borderBottomRightRadius: 20,
                                        }
                                    ]}
                                >
                                    {selectedVisibility === v && (
                                        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                                    )}
                                    <Ionicons
                                        name={VISIBILITY_ICON[v]}
                                        size={22}
                                        color={selectedVisibility === v ? '#fff' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                                    />
                                    <Text style={[
                                        styles.visBtnText,
                                        { 
                                            color: selectedVisibility === v ? '#fff' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                            fontWeight: selectedVisibility === v ? '900' : '700'
                                        }
                                    ]}>
                                        {VISIBILITY_LABEL[v]}
                                    </Text>
                                </MotiView>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer Actions */}
                    <AnimatePresence>
                        {uploading ? (
                            <MotiView
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={styles.uploadingContainer}
                            >
                                <View style={styles.scanTrack}>
                                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                    <Animated.View style={[styles.scanLine, { backgroundColor: currentTheme.colors.primary }, scanStyle]} />
                                    <ActivityIndicator size="large" color={currentTheme.colors.primary} />
                                </View>
                                <Text style={[styles.uploadingText, { color: currentTheme.colors.text }]}>
                                    Đang truyền sóng...
                                </Text>
                                <Text style={[styles.uploadingSubText, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
                                    Mã hóa tọa độ và giọng nói vào Aura
                                </Text>
                            </MotiView>
                        ) : (
                            <MotiView
                                from={{ opacity: 0, translateY: 30 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ delay: 500, type: 'spring' }}
                                style={styles.actions}
                            >
                                <TouchableOpacity
                                    style={[styles.discardBtn, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
                                    onPress={onClose}
                                >
                                    <BlurView intensity={10} tint={isDark ? "light" : "dark"} style={StyleSheet.absoluteFill} />
                                    <Text style={[styles.discardText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>Hủy bản thảo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.uploadBtnContainer}
                                    onPress={handleUpload}
                                    activeOpacity={0.9}
                                >
                                    {/* PERIODIC GLOW EFFECT */}
                                    <Animated.View
                                        style={[
                                            StyleSheet.absoluteFill,
                                            glowStyle,
                                            {
                                                backgroundColor: '#7c3aed',
                                                borderRadius: 24,
                                                shadowColor: '#7c3aed',
                                                shadowOpacity: 0.8,
                                                shadowRadius: 20,
                                            } as any
                                        ]}
                                    />

                                    <LinearGradient
                                        colors={['#7c3aed', '#4338ca']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.uploadGradient}
                                    >
                                        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                                        
                                        {/* PERIODIC SHIMMER FLASH */}
                                        <Animated.View
                                            style={[
                                                {
                                                    position: 'absolute',
                                                    top: 0,
                                                    bottom: 0,
                                                    width: 120,
                                                    backgroundColor: 'rgba(255,255,255,0.4)',
                                                },
                                                shimmerStyle
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={StyleSheet.absoluteFill}
                                            />
                                        </Animated.View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 10 }}>
                                            <Ionicons name="send" size={20} color="#fff" />
                                            <Text style={styles.uploadText}>Phát Tín Hiệu</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </MotiView>
                        )}
                    </AnimatePresence>
                </MotiView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        paddingHorizontal: 28,
        paddingBottom: 50,
        paddingTop: 10,
        overflow: 'hidden',
        borderTopLeftRadius: 48,
        borderTopRightRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 28,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    headerSub: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: -2,
    },
    titleIconBg: {
        width: 48,
        height: 48,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    title: {
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: -1,
    },
    closeBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    closeBlur: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 30,
        gap: 10,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    photoContainer: {
        width: '100%',
        height: 200,
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 1,
        elevation: 20,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    photoFull: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        position: 'absolute',
        top: 15,
        right: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    photoOverlayText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    label: {
        fontSize: 13,
        fontWeight: '900',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        opacity: 0.7,
    },
    visibilityRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
    },
    visBtnContainer: {
        flex: 1,
    },
    visBtnGlass: {
        paddingVertical: 18,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    visBtnText: {
        fontSize: 12,
        letterSpacing: 0.3,
    },
    actions: {
        flexDirection: 'row',
        gap: 15,
    },
    discardBtn: {
        flex: 1,
        height: 68,
        borderRadius: 24,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    discardText: {
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    uploadBtnContainer: {
        flex: 2,
        height: 68,
        borderRadius: 24,
        overflow: 'visible',
        position: 'relative',
    },
    uploadGradient: {
        flex: 1,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    uploadText: {
        fontSize: 19,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    uploadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
    },
    scanTrack: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 3,
        zIndex: 1,
        filter: 'blur(1px)'
    },
    uploadingText: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    uploadingSubText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        maxWidth: '80%',
        lineHeight: 20,
    },
});
