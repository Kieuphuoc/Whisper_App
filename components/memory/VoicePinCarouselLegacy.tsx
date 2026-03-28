import { VoicePin } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { VoicePinCarouselCardLegacy } from './VoicePinCarouselCardLegacy';

const { width } = Dimensions.get('window');

export const PAGE_PADDING = 24;
export const DEFAULT_CARD_SPACING = 2;
export const DEFAULT_CARD_WIDTH = (width - PAGE_PADDING - DEFAULT_CARD_SPACING) / 1.5;

interface VoicePinCarouselLegacyProps {
  title: string;
  subtitle?: string;
  pins: VoicePin[];
  onSelectPin: (pin: VoicePin) => void;
  onSeeAll?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  currentTheme: any;
  limit?: number;
  cardWidth?: number;
  cardSpacing?: number;
  emptyText?: string;
}

export default function VoicePinCarouselLegacy({
  title,
  subtitle,
  pins,
  onSelectPin,
  onSeeAll,
  icon = 'mic-outline',
  iconColor = '#8b5cf6',
  currentTheme,
  limit = 10,
  cardWidth = DEFAULT_CARD_WIDTH,
  cardSpacing = DEFAULT_CARD_SPACING,
  emptyText = 'Chưa có ký ức nào'
}: VoicePinCarouselLegacyProps) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const displayPins = useMemo(() => {
    if (limit && pins.length > limit) {
      return pins.slice(0, limit);
    }
    return pins;
  }, [pins, limit]);

  const snapToOffsets = useMemo(() => {
    const offsets = [0];
    const itemSize = cardWidth + cardSpacing;
    const centerOffset = (width - cardWidth) / 2;
    for (let i = 1; i < displayPins.length; i++) {
      offsets.push(i * itemSize + PAGE_PADDING - centerOffset);
    }
    return offsets;
  }, [displayPins.length, cardWidth, cardSpacing]);

  if (pins.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconDot, { backgroundColor: iconColor + '18' }]}>
              <Ionicons name={icon} size={16} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>{title}</Text>
          </View>
        </View>
        <View style={styles.emptyContent}>
          <Text style={{ color: currentTheme.colors.icon, fontSize: 14 }}>{emptyText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconDot, { backgroundColor: iconColor + '18' }]}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
          <View>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, { color: currentTheme.colors.icon }]}>{subtitle}</Text>}
          </View>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: currentTheme.colors.primary }]}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={16} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        data={displayPins}
        horizontal
        keyExtractor={p => String(p.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: PAGE_PADDING,
          paddingTop: 12,
          paddingBottom: 20
        }}
        snapToOffsets={snapToOffsets}
        decelerationRate="fast"
        snapToAlignment="start"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <VoicePinCarouselCardLegacy
            pin={item}
            onPress={() => onSelectPin(item)}
            index={index}
            scrollX={scrollX}
            currentTheme={currentTheme}
            cardWidth={cardWidth}
            cardSpacing={cardSpacing}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: 14, fontWeight: '700' },
  emptyContainer: { marginBottom: 24 },
  emptyContent: { paddingHorizontal: 24, paddingVertical: 12 },
});
