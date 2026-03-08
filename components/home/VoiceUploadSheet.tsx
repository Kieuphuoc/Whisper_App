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
    const [selectedVisibility, setSelectedVisibility] = useState<Visibility>(visibility);
    const [uploading, setUploading] = useState(false);

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
                // optional, bỏ qua lỗi
            }

            const formData = new FormData();

            // File âm thanh
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

            const api = authApis(token);
            await api.post(endpoints.createVoicePin, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

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
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.sheet, { backgroundColor: currentTheme.colors.background, borderTopLeftRadius: currentTheme.radius.xl + 4, borderTopRightRadius: currentTheme.radius.xl + 4 }]}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="mic" size={20} color={currentTheme.colors.primary} />
                            <Text style={[styles.title, { color: currentTheme.colors.text }]}>Đăng Giọng Nói</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={uploading}>
                            <Ionicons name="close" size={22} color={currentTheme.colors.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* Photo preview (if taken) */}
                    {photoUri && (
                        <View style={[styles.photoRow, { borderRadius: currentTheme.radius.md, backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.success + '33' }]}>
                            <Image source={{ uri: photoUri }} style={[styles.photoThumb, { borderRadius: currentTheme.radius.sm }]} />
                            <View style={styles.photoInfo}>
                                <Ionicons name="image-outline" size={16} color={currentTheme.colors.success} />
                                <Text style={[styles.photoLabel, { color: currentTheme.colors.success }]}>Đã đính kèm ảnh kỷ niệm</Text>
                            </View>
                        </View>
                    )}

                    {/* Audio ready indicator */}
                    <View style={[styles.audioReady, { borderRadius: currentTheme.radius.md, backgroundColor: currentTheme.colors.success + '15' }]}>
                        <Ionicons name="checkmark-circle" size={20} color={currentTheme.colors.success} />
                        <Text style={[styles.audioReadyText, { color: currentTheme.colors.success }]}>Bản ghi sẵn sàng để đăng</Text>
                    </View>

                    {/* Visibility picker */}
                    <Text style={[styles.label, { color: currentTheme.colors.icon }]}>Ai có thể nghe?</Text>
                    <View style={styles.visibilityRow}>
                        {VISIBILITY_LIST.map((v) => (
                            <TouchableOpacity
                                key={v}
                                style={[
                                    styles.visBtn,
                                    { borderRadius: currentTheme.radius.md, backgroundColor: currentTheme.colors.icon + '05', borderColor: currentTheme.colors.icon + '20' },
                                    selectedVisibility === v && { backgroundColor: currentTheme.colors.primary, borderColor: currentTheme.colors.primary }
                                ]}
                                onPress={() => setSelectedVisibility(v)}
                            >
                                <Ionicons
                                    name={VISIBILITY_ICON[v]}
                                    size={18}
                                    color={selectedVisibility === v ? Colors.white : currentTheme.colors.icon}
                                />
                                <Text style={[styles.visBtnText, { color: currentTheme.colors.icon }, selectedVisibility === v && { color: Colors.white }]}>
                                    {VISIBILITY_LABEL[v]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.discardBtn, { borderRadius: currentTheme.radius.lg, borderColor: currentTheme.colors.icon + '20' }]}
                            onPress={onClose}
                            disabled={uploading}
                        >
                            <Text style={[styles.discardText, { color: currentTheme.colors.icon }]}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.uploadBtn,
                                { borderRadius: currentTheme.radius.lg, backgroundColor: currentTheme.colors.primary, shadowColor: currentTheme.colors.primary },
                                uploading && styles.uploadBtnDisabled
                            ]}
                            onPress={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload-outline" size={18} color="white" />
                                    <Text style={styles.uploadText}>Đăng lên bản đồ</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        paddingHorizontal: 24,
        paddingBottom: 44,
        paddingTop: 12,
        ...theme.light.shadows.lg,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e5e7eb',
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    photoThumb: {
        width: 56,
        height: 56,
        backgroundColor: '#d1d5db',
    },
    photoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    photoLabel: {
        color: '#10b981',
        fontWeight: '600',
        fontSize: 13,
    },
    audioReady: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginBottom: 24,
        gap: 8,
    },
    audioReadyText: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '500',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    visibilityRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 28,
    },
    visBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderWidth: 1.5,
        alignItems: 'center',
        gap: 5,
    },
    visBtnText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    visBtnTextActive: {
        color: '#ffffff',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    discardBtn: {
        flex: 1,
        paddingVertical: 16,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    discardText: {
        fontSize: 15,
        fontWeight: '600',
    },
    uploadBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    uploadBtnDisabled: {
        opacity: 0.6,
    },
    uploadText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
});
