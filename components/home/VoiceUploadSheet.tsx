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
} from 'react-native';
import { authApis, endpoints } from '../../configs/Apis';
import { Visibility, VISIBILITY_LABEL, VISIBILITY_LIST } from '../../types';

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
                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="mic" size={20} color="#8b5cf6" />
                            <Text style={styles.title}>Đăng Giọng Nói</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={uploading}>
                            <Ionicons name="close" size={22} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Photo preview (if taken) */}
                    {photoUri && (
                        <View style={styles.photoRow}>
                            <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                            <View style={styles.photoInfo}>
                                <Ionicons name="image-outline" size={16} color="#10b981" />
                                <Text style={styles.photoLabel}>Đã đính kèm ảnh kỷ niệm</Text>
                            </View>
                        </View>
                    )}

                    {/* Audio ready indicator */}
                    <View style={styles.audioReady}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={styles.audioReadyText}>Bản ghi sẵn sàng để đăng</Text>
                    </View>

                    {/* Visibility picker */}
                    <Text style={styles.label}>Ai có thể nghe?</Text>
                    <View style={styles.visibilityRow}>
                        {VISIBILITY_LIST.map((v) => (
                            <TouchableOpacity
                                key={v}
                                style={[styles.visBtn, selectedVisibility === v && styles.visBtnActive]}
                                onPress={() => setSelectedVisibility(v)}
                            >
                                <Ionicons
                                    name={VISIBILITY_ICON[v]}
                                    size={18}
                                    color={selectedVisibility === v ? '#fff' : '#6b7280'}
                                />
                                <Text style={[styles.visBtnText, selectedVisibility === v && styles.visBtnTextActive]}>
                                    {VISIBILITY_LABEL[v]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.discardBtn} onPress={onClose} disabled={uploading}>
                            <Text style={styles.discardText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
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
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: 44,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
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
        color: '#111827',
    },
    closeBtn: {
        padding: 4,
    },

    // Photo preview
    photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: 10,
        backgroundColor: '#f0fdf4',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    photoThumb: {
        width: 56,
        height: 56,
        borderRadius: 10,
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

    // Audio ready
    audioReady: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: 12,
        padding: 10,
        marginBottom: 24,
        gap: 8,
    },
    audioReadyText: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '500',
    },

    // Visibility
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
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
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#f9fafb',
    },
    visBtnActive: {
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
    },
    visBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
        textAlign: 'center',
    },
    visBtnTextActive: {
        color: '#ffffff',
    },

    // Actions
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    discardBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    discardText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6b7280',
    },
    uploadBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8b5cf6',
        paddingVertical: 16,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
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
