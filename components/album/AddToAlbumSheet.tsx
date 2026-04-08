/**
 * AddToAlbumSheet — bottom sheet to add a VoicePin to a user album.
 * Cross-tab integration: can be used from Memory, Home, or Album detail screens.
 */
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Album } from '@/types';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');
const STORAGE_KEY = 'whispery_user_albums';

interface AddToAlbumSheetProps {
    visible: boolean;
    pinId: number;
    onDismiss: () => void;
    onAdded?: (albumName: string) => void;
}

export function AddToAlbumSheet({ visible, pinId, onDismiss, onAdded }: AddToAlbumSheetProps) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(false);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const router = useRouter();

    const loadAlbums = useCallback(async () => {
        setLoading(true);
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const list: Album[] = stored ? JSON.parse(stored) : [];
            setAlbums(list);
            // Which albums already contain this pin?
            const ids = new Set(
                list.filter(a => a.pinIds?.includes(pinId)).map(a => a.id)
            );
            setAddedIds(ids);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [pinId]);

    useEffect(() => {
        if (visible) loadAlbums();
    }, [visible, loadAlbums]);

    const handleToggle = async (album: Album) => {
        const already = addedIds.has(album.id);
        const storedRaw = await AsyncStorage.getItem(STORAGE_KEY);
        const list: Album[] = storedRaw ? JSON.parse(storedRaw) : [];

        const updated = list.map(a => {
            if (a.id !== album.id) return a;
            const ids = a.pinIds ?? [];
            const newIds = already ? ids.filter(i => i !== pinId) : [...ids, pinId];
            return { ...a, pinIds: newIds, pinCount: newIds.length };
        });

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setAlbums(updated);

        const newSet = new Set(addedIds);
        if (already) newSet.delete(album.id);
        else {
            newSet.add(album.id);
            onAdded?.(album.name);
        }
        setAddedIds(newSet);
    };

    return (
        <Modal
            transparent
            animationType="none"
            visible={visible}
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            {/* Backdrop */}
            <TouchableOpacity style={styles.backdrop} onPress={onDismiss} activeOpacity={1}>
                <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>

            {/* Sheet */}
            <MotiView
                from={{ translateY: 300, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                exit={{ translateY: 300, opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                style={styles.sheet}
            >
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={['rgba(255,255,255,0.06)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                />

                {/* Handle */}
                <View style={styles.handle} />

                {/* Header */}
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Thêm vào Album</Text>
                    <TouchableOpacity onPress={onDismiss} hitSlop={12}>
                        <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator color="#7c3aed" />
                    </View>
                ) : albums.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="albums-outline" size={40} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptyText}>Chưa có album nào</Text>
                        <TouchableOpacity
                            onPress={() => {
                                onDismiss();
                                router.push('/(tabs)/album/create');
                            }}
                            style={styles.createLink}
                        >
                            <Text style={styles.createLinkText}>Tạo album mới</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    >
                        {albums.map((album, i) => {
                            const isAdded = addedIds.has(album.id);
                            const gradient = (album.coverGradient ?? ['#7c3aed', '#4338ca']) as [string, string];
                            return (
                                <MotiView
                                    key={album.id}
                                    from={{ opacity: 0, translateX: -20 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ delay: 60 * i }}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleToggle(album)}
                                        activeOpacity={0.8}
                                        style={[styles.albumRow, isAdded && styles.albumRowActive]}
                                    >
                                        {/* Mini cover */}
                                        <View style={styles.miniCover}>
                                            <LinearGradient
                                                colors={gradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={StyleSheet.absoluteFill}
                                            />
                                            <Ionicons name="mic" size={16} color="rgba(255,255,255,0.7)" />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.albumRowName}>{album.name}</Text>
                                            <Text style={styles.albumRowCount}>
                                                {(album.pinIds?.length ?? 0)} chốt
                                            </Text>
                                        </View>

                                        <View style={[styles.checkCircle, isAdded && styles.checkCircleActive]}>
                                            {isAdded && (
                                                <Ionicons name="checkmark" size={14} color="#fff" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </MotiView>
                            );
                        })}

                        {/* Create new album link */}
                        <TouchableOpacity
                            onPress={() => {
                                onDismiss();
                                router.push('/(tabs)/album/create');
                            }}
                            style={styles.newAlbumRow}
                        >
                            <View style={styles.newAlbumIcon}>
                                <Ionicons name="add" size={20} color="#7c3aed" />
                            </View>
                            <Text style={styles.newAlbumText}>Tạo album mới</Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </MotiView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: height * 0.65,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        paddingBottom: 32,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    sheetTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    loadingRow: {
        padding: 40,
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 15,
        fontWeight: '600',
    },
    createLink: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: '#7c3aed22',
        borderWidth: 1,
        borderColor: '#7c3aed44',
    },
    createLinkText: {
        color: '#a78bfa',
        fontSize: 14,
        fontWeight: '700',
    },
    listContent: { padding: 16, gap: 10 },
    albumRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    albumRowActive: {
        backgroundColor: 'rgba(124,58,237,0.15)',
        borderColor: 'rgba(124,58,237,0.4)',
    },
    miniCover: {
        width: 44,
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    albumRowName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    albumRowCount: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    checkCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircleActive: {
        backgroundColor: '#7c3aed',
        borderColor: '#7c3aed',
    },
    newAlbumRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(124,58,237,0.25)',
        borderStyle: 'dashed',
        marginTop: 4,
    },
    newAlbumIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(124,58,237,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    newAlbumText: {
        color: '#a78bfa',
        fontSize: 14,
        fontWeight: '700',
    },
});
