import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { BlurView } from 'expo-blur';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useDerivedValue,
  useAnimatedProps
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

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

  const blurProps = useAnimatedProps(() => {
    const range = cardWidth;
    const intensity = interpolate(
      distanceVal.value,
      [0, range / 2, range],
      [0, 0, 12], // Blur starts appearing after half distance
      Extrapolation.CLAMP
    );
    return { intensity };
  });

  const dateStr = new Date(pin.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
  });

  const isDark = currentTheme.colors.background === '#111118';

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
            backgroundColor: isDark ? 'rgba(31, 31, 46, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            borderColor: meta.color + '30',
            borderWidth: 1.5
          }
        ]}
      >
        <BlurView 
          intensity={isDark ? 40 : 60} 
          tint={isDark ? 'dark' : 'light'} 
          style={StyleSheet.absoluteFill} 
        />

        <View style={[cardStyles.moodBadge, { backgroundColor: meta.color + '25', borderColor: meta.color + '40', borderWidth: 1 }]}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <Ionicons name={meta.icon} size={16} color={meta.color} />
        </View>

        {imgUrl ? (
          <View style={cardStyles.imageContainer}>
            <Image source={{ uri: imgUrl }} style={[cardStyles.image, { height: cardWidth * 0.6 }]} />
            <View style={[cardStyles.imageOverlay, { backgroundColor: meta.color + '10' }]} />
          </View>
        ) : (
          <View style={[cardStyles.image, cardStyles.imagePlaceholder, { height: cardWidth * 0.6, backgroundColor: meta.color + '10' }]}>
            <Ionicons name="mic-outline" size={40} color={meta.color + '40'} />
          </View>
        )}

        <View style={cardStyles.info}>
          <View style={cardStyles.tagRow}>
            <View style={[cardStyles.emotionTag, { backgroundColor: meta.color + '15' }]}>
              <Text style={[cardStyles.emotionText, { color: meta.color }]}>{meta.vi}</Text>
            </View>
            <Text style={cardStyles.dateText}>{dateStr}</Text>
          </View>

          <Text style={[cardStyles.content, { color: currentTheme.colors.text }]} numberOfLines={2}>
            {pin.content || 'Ghi âm mới'}
          </Text>

          <View style={cardStyles.metaRow}>
            <Ionicons name="location-sharp" size={14} color={meta.color} />
            <Text style={[cardStyles.metaText, { color: isDark ? '#a1a1aa' : '#71717a' }]} numberOfLines={1}>
              {pin.address ?? 'Không rõ địa điểm'}
            </Text>
          </View>

          <View style={cardStyles.separator} />

          <View style={cardStyles.bottomRow}>
            <View style={cardStyles.statsGroup}>
              <View style={cardStyles.statItem}>
                <Ionicons name="play-circle-outline" size={14} color={isDark ? '#a1a1aa' : '#71717a'} />
                <Text style={cardStyles.statNum}>{pin.listensCount ?? 0}</Text>
              </View>
              <View style={[cardStyles.statItem, { marginLeft: 12 }]}>
                <Ionicons name="heart-outline" size={14} color={isDark ? '#a1a1aa' : '#71717a'} />
                <Text style={cardStyles.statNum}>{pin.reactionsCount ?? 0}</Text>
              </View>
            </View>
            
            <View style={[cardStyles.actionIcon, { backgroundColor: meta.color }]}>
              <Ionicons name="play" size={12} color="#fff" />
            </View>
          </View>
        </View>

        {/* Dynamic blur for out-of-focus cards */}
        <AnimatedBlurView 
          animatedProps={blurProps}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          tint={isDark ? 'dark' : 'light'}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  container: { 
    borderRadius: 32, 
    overflow: 'hidden', 
    elevation: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 24 
  },
  moodBadge: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    zIndex: 10, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden'
  },
  imageContainer: { width: '100%', overflow: 'hidden' },
  image: { width: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { padding: 20 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  emotionTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  emotionText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  content: { fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 8, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaText: { fontSize: 13, flex: 1, fontWeight: '600' },
  separator: { height: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginBottom: 14 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsGroup: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNum: { fontSize: 14, color: '#94a3b8', fontWeight: '700' },
  actionIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
