import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { VirtualPin } from './useSpiderfy';
import { BASE_URL } from '@/configs/Apis';

/** Maps AI emotion labels to display emoji. */
const EMOTION_EMOJI: Record<string, string> = {
  Happy: '😊',
  Sad: '😢',
  Angry: '😠',
  Surprised: '😲',
  Fearful: '😨',
  Disgusted: '🤢',
  Neutral: '😐',
};

const FALLBACK_EMOJI = '🎙️';

function resolveEmoji(emotionLabel?: string): string {
  if (!emotionLabel) return FALLBACK_EMOJI;
  const normalised = emotionLabel.charAt(0).toUpperCase() + emotionLabel.slice(1).toLowerCase();
  return EMOTION_EMOJI[normalised] ?? FALLBACK_EMOJI;
}

/** How long the enter spring animation lasts before we freeze tracksViewChanges. */
const ENTER_FREEZE_MS = 500;
/** Duration of exit animation in ms. */
const EXIT_DURATION_MS = 200;
/** Max stagger delay so 20+ pins still feel instant. */
const MAX_STAGGER_MS = 200;

type Props = {
  virtualPin: VirtualPin;
  /** Position in the spiral (0-based), used to stagger the enter animation. */
  index: number;
  /** When true, the marker plays its exit animation and then calls onAnimationEnd. */
  isExiting: boolean;
  onPress: () => void;
  /** Called when the exit animation fully finishes. Only wire this on the last marker. */
  onAnimationEnd?: () => void;
};

export default function SpiderfyMarker({
  virtualPin,
  index,
  isExiting,
  onPress,
  onAnimationEnd,
}: Props) {
  const { pin, displayLat, displayLng } = virtualPin;

  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const tracksTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  const staggerMs = Math.min(index * 40, MAX_STAGGER_MS);

  // ── Enter animation ──────────────────────────────────────────────────────
  useEffect(() => {
    opacity.value = withDelay(
      staggerMs,
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(
      staggerMs,
      withSpring(1, { damping: 14, stiffness: 160 }),
    );

    tracksTimer.current = setTimeout(() => {
      setTracksViewChanges(false);
    }, ENTER_FREEZE_MS + staggerMs);

    return () => {
      if (tracksTimer.current) clearTimeout(tracksTimer.current);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Exit animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isExiting) return;

    setTracksViewChanges(true);

    opacity.value = withTiming(0, { duration: EXIT_DURATION_MS, easing: Easing.in(Easing.cubic) });

    // withTiming completion callback runs on the Reanimated UI thread (worklet).
    // React setState must run on the JS thread — bridge via runOnJS.
    const jsCallback = onAnimationEnd ? runOnJS(onAnimationEnd) : undefined;
    scale.value = withTiming(
      0,
      { duration: EXIT_DURATION_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        'worklet';
        if (finished && jsCallback) jsCallback();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExiting]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const imageSource = (() => {
    const avatar = pin.user?.avatar;
    if (!avatar) return require('../assets/images/marker_hidden_voice.png');
    if (avatar.startsWith('http')) return { uri: avatar };
    return { uri: `${BASE_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}` };
  })();

  const emoji = resolveEmoji(pin.emotionLabel);
  const hasAvatar = !!pin.user?.avatar;

  return (
    <Marker
      coordinate={{ latitude: displayLat, longitude: displayLng }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
    >
      <Animated.View style={[styles.wrap, animatedStyle]}>
        {/* Glassmorphism bubble */}
        <View style={styles.bubble}>
          {hasAvatar ? (
            <Image source={imageSource} style={styles.avatar} resizeMode="cover" />
          ) : (
            <Image source={imageSource} style={styles.fallbackImage} resizeMode="contain" />
          )}
          {/* Emotion emoji badge */}
          <View style={styles.emojiBadge}>
            <Text style={styles.emojiText}>{emoji}</Text>
          </View>
        </View>
        {/* Pointer tail */}
        <View style={styles.tail} />
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  fallbackImage: {
    width: 36,
    height: 36,
  },
  emojiBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  emojiText: {
    fontSize: 11,
    lineHeight: 14,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.55)',
    marginTop: -1,
  },
});
