import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';
import { MotiView } from 'moti';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { BASE_URL } from '@/configs/Apis';
import { Avatar } from '@/components/ui/Avatar';

const { width } = Dimensions.get('window');
const PAGE_PADDING = 24;

const EMOTION_META: Record<string, { color: string; gradient: string[]; icon: keyof typeof Ionicons.glyphMap; vi: string }> = {
  Happy: { color: '#FFD700', gradient: ['#FFD700', '#FFA500'], icon: 'sunny', vi: 'Vui vẻ' },
  Sad: { color: '#00BFFF', gradient: ['#00BFFF', '#1E90FF'], icon: 'rainy', vi: 'Buồn bã' },
  Calm: { color: '#00FA9A', gradient: ['#00FA9A', '#3CB371'], icon: 'leaf', vi: 'Bình yên' },
  Nostalgic: { color: '#FF69B4', gradient: ['#FF69B4', '#DA70D6'], icon: 'hourglass', vi: 'Nhớ nhung' },
  Romantic: { color: '#FF1493', gradient: ['#FF1493', '#C71585'], icon: 'heart', vi: 'Lãng mạn' },
  Curious: { color: '#9370DB', gradient: ['#9370DB', '#8A2BE2'], icon: 'telescope', vi: 'Tò mò' },
  Angry: { color: '#FF4500', gradient: ['#FF4500', '#DC143C'], icon: 'flame', vi: 'Bực bội' },
};

const DEFAULT_META = { color: '#A855F7', gradient: ['#A855F7', '#7C3AED'], icon: 'mic' as any, vi: 'Cảm xúc' };

function getMeta(label?: string) {
  if (!label) return DEFAULT_META;
  // Normalize label (e.g., "happy" -> "Happy") for lookup
  const normalized = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  const mapped = EMOTION_META[normalized] || EMOTION_META[label];
  
  if (mapped) return mapped;
  // Fallback: use the original label as display text instead of generic "Cảm xúc"
  return { ...DEFAULT_META, vi: label };
}

