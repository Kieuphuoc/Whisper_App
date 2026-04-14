import React from "react";
import { Animated, TouchableOpacity, StyleSheet } from "react-native";
import { View as MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../ui/text";
import { REACTION_TYPES } from "./VoicePinConstants";

interface ReactionPickerProps {
  reactionAnim: Animated.Value;
  toggleReactions: () => void;
  handleReaction: (type: string) => void;
  theme: any;
}

export function ReactionPicker({ reactionAnim, toggleReactions, handleReaction, theme }: ReactionPickerProps) {
  const isDark = theme.colors.background === "#0a0a14" || theme.colors.text === "#f1f5f9";

  return (
    <Animated.View style={[styles.reactionPicker, {
      transform: [
        { scale: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
        { translateY: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
      ],
      opacity: reactionAnim,
      backgroundColor: isDark ? 'rgba(10, 16, 28, 0.94)' : 'rgba(255, 255, 255, 0.96)',
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
    }]}>
      {REACTION_TYPES.map((r, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => { toggleReactions(); handleReaction(r.type); }}
          style={[styles.reactionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          activeOpacity={0.6}
        >
          <MotiView
            from={{ scale: 0, translateY: 25, opacity: 0 }}
            animate={{ scale: 1, translateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: index * 60 }}
            style={styles.reactionBtnInner}
          >
            <MotiView
              animate={{
                scale: [1, 1.25, 1],
              }}
              transition={{
                loop: true,
                duration: 2000,
                delay: index * 200,
              }}
            >
              <Ionicons name={r.icon as any} size={26} color={r.color} />
            </MotiView>
            <Text style={[styles.reactionLabel, { color: r.color, opacity: 0.9 }]}>{r.label}</Text>
          </MotiView>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  reactionPicker: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 28,
    borderWidth: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 2000,
    gap: 8,
  },
  reactionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
  },
  reactionBtnInner: {
    alignItems: 'center',
    gap: 4,
  },
  reactionLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
