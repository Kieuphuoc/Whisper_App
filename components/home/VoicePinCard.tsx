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
import { VinylRecord } from "./voice-pin/VinylRecord";

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
    cardScale.setValue(0.94);
    cardTranslateY.setValue(18);
    setIsClosing(false);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 18,
        stiffness: 260,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
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
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.97,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 10,
        duration: 180,
        easing: Easing.in(Easing.quad),
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
              transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
            },
          ]}
        >
          <View style={styles.playerStage}>
            <VinylRecord
              pin={pin}
              playing={playing}
              spin={spin}
              armRotate={armRotate}
               onPress={() => (playing ? player.pause() : player.play())}
               onTranscriptionToggle={handleToggleTranscription}
               onReportPress={() => setShowReportModal(true)}
               onAlbumPress={() => setShowAddToAlbum(true)}
               onReactionPress={toggleReactions}
               onReactionSelect={handleReaction}
               isThinking={isThinking}
               showTranscription={showTranscription}
               theme={currentTheme}
             />
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
});