function resolveAsset(path?: string) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}/${cleanPath}`;
}

export interface VoicePinCarouselCardProps {
  pin: VoicePin;
  onPress: () => void;
  index?: number;
  scrollX?: SharedValue<number>;
  currentTheme: any;
  cardWidth: number;
  cardSpacing: number;
  isGrid?: boolean;
  fallbackAuraUrl?: string | null;
}

export function VoicePinCarouselCard({
  pin,
  onPress,
  index,
  scrollX,
  currentTheme,
  cardWidth,
  cardSpacing,
  isGrid = false,
  fallbackAuraUrl,
}: VoicePinCarouselCardProps) {
  const isHidden = pin.isAnonymous || pin.type === 'HIDDEN_AR';
  const isDark = currentTheme.dark;
  const meta = isHidden ? { color: '#C084FC', icon: 'sparkles' as any, vi: 'Bí ẩn', gradient: ['#C084FC', '#9333EA'] } : getMeta(pin.emotionLabel);
  
  const imgUrl = useMemo(() => {
     const raw = pin.images?.[0]?.imageUrl ?? pin.imageUrl;
     return resolveAsset(raw);
  }, [pin]);

  const pressedScale = useSharedValue(1);

  const handlePressIn = () => {
    pressedScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    pressedScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const ITEM_SIZE = cardWidth + cardSpacing;

  const distanceVal = useDerivedValue(() => {
    if (index === undefined || scrollX === undefined) return 0;
    const cardCenter = PAGE_PADDING + index * ITEM_SIZE + cardWidth / 2;
    const screenCenter = scrollX.value + width / 2;
    return Math.abs(screenCenter - cardCenter);
  });

  const animatedStyle = useAnimatedStyle(() => {
    let targetScale = 1;
    let targetOpacity = 1;
    let targetRotate = 0;

    if (index !== undefined && scrollX !== undefined) {
      const distance = distanceVal.value;
      const range = cardWidth * 1.5;

      targetScale = interpolate(distance, [0, range], [1, 0.85], Extrapolation.CLAMP);
      targetOpacity = interpolate(distance, [0, range], [1, 0.7], Extrapolation.CLAMP);
      targetRotate = 0;
    }

    return {
      transform: [
        { scale: withSpring(targetScale * pressedScale.value) },
      ],
      opacity: targetOpacity,
    };
  });

  const dateStr = new Date(pin.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
  });

  const cardHeight = cardWidth * 1.35;

  return (
    <Animated.View style={[{ width: cardWidth, marginRight: cardSpacing }, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.container,
          { 
            height: cardHeight, 
            borderRadius: isGrid ? 20 : 32,
            backgroundColor: 'transparent',
          }
        ]}
      >
        {/* Glow Effect Background */}
        <MotiView
          from={{ opacity: 0.3, scale: 0.9 }}
          animate={{ opacity: 0.6, scale: 1.1 }}
          transition={{ loop: true, type: 'timing', duration: 3000 }}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: meta.color, opacity: 0.1, borderRadius: 40, transform: [{ scale: 1.1 }] },
          ]}
        />

        {/* Main Content Area */}
        <View style={[styles.cardInner, { 
            borderRadius: isGrid ? 20 : 32,
            borderColor: currentTheme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
        }]}>
          {/* Background Image/Fallback */}
          {imgUrl || fallbackAuraUrl ? (
            <Image 
              source={imgUrl || fallbackAuraUrl} 
              style={StyleSheet.absoluteFill} 
              contentFit="cover" 
              transition={400} 
              blurRadius={!imgUrl && fallbackAuraUrl ? 10 : 0}
            />
          ) : (
            <LinearGradient
              colors={currentTheme.dark ? ['#1A1A2E', '#0a0a14'] : ['#F3F4F6', '#E5E7EB']}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Aesthetic Overlay */}
          <LinearGradient
            colors={currentTheme.dark ? 
                ['transparent', 'rgba(10,10,20,0.2)', 'rgba(10,10,20,0.8)', '#0a0a14'] :
                ['transparent', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
            locations={[0, 0.4, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.header}>
            <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                <BlurView 
                    intensity={isDark ? 50 : 80} 
                    tint={isDark ? "dark" : "light"} 
                    style={[
                        styles.glassBadge, 
                        { 
                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'
                        }
                    ]}
                >
                    <Ionicons name={meta.icon} size={isGrid ? 12 : 14} color={meta.color} />
                    {!isGrid && <Text style={[styles.badgeText, { color: isDark ? '#FFF' : '#111827' }]}>{meta.vi}</Text>}
                </BlurView>

                {pin.status !== 'APPROVED' && (
                    <BlurView intensity={40} tint={currentTheme.dark ? "dark" : "light"} style={[styles.glassBadge, { borderColor: pin.status === 'REJECTED' ? '#EF4444' : '#F59E0B' }]}>
                        <Ionicons 
                            name={pin.status === 'REJECTED' ? 'alert-circle' : 'time'} 
                            size={isGrid ? 12 : 14} 
                            color={pin.status === 'REJECTED' ? '#EF4444' : '#F59E0B'} 
                        />
                    </BlurView>
                )}
            </View>

            <View style={[styles.dateBadge, { backgroundColor: currentTheme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.dateText, { color: currentTheme.dark ? '#FFF' : '#6b7280' }]}>{dateStr}</Text>
            </View>
          </View>

          {/* Content Body */}
          <View style={styles.body}>
            <View style={styles.titleWrapper}>
                <Text style={[styles.title, { 
                    fontSize: isGrid ? 15 : 20,
                    color: currentTheme.dark ? '#FFF' : '#111827',
                    lineHeight: isGrid ? 20 : 26
                }]} numberOfLines={2}>
                    {pin.content || pin.transcription || 'Tiếng vọng Ký ức'}
                </Text>
                
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={10} color={isDark ? "rgba(255,255,255,0.5)" : "#6b7280"} />
                    <Text style={[styles.locationText, { color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }]} numberOfLines={1}>
                        {pin.address?.split(',')[0] || 'Unknown Aura'}
                    </Text>
                </View>
            </View>

            {pin.status === 'REJECTED' && pin.moderationReason && !isGrid && (
                <View style={styles.rejectReason}>
                    <Ionicons name="warning" size={12} color="#EF4444" />
                    <Text style={styles.rejectText} numberOfLines={1}>{pin.moderationReason}</Text>
                </View>
            )}

            {!isGrid && (
                <View style={styles.footer}>
                    {/* Stats */}
                    <View style={styles.stats}>
                        <View style={styles.statItem}>
                            <Ionicons name="mic" size={14} color={meta.color} />
                            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#4b5563' }]}>{pin.audioDuration ?? 0}s</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="play" size={14} color={isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"} />
                            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#4b5563' }]}>{pin.listensCount ?? 0}</Text>
                        </View>
                    </View>

                    {/* Author */}
                    {pin.user && (
                        <View style={styles.author}>
                            <Avatar 
                                uri={pin.user.avatar} 
                                size={32} 
                            />
                        </View>
                    )}
                </View>
            )}

            {/* Bottom Accent Line */}
            <View style={[styles.accentLine, { backgroundColor: meta.color }]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardInner: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    zIndex: 10,
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    overflow: 'hidden',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  titleWrapper: {
    marginBottom: 8,
  },
  title: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rejectReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  rejectText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    paddingTop: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.6,
  },
});
