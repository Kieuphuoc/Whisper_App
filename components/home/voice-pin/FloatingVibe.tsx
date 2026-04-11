import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { View as MotiView } from "moti";
import { BlurView } from "expo-blur";

export interface VibeEffectProps {
  type: string;
  onComplete: () => void;
}

export function FloatingVibe({ type, onComplete }: VibeEffectProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = type === "RELAX" ? 2000 : type === "STRONG" ? 800 : 1200;
    
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(onComplete);
  }, [onComplete, type]);

  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.6, 0.4, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, type === "STRONG" ? 3 : 2],
  });

  const renderEffect = () => {
    switch (type) {
      case "LIKE":
        return (
          <Animated.View style={[styles.ripple, { 
            transform: [{ scale }], 
            opacity,
            borderColor: "#3b82f6",
            borderWidth: 2,
          }]} />
        );
      case "LOVE":
        return (
          <>
            <Animated.View style={[styles.glowPulse, { 
              transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 3] }) }], 
              opacity,
              backgroundColor: "rgba(244, 63, 94, 0.4)",
              shadowColor: "#f43f5e",
              shadowRadius: 40,
            }]} />
            <Animated.View style={[styles.ripple, { 
              transform: [{ scale }], 
              opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
              borderColor: "#f43f5e",
              borderWidth: 3,
            }]} />
          </>
        );
      case "LAUGH":
        return (
          <Animated.View style={[styles.ripple, { 
            transform: [{ scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 2.5, 3.5] }) }], 
            opacity,
            borderColor: "#f59e0b",
            borderWidth: 1.5,
            borderStyle: "dashed",
          }]} />
        );
      case "WOW":
        return (
          <Animated.View style={[styles.glowPulse, { 
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 4] }) }], 
            opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] }),
            backgroundColor: "rgba(249, 115, 22, 0.3)",
            shadowColor: "#f97316",
            shadowRadius: 50,
          }]} />
        );
      case "LIGHT_TAP":
      case "EMPATHY":
      case "RELAX":
      case "STRONG":
        return null; // Legacy cleanup
      default:
        return null;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderEffect()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5000,
  },
  ripple: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: "absolute",
  },
  blurEffect: {
    width: 400,
    height: 400,
    borderRadius: 200,
    overflow: "hidden",
    position: "absolute",
  },
  glowPulse: {
    width: 150,
    height: 150,
    borderRadius: 75,
    position: "absolute",
  },
});
