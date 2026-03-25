import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';




const { width } = Dimensions.get('window');
const PAGE_PADDING = 24;

// --- Emotion meta ---
const EMOTION_META: Record<string, { color: string; gradient: string; icon: keyof typeof Ionicons.glyphMap; vi: string }> = {
  Happy: { color: '#facc15', gradient: '#fef9c3', icon: 'sunny-outline', vi: 'Vui vẻ' },
  Sad: { color: '#60a5fa', gradient: '#eff6ff', icon: 'rainy-outline', vi: 'Buồn bã' },
  Calm: { color: '#34d399', gradient: '#ecfdf5', icon: 'leaf-outline', vi: 'Bình yên' },
  Nostalgic: { color: '#f472b6', gradient: '#fdf2f8', icon: 'hourglass-outline', vi: 'Nhớ nhung' },
  Romantic: { color: '#fb7185', gradient: '#fff1f2', icon: 'heart-outline', vi: 'Lãng mạn' },
  Curious: { color: '#a78bfa', gradient: '#f5f3ff', icon: 'telescope-outline', vi: 'Tò mò' },
  Angry: { color: '#f87171', gradient: '#fef2f2', icon: 'flame-outline', vi: 'Bực bội' },
};
const DEFAULT_META = { color: '#8b5cf6', gradient: '#f5f3ff', icon: 'mic-outline' as keyof typeof Ionicons.glyphMap, vi: 'Khác' };

function getMeta(label?: string) {
  return label ? (EMOTION_META[label] ?? DEFAULT_META) : DEFAULT_META;
}

function getPinImage(pin: VoicePin): string | undefined {
  return pin.images?.[0]?.imageUrl ?? pin.imageUrl;
}



export interface VoicePinCarouselCardProps {
  pin: VoicePin;
  onPress: () => void;
  index?: number;
  scrollX?: SharedValue<number>;
  currentTheme: any;
  cardWidth: number;
  cardSpacing: number;
}

export function VoicePinCarouselCard({
  pin,
  onPress,
  index,
  scrollX,
  currentTheme,
  cardWidth,
  cardSpacing
}: VoicePinCarouselCardProps) {
  const meta = getMeta(pin.emotionLabel);
  const imgUrl = getPinImage(pin);
  const pressedScale = useSharedValue(1);

  const handlePressIn = () => {
    // Bouncier spring for press effect
    pressedScale.value = withSpring(0.92, { damping: 10, stiffness: 200 });
  };
  const handlePressOut = () => {
    pressedScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const ITEM_SIZE = cardWidth + cardSpacing;

  // Track distance for blur calculation
  const distanceVal = useDerivedValue(() => {
    if (index === undefined || scrollX === undefined) return 0;
    const cardCenter = PAGE_PADDING + index * ITEM_SIZE + cardWidth / 2;
    const screenCenter = scrollX.value + width / 2;
    return Math.abs(screenCenter - cardCenter);
  });

  const animatedStyle = useAnimatedStyle(() => {
    let targetScale = 1;
    let targetOpacity = 1;
    let targetTranslateY = 0;

    if (index !== undefined && scrollX !== undefined) {
      const distance = distanceVal.value;
      const range = cardWidth;

      targetScale = interpolate(
        distance,
        [0, range],
        [1, 0.82], // Smaller side cards as requested (was 0.92)
        Extrapolation.CLAMP
      );

      targetOpacity = interpolate(
        distance,
        [0, range],
        [1, 0.8], // Even more solid
        Extrapolation.CLAMP
      );

      // Subtle lift - reduced from -10 to -6 to avoid clipping
      targetTranslateY = interpolate(
        distance,
        [0, range],
        [-6, 0],
        Extrapolation.CLAMP
      );
    }

    return {
      transform: [
        {
          scale: withSpring(targetScale * pressedScale.value, {
            damping: 18,
            stiffness: 150,
          })
        },
        {
          translateY: withSpring(targetTranslateY, {
            damping: 18,
            stiffness: 150,
          })
        }
      ],
      opacity: targetOpacity,
    };
  });




  const dateStr = new Date(pin.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
  });

  const isDark = currentTheme.colors.background === '#111118';

  const cardHeight = cardWidth * 1.2;

  return (
    <Animated.View style={[{ width: cardWidth, marginRight: cardSpacing }, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          cardStyles.container,
          {
            height: cardHeight,
            backgroundColor: isDark ? '#1a1a24' : '#f8fafc',
            borderColor: meta.color + '20',
            borderWidth: 1.5
          }
        ]}
      >
        {/* Background Image */}
        {imgUrl ? (
          <Image source={imgUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: meta.color + '10', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="mic-outline" size={60} color={meta.color + '30'} />
          </View>
        )}

        {/* Top Mood Badge */}
        <View style={[cardStyles.moodBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
          <Text style={[cardStyles.moodBadgeText, { color: '#334155' }]}>{meta.vi}</Text>
        </View>

        {/* Bottom Info Gradient Overlay */}
        <View style={cardStyles.infoContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
            locations={[0, 0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={cardStyles.infoContent}>
            <View style={cardStyles.mainInfo}>
              <Text style={[cardStyles.contentTitle, { color: '#FFFFFF' }]} numberOfLines={1}>
                {pin.content || 'Ghi âm mới'}
              </Text>
              <Text style={[cardStyles.locationText, { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={2}>
                {pin.address ?? 'Không rõ địa điểm'}
              </Text>
            </View>

            <View style={cardStyles.statsContainer}>
              <View style={cardStyles.statBox}>
                <View style={cardStyles.statIconRow}>
                  <Ionicons name="play-circle-outline" size={16} color="rgba(255,255,255,0.6)" />
                  <Text style={[cardStyles.statLabel, { color: 'rgba(255,255,255,0.5)' }]}>Lượt nghe</Text>
                </View>
                <Text style={[cardStyles.statValue, { color: '#FFFFFF' }]}>{pin.listensCount ?? 0}</Text>
              </View>

              <View style={cardStyles.statDivider} />

              <View style={cardStyles.statBox}>
                <View style={cardStyles.statIconRow}>
                  <Ionicons name="heart-outline" size={16} color="rgba(255,255,255,0.6)" />
                  <Text style={[cardStyles.statLabel, { color: 'rgba(255,255,255,0.5)' }]}>Cảm xúc</Text>
                </View>
                <Text style={[cardStyles.statValue, { color: '#FFFFFF' }]}>{pin.reactionsCount ?? 0}</Text>
              </View>
            </View>
          </View>

          <View style={cardStyles.footer}>
            <Text style={[cardStyles.footerText, { color: 'rgba(255,255,255,0.4)' }]}>
              By <Text style={{ fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>Whisper</Text> • {dateStr}
            </Text>
          </View>
        </View>



      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: 36,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 30
  },
  moodBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '52%', // Increased height for better gradient transition
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  infoContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainInfo: {
    flex: 1,
    paddingRight: 12,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -10,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
