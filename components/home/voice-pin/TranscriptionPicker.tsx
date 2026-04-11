import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { View as MotiView, AnimatePresence } from 'moti';
import { Text } from '../../ui/text';

interface TranscriptionPickerProps {
  visible: boolean;
  text: string | null | undefined;
  isThinking: boolean;
  theme: any;
}

export function TranscriptionPicker({ visible, text, isThinking, theme }: TranscriptionPickerProps) {
  const isDark = theme.colors.background === "#0a0a14" || theme.colors.text === "#f1f5f9";

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          exit={{ opacity: 0, scale: 0.9, translateY: 10 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.container}
        >
          <BlurView 
            intensity={isDark ? 50 : 70} 
            tint={isDark ? "dark" : "light"} 
            style={[
              styles.blur, 
              { 
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                backgroundColor: isDark ? 'rgba(10, 16, 28, 0.8)' : 'rgba(255, 255, 255, 0.85)',
              }
            ]}
          >
            {isThinking ? (
              <View style={styles.thinkingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.thinkingText, { color: isDark ? "#A3A3A3" : "#64748B" }]}>
                  Đang xử lý phiên âm...
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.text, { color: isDark ? "#F5F5F4" : "#1E293B" }]}>
                  {text || "Không có phiên âm cho đoạn hội thoại này."}
                </Text>
              </ScrollView>
            )}
          </BlurView>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 150,
    width: "85%",
    maxWidth: 400,
    alignSelf: "center",
    zIndex: 2000,
  },
  blur: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 180,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  thinkingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});
