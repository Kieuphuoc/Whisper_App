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
  return label ? (EMOTION_META[label] ?? DEFAULT_META) : DEFAULT_META;
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
}: VoicePinCarouselCardProps) {
  const isHidden = pin.isAnonymous || pin.type === 'HIDDEN_AR';
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
      targetRotate = interpolate(distance, [-range, 0, range], [-5, 0, 5], Extrapolation.CLAMP);
    }

    return {
      transform: [
        { scale: withSpring(targetScale * pressedScale.value) },
        { rotateZ: `${targetRotate}deg` }
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
          { height: cardHeight, borderRadius: isGrid ? 20 : 32 }
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
        <View style={[styles.cardInner, { borderRadius: isGrid ? 20 : 32 }]}>
          {/* Background Image/Fallback */}
          {imgUrl ? (
            <Image source={imgUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
          ) : (
            <LinearGradient
              colors={['#1A1A2E', '#16213E']}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Aesthetic Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)', '#000000']}
            locations={[0, 0.3, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Header Section */}
          <View style={styles.topSection}>
            <BlurView intensity={30} tint="dark" style={styles.moodBadge}>
               <MotiView
                  from={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ loop: true, type: 'spring' }}
               >
                  <Ionicons name={meta.icon} size={isGrid ? 12 : 16} color={meta.color} />
               </MotiView>
               {!isGrid && <Text style={[styles.moodText, { color: '#FFF' }]}>{meta.vi}</Text>}
            </BlurView>

            <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{dateStr}</Text>
            </View>
          </View>

          {/* Bottom Info Section */}
          <View style={styles.bottomSection}>
            <View style={styles.contentRow}>
                <Text style={[styles.title, { fontSize: isGrid ? 16 : 22 }]} numberOfLines={1}>
                    {pin.content || 'Memory Echo'}
                </Text>
                <View style={styles.locationContainer}>
                    <Ionicons name="location-sharp" size={10} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {pin.address?.split(',')[0] || 'Unknown Aura'}
                    </Text>
                </View>
            </View>

            {!isGrid && (
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="mic-outline" size={14} color={meta.color} />
                        <Text style={styles.statText}>{pin.audioDuration ?? 0}s</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="headset-outline" size={14} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.statText}>{pin.listensCount ?? 0}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="heart-outline" size={14} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.statText}>{pin.reactionsCount ?? 0}</Text>
                    </View>
                </View>
            )}

            {/* Premium Border Bottom Glow */}
            <View style={[styles.bottomGlow, { backgroundColor: meta.color }]} />
          </View>
        </View>

        {/* Author Avatar Floating (Only in Carousel) */}
        {!isGrid && pin.user && (
            <MotiView
                from={{ translateY: 20, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ delay: 300 }}
                style={styles.avatarContainer}
            >
                <BlurView intensity={40} tint="light" style={styles.avatarBlur}>
                    <Image 
                        source={resolveAsset(pin.user.avatar) || undefined} 
                        style={styles.avatarImg} 
                    />
                </BlurView>
            </MotiView>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardInner: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  moodText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  contentRow: {
    marginBottom: 12,
  },
  title: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
    shadowRadius: 10,
    shadowColor: '#FFF',
  },
  avatarContainer: {
    position: 'absolute',
    top: 45,
    right: -10,
    zIndex: 20,
  },
  avatarBlur: {
    padding: 4,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
  },
});
