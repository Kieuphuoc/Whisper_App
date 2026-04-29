import { VoicePin } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { theme } from "@/constants/Theme";
import { AddToAlbumSheet } from "@/components/album/AddToAlbumSheet";
import { FloatingVibe } from "./voice-pin/FloatingVibe";
import { ReactionPicker } from "./voice-pin/ReactionPicker";
import { ReportModal } from "./voice-pin/ReportModal";
import { useVoicePinReport } from "./voice-pin/useVoicePinReport";
import { useVoicePinTurntable } from "./voice-pin/useVoicePinTurntable";
import { Easing as ReanimatedEasing } from "react-native-reanimated";
import { View as MotiView, AnimatePresence } from "moti";
import { Text } from "../ui/text";
import { VinylRecord } from "./voice-pin/VinylRecord";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width * 0.92, 430);
const CARD_MAX_HEIGHT = Math.min(height * 0.88, 820);

export default function VoicePinTurntable({
  pin,
  onClose,
  autoPlay = false,
}: {
  pin: VoicePin;
  onClose: () => void;
  autoPlay?: boolean;
}) {
  const colorScheme = useColorScheme() || "dark";
  const currentTheme = theme[colorScheme];
  const router = useRouter();

  const [isClosing, setIsClosing] = useState(false);
  const [showAddToAlbum, setShowAddToAlbum] = useState(false);



  const {
    player,
    playing,
    reactionCount,
    userReaction,
    reactionAnim,
    floatingEmojis,
    isThinking,
    transcription,
    showTranscription,
    overlayOpacity,
    cardScale,
    cardTranslateY,
    spin,
    armRotate,
    handleReaction,
    toggleReactions,
    removeFloatingEmoji,
    handleToggleTranscription,
  } = useVoicePinTurntable(pin, autoPlay);

  const {
    showReportModal,
    setShowReportModal,
    reportLoading,
    handleReport,
  } = useVoicePinReport(pin.id);

  useEffect(() => {
    overlayOpacity.setValue(0);
    cardScale.setValue(0.92);
    cardTranslateY.setValue(20);
    setIsClosing(false);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardScale, cardTranslateY, overlayOpacity, pin.id]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 20,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity, backgroundColor: colorScheme === 'dark' ? "rgba(15, 23, 42, 0.55)" : "rgba(255, 255, 255, 0.4)" }]}>
        <BlurView intensity={50} tint={colorScheme === 'dark' ? "light" : "light"} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity: overlayOpacity,
              transform: [
                { translateY: cardTranslateY },
                { scale: cardScale },
              ],
            },
          ]}
        >

          <View style={styles.playerStage}>
            <VinylRecord
              pin={pin}
              playing={playing}
              spin={spin}
              armRotate={armRotate}
              verticalDateLabel={new Date(pin.createdAt || new Date()).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join(' . ')}
              onPress={() => {
                if (!player) return;
                playing ? player.pause() : player.play();
              }}
              onTranscriptionToggle={handleToggleTranscription}
              onReportPress={() => setShowReportModal(true)}
              onAlbumPress={() => setShowAddToAlbum(true)}
              onReactionPress={toggleReactions}
              onReactionSelect={handleReaction}
              userReaction={userReaction}
              reactionCount={reactionCount}
              isThinking={isThinking}
              showTranscription={showTranscription}
              theme={currentTheme}
            />
          </View>

          {/* Transcription Section */}
          <View style={styles.transcriptionContainer}>
            <AnimatePresence>
              {showTranscription && transcription && (
                <MotiView
                  key="transcription-text"
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: 5, scale: 0.98 }}
                  transition={{ type: 'timing', duration: 250 }}
                  style={[styles.transcriptionBox, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.primary + '44' }]}
                >
                  <Text style={[styles.transcriptionText, { color: currentTheme.colors.primary }]}>
                    {transcription}
                  </Text>
                </MotiView>
              )}

              {showTranscription && !transcription && !isThinking && (
                <MotiView
                  key="transcription-empty"
                  from={{ opacity: 0, translateY: 5 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: 5 }}
                  transition={{ type: 'timing', duration: 250 }}
                  style={styles.noTranscriptionBox}
                >
                  <Text style={[styles.noTranscriptionText, { color: currentTheme.colors.textMuted || "#64748B" }]}>
                    Chưa có bản phiên âm cho âm thanh này.
                  </Text>
                </MotiView>
              )}
            </AnimatePresence>
          </View>
        </Animated.View>

        {floatingEmojis.map((f) => (
          <FloatingVibe
            key={f.id}
            type={f.type}
            onComplete={() => removeFloatingEmoji(f.id)}
          />
        ))}

        <ReactionPicker
          reactionAnim={reactionAnim}
          toggleReactions={toggleReactions}
          handleReaction={handleReaction}
          theme={currentTheme}
        />
      </Animated.View>

      <ReportModal
        isVisible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={handleReport}
        reportLoading={reportLoading}
        theme={currentTheme}
      />

      <AddToAlbumSheet
        visible={showAddToAlbum}
        pinId={pin.id}
        onDismiss={() => setShowAddToAlbum(false)}
        onAdded={() => setShowAddToAlbum(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10000,
  },
  cardWrap: {
    width: CARD_WIDTH,
    maxHeight: CARD_MAX_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  playerStage: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 2,
  },
  transcriptionContainer: {
    marginTop: 12,
    marginBottom: 4,
    width: '100%',
    paddingHorizontal: 20,
  },
  transcriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  transcriptionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transcriptionBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  noTranscriptionBox: {
    marginTop: 8,
    paddingHorizontal: 12,
  },
  noTranscriptionText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});