import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
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
import { Text } from '../../ui/text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_SIZE = 260;
const ITEM_SIZE = 56;
const RADIUS = 85;

interface ReactionRadialMenuProps {
  visible: boolean;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  activeReaction: SharedValue<string | null>;
  isDark: boolean;
  theme: any;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons as any);

export function ReactionRadialMenu({ 
  visible, 
  dragX, 
  dragY, 
  activeReaction,
  isDark,
  theme 
}: ReactionRadialMenuProps) {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a18a31'},body:JSON.stringify({sessionId:'a18a31',runId:'post-fix',hypothesisId:'H6',location:'ReactionRadialMenu.tsx:43',message:'ReactionRadialMenu mounted',data:{visible},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [visible]);
  
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
    const scale = withSpring(isSelected.value ? 1.3 : 1, { damping: 12 });
    const opacity = withDelay(
      index * 40,
      withTiming(visible ? 1 : 0, { duration: 200 })
    );
    
    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale },
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

  const iconStyle = useAnimatedStyle(() => {
    return {
      color: isSelected.value ? '#FFFFFF' : reaction.color,
      transform: [
        { scale: isSelected.value ? 1.2 : 1 }
      ]
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isSelected.value ? 1 : 0),
      transform: [{ translateY: withSpring(isSelected.value ? 45 : 35) }]
    };
  });

  return (
    <Animated.View style={[styles.itemContainer, itemStyle]}>
      <AnimatedBlurView 
        intensity={isDark ? 30 : 50} 
        tint={isDark ? "dark" : "light"} 
        style={[styles.itemBlur, blurStyle]}
      >
        <Ionicons
          name={reaction.icon} 
          size={24} 
          color={isSelected.value ? '#FFFFFF' : reaction.color}
        />
      </AnimatedBlurView>
      <Animated.View style={[styles.labelContainer, labelStyle]}>
        <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.labelBlur}>
          <Text style={[styles.labelText, { color: reaction.color }]}>
            {reaction.label}
          </Text>
        </BlurView>
      </Animated.View>
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
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 120,
  },
  labelBlur: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  }
});
