import React from "react";
import { View, Animated, TouchableOpacity, Image, ImageBackground, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { View as MotiView } from "moti";
import { Easing as ReanimatedEasing } from "react-native-reanimated";
import { Text } from "../../ui/text";
import { BASE_URL } from "@/configs/Apis";
import { EMOTION_COLORS } from "@/constants/Emotions";
import { WavyRipple } from "./WavyRipple";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface VinylRecordProps {
  pin: any;
  playing: boolean;
  spin: any;
  armRotate: any;
  onPress: () => void;
  onTranscriptionToggle?: () => void;
  isThinking?: boolean;
  showTranscription?: boolean;
  onReportPress?: () => void;
  onAlbumPress?: () => void;
  onReactionPress?: () => void;
  theme: any;
}

export function VinylRecord({
  pin,
  playing,
  spin,
  armRotate,
  onPress,
  onTranscriptionToggle,
  isThinking,
  showTranscription,
  onReportPress,
  onAlbumPress,
  onReactionPress,
  theme,
}: VinylRecordProps) {
  const isDark = theme.colors.background === "#0a0a14" || theme.colors.text === "#f1f5f9";
  const rawArtworkUri = pin.images?.[0]?.imageUrl ?? pin.imageUrl;
  const artworkUri = rawArtworkUri
    ? rawArtworkUri.startsWith("http")
      ? rawArtworkUri
      : `${BASE_URL}${rawArtworkUri.startsWith("/") ? "" : "/"}${rawArtworkUri}`
    : "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80";
  const emotionColor = pin.emotionLabel ? EMOTION_COLORS[pin.emotionLabel as keyof typeof EMOTION_COLORS] || "#7c3aed" : theme.colors.primary;

  return (
    <View style={[styles.playerContainer, { backgroundColor: isDark ? "#151515" : "#FFFFFF" }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={onTranscriptionToggle}
          style={[styles.deckIconButton, {
            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"
          }]}
          activeOpacity={0.75}
        >
          {isThinking ? (
            <MotiView
              from={{ rotate: "0deg" }}
              animate={{ rotate: "360deg" }}
              transition={{ loop: true, duration: 1000, type: "timing", easing: ReanimatedEasing.linear }}
            >
              <Ionicons name="sparkles" size={18} color={isDark ? "#F5F5F4" : "#475569"} />
            </MotiView>
          ) : (
            <Ionicons
              name={showTranscription ? "eye-off-outline" : "language-outline"}
              size={18}
              color={isDark ? "#F5F5F4" : "#475569"}
            />
          )}
        </TouchableOpacity>

        <View style={styles.topStatsRow}>
          <View style={[styles.statPillSmall, { 
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
          }]}>
            <Ionicons name="headset-outline" size={12} color={isDark ? theme.colors.primary : theme.colors.primary} />
            <Text style={[styles.statTextSmall, { color: isDark ? "#F5F5F4" : "#1E293B", marginLeft: 4 }]}>
              {pin.listensCount || 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.recordStage}>
        <WavyRipple
          isPlaying={playing}
          color={emotionColor}
          emotionLabel={pin.emotionLabel}
        />
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.recordTouchArea}>
          <Animated.View style={[styles.vinylPlate, { transform: [{ rotate: spin }] }]}>
            <View style={styles.vinylBlackDisk}>
              <ImageBackground
                source={{ uri: artworkUri }}
                style={styles.diskArtwork}
                imageStyle={styles.diskArtworkImage}
              >
                {/* <View style={styles.diskArtworkOverlay} />
                <View style={styles.diskGrooveRingOuter} />
                <View style={styles.diskGrooveRingMid} />
                <View style={styles.diskGrooveRingInner} />
                <View style={styles.recordCenterLabel}>
                  <Image
                    source={{ uri: artworkUri }}
                    style={styles.recordImage}
                    resizeMode="cover"
                  />
                </View> */}
                <View style={styles.recordSpindle} />
              </ImageBackground>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.tonearmContainer, { transform: [{ rotate: armRotate }] }]}
      >
        <Image
          source={require("../../../assets/images/3d_tonearm.png")}
          style={styles.tonearmImage}
        />
      </Animated.View>

      <View style={styles.statusBarRow}>
        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={styles.userProfileGlass}>
          <View style={styles.userProfileSection}>
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={[styles.avatarOuter, { borderColor: isDark ? '#fff' : '#1a1a1a' }]}
            >
              <Image
                source={{ uri: pin.user?.avatar ? (pin.user.avatar.startsWith('http') ? pin.user.avatar : `${BASE_URL}${pin.user.avatar.startsWith('/') ? '' : '/'}${pin.user.avatar}`) : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                style={styles.avatar}
              />
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 400, type: 'spring' }}
                style={[styles.levelCapsule, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.levelText}>XP {pin.user?.level || 1}</Text>
              </MotiView>
            </MotiView>

            <View style={styles.userTextInfo}>
              <Text style={[styles.profileDisplayName, { color: isDark ? "#F5F5F4" : "#1E293B" }]} numberOfLines={1}>
                {pin.user?.displayName || "Anonymous"}
              </Text>
              <Text style={[styles.profileBio, { color: isDark ? "#A3A3A3" : "#64748B" }]} numberOfLines={1}>
                {pin.user?.bio || pin.emotionLabel || "Tap record to play"}
              </Text>
            </View>
          </View>
        </BlurView>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            onPress={onReactionPress}
            style={styles.actionButtonContainer}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={isDark ? ['#7c3aed', '#4338ca'] : ['#8b5cf6', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="heart" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onAlbumPress}
            style={styles.actionButtonContainer}
            activeOpacity={0.7}
          >
            <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.actionButtonBlur}>
               <Ionicons name="library" size={16} color={isDark ? "#FFFFFF" : theme.colors.primary} />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onReportPress}
            style={styles.actionButtonContainer}
            activeOpacity={0.7}
          >
            <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.actionButtonBlur}>
              <Ionicons name="flag-outline" size={14} color={isDark ? "#FB7185" : "#E11D48"} />
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 340,
    borderRadius: 38,
    justifyContent: "center",
    position: "relative",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 16,
  },
  topRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 4,
  },
  deckIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recordStage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 34,
  },
  recordTouchArea: {
    zIndex: 1,
  },
  vinylPlate: {
    width: 236,
    height: 236,
    borderRadius: 118,
    backgroundColor: "#030303",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  vinylBlackDisk: {
    width: 226,
    height: 226,
    borderRadius: 113,
    backgroundColor: "#090909",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    overflow: "hidden",
  },
  diskArtwork: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  diskArtworkImage: {
    borderRadius: 113,
  },
  diskArtworkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  diskGrooveRingOuter: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  diskGrooveRingMid: {
    position: "absolute",
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  diskGrooveRingInner: {
    position: "absolute",
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  recordCenterLabel: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(15,23,42,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.28)",
  },
  recordImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.92)",
  },
  recordSpindle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F5F5F4",
  },
  tonearmContainer: {
    position: "absolute",
    top: 18,
    right: -4,
    height: 250,
    width: 136,
    alignItems: "center",
    zIndex: 5,
    // @ts-ignore
    transformOrigin: ["50%", "0%", 0],
  },
  tonearmImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  topStatsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  statPillSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statTextSmall: {
    fontSize: 10,
    fontWeight: "600",
  },
  userProfileGlass: {
    flex: 1,
    marginRight: 12,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  userProfileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  avatarOuter: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  levelCapsule: {
    position: 'absolute',
    top: -6,
    left: -10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  levelText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 0.3,
  },
  userTextInfo: {
    marginLeft: 10,
    flex: 1,
  },
  profileDisplayName: {
    fontSize: 13,
    fontWeight: "700",
  },
  profileBio: {
    fontSize: 10,
    fontWeight: "400",
    marginTop: 1,
  },
  statusBarRow: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  actionButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  actionButtonBlur: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
});
