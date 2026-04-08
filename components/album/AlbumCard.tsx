import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Album } from '@/types';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_GAP = 12;
export const ALBUM_CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_GAP) / 2;
export const ALBUM_CARD_HEIGHT = ALBUM_CARD_WIDTH * 1.3;

export const SMART_CARD_WIDTH = 155;
export const SMART_CARD_HEIGHT = 185;

// ─── Regular Album Card (2-column grid) ────────────────────────────────────

interface AlbumCardProps {
    album: Album;
    onPress: () => void;
    onLongPress?: () => void;
    index?: number;
}

export function AlbumCard({ album, onPress, onLongPress, index = 0 }: AlbumCardProps) {
    const gradient = (album.coverGradient ?? ['#7c3aed', '#4338ca']) as [string, string, ...string[]];

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.88, translateY: 22 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ delay: 80 * index, type: 'spring', damping: 16, stiffness: 120 }}
        >
            <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={500}
                activeOpacity={0.82}
                style={styles.card}
            >
                {/* Cover */}
                <View style={styles.coverArea}>
                    {album.coverUri ? (
                        <Image
                            source={album.coverUri}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            transition={300}
                        />
                    ) : (
                        <LinearGradient
                            colors={gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    )}

                    {/* Gradient bottom fade */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
                        locations={[0, 0.5, 1]}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Cover Icon (smart albums / no image) */}
                    {album.coverIcon && !album.coverUri && (
                        <MotiView
                            from={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.55 }}
                            transition={{ delay: 80 * index + 180, type: 'spring' }}
                            style={styles.coverIconWrap}
                        >
                            <Ionicons
                                name={album.coverIcon as any}
                                size={46}
                                color="#fff"
                            />
                        </MotiView>
                    )}

                    {/* Count Badge */}
                    <View style={styles.countBadge}>
                        <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFill, styles.countBlur]} />
                        <Text style={styles.countBadgeText}>{album.pinCount}</Text>
                    </View>
                </View>

                {/* Bottom Info */}
                <View style={styles.infoArea}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.albumName} numberOfLines={1}>{album.name}</Text>
                        <View style={styles.metaRow}>
                            <Ionicons name="mic" size={10} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.metaText}>{album.pinCount} chốt</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
                </View>
            </TouchableOpacity>
        </MotiView>
    );
}

// ─── Smart Album Card (horizontal scroll) ──────────────────────────────────

interface SmartAlbumCardProps {
    album: Album;
    onPress: () => void;
    index?: number;
}

export function SmartAlbumCard({ album, onPress, index = 0 }: SmartAlbumCardProps) {
    const gradient = (album.coverGradient ?? ['#7c3aed', '#4338ca']) as [string, string, ...string[]];
    const accentColor = album.accentColor ?? '#7c3aed';

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.85, translateX: -20 }}
            animate={{ opacity: 1, scale: 1, translateX: 0 }}
            transition={{ delay: 120 * index, type: 'spring', damping: 14 }}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.82}
                style={styles.smartCard}
            >
                {/* Background gradient */}
                <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Subtle noise/texture overlay */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.08)', 'transparent', 'rgba(0,0,0,0.2)']}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFill}
                />

                {/* Glow dot */}
                <MotiView
                    from={{ opacity: 0.2, scale: 0.8 }}
                    animate={{ opacity: 0.5, scale: 1.2 }}
                    transition={{ loop: true, type: 'timing', duration: 3000 }}
                    style={[styles.smartGlow, { backgroundColor: accentColor }]}
                />

                {/* Icon */}
                {album.coverIcon && (
                    <MotiView
                        from={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 120 * index + 200, type: 'spring' }}
                        style={styles.smartIconWrap}
                    >
                        <BlurView intensity={25} tint="dark" style={styles.smartIconBlur}>
                            <Ionicons name={album.coverIcon as any} size={28} color="#fff" />
                        </BlurView>
                    </MotiView>
                )}

                {/* Bottom info */}
                <View style={styles.smartInfoArea}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <Text style={styles.smartName} numberOfLines={1}>{album.name}</Text>
                    <Text style={styles.smartCount}>{album.pinCount} chốt</Text>
                </View>
            </TouchableOpacity>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    // ── Regular Card ──
    card: {
        width: ALBUM_CARD_WIDTH,
        height: ALBUM_CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: '#1a1a2e',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    coverArea: {
        flex: 1,
        overflow: 'hidden',
    },
    coverIconWrap: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        minWidth: 28,
        height: 28,
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    countBlur: {
        borderRadius: 14,
    },
    countBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    infoArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    albumName: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '600',
    },

    // ── Smart Card ──
    smartCard: {
        width: SMART_CARD_WIDTH,
        height: SMART_CARD_HEIGHT,
        borderRadius: 22,
        overflow: 'hidden',
        marginRight: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
    },
    smartGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        top: -20,
        right: -20,
        opacity: 0.35,
    },
    smartIconWrap: {
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: [{ translateX: -28 }, { translateY: -28 }],
    },
    smartIconBlur: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    smartInfoArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingVertical: 12,
        overflow: 'hidden',
    },
    smartName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    smartCount: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '600',
    },
});
