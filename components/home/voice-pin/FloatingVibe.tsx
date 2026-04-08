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
      case "LIGHT_TAP":
        return (
          <>
            <Animated.View style={[styles.ripple, { 
              transform: [{ scale }], 
              opacity,
              borderColor: "rgba(255, 255, 255, 0.8)",
              borderWidth: 1,
            }]} />
            <Animated.View style={[styles.ripple, { 
              transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) }], 
              opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.8, 0] }),
              borderColor: "rgba(255, 255, 255, 0.4)",
              borderWidth: 0.5,
            }]} />
          </>
        );
      case "EMPATHY":
        return (
          <>
            <Animated.View style={[styles.ripple, { 
              transform: [{ scale }], 
              opacity,
              borderColor: "#a78bfa",
              borderWidth: 2,
            }]} />
             <Animated.View style={[styles.ripple, { 
              transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) }], 
              opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.4, 0] }),
              borderColor: "#7c3aed",
              borderWidth: 1,
              borderStyle: "dashed",
            }]} />
          </>
        );
      case "RELAX":
        return (
          <Animated.View style={[styles.blurEffect, { 
            transform: [{ scale: scale.interpolate({ inputRange: [0.5, 2], outputRange: [0.8, 1.5] }) }], 
            opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] }),
          }]}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          </Animated.View>
        );
      case "STRONG":
        return (
          <Animated.View style={[styles.glowPulse, { 
            transform: [{ scale }], 
            opacity,
            backgroundColor: "rgba(124, 58, 237, 0.4)",
            shadowColor: "#7c3aed",
            shadowRadius: 30,
            shadowOpacity: 0.8,
            elevation: 20,
          }]} />
        );
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
