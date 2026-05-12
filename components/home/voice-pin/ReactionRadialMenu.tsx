import React from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  useDerivedValue,
  SharedValue
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { REACTION_TYPES } from './VoicePinConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_SIZE = 300;
const ITEM_SIZE = 70;
const RADIUS = 98;

interface ReactionRadialMenuProps {
  visible: boolean;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  activeReaction: SharedValue<string | null>;
  isDark: boolean;
  theme: any;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export function ReactionRadialMenu({ 
  visible, 
  dragX, 
  dragY, 
  activeReaction,
  isDark,
  theme 
}: ReactionRadialMenuProps) {
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(visible ? 1 : 0, { damping: 20 }),
      transform: [
        { scale: withSpring(visible ? 1 : 0.6, { damping: 15 }) }
      ],
    };
  });

  const radialBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: withTiming(visible ? '0deg' : '-45deg', { duration: 500 }) }
      ]
    };
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
      <Animated.View style={[styles.container, containerStyle]} pointerEvents={visible ? "auto" : "none"}>
        {/* Central Indicator */}
        <Animated.View style={[
          styles.centerPoint, 
          { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]} />

        {/* Reaction Items */}
        {REACTION_TYPES.map((reaction, index) => {
          const angle = (index * (360 / REACTION_TYPES.length)) - 90; // Start from top
          const rad = (angle * Math.PI) / 180;
          const tx = RADIUS * Math.cos(rad);
          const ty = RADIUS * Math.sin(rad);

          return (
            <ReactionItem
              key={reaction.type}
              reaction={reaction}
              index={index}
              tx={tx}
              ty={ty}
              dragX={dragX}
              dragY={dragY}
              activeReaction={activeReaction}
              visible={visible}
              isDark={isDark}
              theme={theme}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

function ReactionItem({ 
  reaction, 
  index, 
  tx, 
  ty, 
  activeReaction, 
  visible,
  isDark,
  theme 
}: any) {
  
  const isSelected = useDerivedValue(() => {
    return activeReaction.value === reaction.type;
  });

  const itemStyle = useAnimatedStyle(() => {
    const opacity = withDelay(
      index * 40,
      withTiming(visible ? 1 : 0, { duration: 200 })
    );
    
    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
      ],
    };
  });

  const blurStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isSelected.value 
        ? reaction.color + '4D' // 30% opacity
        : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
      borderColor: isSelected.value 
        ? reaction.color
        : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'),
      borderWidth: isSelected.value ? 2 : 1,
    };
  });

  const reactionImageStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isSelected.value ? 1 : 0.94),
    };
  });

  return (
    <Animated.View style={[styles.itemContainer, itemStyle]}>
      <AnimatedBlurView 
        intensity={isDark ? 30 : 50} 
        tint={isDark ? "dark" : "light"} 
        style={[styles.itemBlur, blurStyle]}
      >
        {reaction.image ? (
          <AnimatedImage
            source={reaction.image}
            style={[styles.reactionImage, reactionImageStyle]}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name={reaction.icon}
            size={24}
            color={isSelected.value ? '#FFFFFF' : reaction.color}
          />
        )}
      </AnimatedBlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: MENU_SIZE,
    height: MENU_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  itemContainer: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemBlur: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectedBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7c3aed',
    opacity: 0.8,
  },
  reactionImage: {
    width: 58,
    height: 58,
  }
});
