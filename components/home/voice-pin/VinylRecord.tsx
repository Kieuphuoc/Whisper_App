import React, { useState, useMemo } from "react";
import { View, Animated, TouchableOpacity, Image, ImageBackground, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View as MotiView, AnimatePresence } from "moti";
import { Text } from "../../ui/text";
import { BASE_URL } from "@/configs/Apis";
import { EMOTION_COLORS } from "@/constants/Emotions";
import { WavyRipple } from "./WavyRipple";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import AnimatedRE, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  cancelAnimation,
  runOnJS,
  useDerivedValue,
  useAnimatedReaction,
  Easing as ReanimatedEasing
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ReactionRadialMenu } from "./ReactionRadialMenu";
import { REACTION_TYPES } from "./VoicePinConstants";
import { Visibility } from "@/types";

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
  onReactionSelect?: (type: string) => void;
  userReaction?: string | null;
  reactionCount?: number;
  theme: any;
  isCreationMode?: boolean;
  visibility?: Visibility;
  onVisibilityChange?: (v: Visibility) => void;
  onPost?: () => void;
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
  onReactionSelect,
  userReaction,
  reactionCount,
  theme,
  isCreationMode,
  visibility,
  onVisibilityChange,
  onPost,
}: VinylRecordProps) {
  const router = useRouter();
  const isDark = theme.colors.background === "#0a0a14" || theme.colors.text === "#f1f5f9";

  // Bloom state for visibility
  const [bloomVisible, setBloomVisible] = useState(false);
  const [radialVisibleState, setRadialVisibleState] = useState(false);

  const rawArtworkUri = pin.images?.[0]?.imageUrl ?? pin.imageUrl;
  const artworkUri = useMemo(() => {
    if (!rawArtworkUri) return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80";
    if (rawArtworkUri.startsWith("http") || rawArtworkUri.startsWith("file://") || rawArtworkUri.startsWith("ph://")) {
      return rawArtworkUri;
    }
    return `${BASE_URL}${rawArtworkUri.startsWith("/") ? "" : "/"}${rawArtworkUri}`;
  }, [rawArtworkUri]);

  const emotionColor = pin.emotionLabel ? EMOTION_COLORS[pin.emotionLabel as keyof typeof EMOTION_COLORS] || "#7c3aed" : theme.colors.primary;

  const formattedDate = useMemo(() => {
    if (!pin.createdAt) return "";
    try {
      const date = new Date(pin.createdAt);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return "";
    }
  }, [pin.createdAt]);

  // Gesture State
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const activeReaction = useSharedValue<string | null>(null);

  const radialGesture = useMemo(() => Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart(() => {
      runOnJS(setRadialVisibleState)(true);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;

      const dist = Math.sqrt(e.translationX ** 2 + e.translationY ** 2);
      if (dist > 40) {
        let angle = Math.atan2(e.translationY, e.translationX) * (180 / Math.PI);
        angle = (angle + 360 + 90) % 360;

        const step = 360 / REACTION_TYPES.length;
        const index = Math.round(angle / step) % REACTION_TYPES.length;

        const newReaction = REACTION_TYPES[index].type;
        if (activeReaction.value !== newReaction) {
          activeReaction.value = newReaction;
          runOnJS(Haptics.selectionAsync)();
        }
      } else {
        activeReaction.value = null;
      }
    })
    .onEnd(() => {
      if (activeReaction.value && onReactionSelect) {
        runOnJS(onReactionSelect)(activeReaction.value);
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      }
      runOnJS(setRadialVisibleState)(false);
      dragX.value = 0;
      dragY.value = 0;
      activeReaction.value = null;
    }), [onReactionSelect]);

  const tapGesture = useMemo(() => Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)();
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }), [onPress]);

  const composedGesture = useMemo(() => Gesture.Exclusive(radialGesture, tapGesture), [radialGesture, tapGesture]);

  const rotation = useSharedValue(0);
  React.useEffect(() => {
    if (playing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 6000, easing: ReanimatedEasing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [playing]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  const handleBloomToggle = () => {
    setBloomVisible(!bloomVisible);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelection = (v: Visibility) => {
    if (onVisibilityChange) onVisibilityChange(v);
    setBloomVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.playerContainer, { backgroundColor: isDark ? "#121212" : "#FFFFFF" }, isCreationMode && { elevation: 0, shadowOpacity: 0 }]}>
      {/* Top Row: Re-enabled for Creation Mode with customizations */}
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

        {formattedDate ? (
          <View style={styles.emotionTagCenter}>
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.emotionTagPill}>
              {pin.status && pin.status !== 'APPROVED' ? (
                <>
                  <Ionicons
                    name={pin.status === 'REJECTED' ? 'alert-circle' : 'time'}
                    size={10}
                    color={pin.status === 'REJECTED' ? '#EF4444' : '#F59E0B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.emotionTagText, { color: pin.status === 'REJECTED' ? '#EF4444' : '#F59E0B' }]}>
                    {pin.status === 'REJECTED' ? 'Bị từ chối' : 'Đang duyệt'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="calendar-outline"
                    size={10}
                    color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.emotionTagText, { color: isDark ? "#F5F5F4" : "#1E293B" }]}>
                    {formattedDate}
                  </Text>
                </>
              )}
            </BlurView>
          </View>
        ) : null}

        {/* Stats hidden in creation mode */}
        {/* Stats hidden temporarily */}
        {/* {!isCreationMode && (
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
        )} */}
      </View>

      <View style={styles.recordStage}>
        <WavyRipple
          isPlaying={playing}
          color={emotionColor}
          emotionLabel={pin.emotionLabel}
        />
        <GestureDetector gesture={composedGesture}>
          <AnimatedRE.View collapsable={false}>
            <AnimatedRE.View style={[styles.vinylPlate, discStyle]}>
              <View style={styles.vinylBlackDisk}>
                <ImageBackground
                  source={{ uri: artworkUri }}
                  style={styles.diskArtwork}
                  imageStyle={styles.diskArtworkImage}
                >
                  <View style={styles.recordSpindle} />
                </ImageBackground>
              </View>
            </AnimatedRE.View>
          </AnimatedRE.View>
        </GestureDetector>

        {!isCreationMode && (
          <ReactionRadialMenu
            visible={radialVisibleState}
            dragX={dragX}
            dragY={dragY}
            activeReaction={activeReaction}
            isDark={isDark}
            theme={theme}
          />
        )}
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
        <View style={styles.userProfileGlass}>
          <TouchableOpacity
            onPress={() => {
              if (pin.user?.id) {
                router.push({ pathname: '/user/[id]', params: { id: pin.user.id.toString() } });
              }
            }}
            activeOpacity={0.7}
            style={styles.userProfileSection}
          >
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={styles.avatarOuter}
            >
              <Image
                source={pin.user?.avatar ? { uri: pin.user.avatar.startsWith('http') ? pin.user.avatar : `${BASE_URL}${pin.user.avatar.startsWith('/') ? '' : '/'}${pin.user.avatar}` } : require('@/assets/images/avatar.png')}
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
                {pin.status === 'REJECTED' && pin.moderationReason 
                  ? `Lý do: ${pin.moderationReason}` 
                  : (pin.user?.bio || pin.emotionLabel || "Tap record to play")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsGroup}>
          {isCreationMode ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Bloom Visibility Menu */}
              <AnimatePresence>
                {bloomVisible && (
                  <MotiView
                    from={{ opacity: 0, scale: 0, translateX: 20 }}
                    animate={{ opacity: 1, scale: 1, translateX: 0 }}
                    exit={{ opacity: 0, scale: 0, translateX: 10 }}
                    transition={{ type: 'spring', damping: 15 }}
                    style={styles.bloomContainer}
                  >
                    <TouchableOpacity onPress={() => handleSelection('PUBLIC')} style={styles.bloomIcon}>
                      <Ionicons name="earth-outline" size={16} color={visibility === 'PUBLIC' ? theme.colors.primary : "#94a3b8"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleSelection('FRIENDS')} style={styles.bloomIcon}>
                      <Ionicons name="people-outline" size={16} color={visibility === 'FRIENDS' ? theme.colors.primary : "#94a3b8"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleSelection('PRIVATE')} style={styles.bloomIcon}>
                      <Ionicons name="lock-closed-outline" size={16} color={visibility === 'PRIVATE' ? theme.colors.primary : "#94a3b8"} />
                    </TouchableOpacity>
                  </MotiView>
                )}
              </AnimatePresence>

              <TouchableOpacity
                onPress={handleBloomToggle}
                style={[styles.actionButtonContainer, bloomVisible && { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}
                activeOpacity={0.7}
              >
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.actionButtonBlur}>
                  <Ionicons
                    name={visibility === 'PUBLIC' ? 'earth-outline' : visibility === 'FRIENDS' ? 'people-outline' : 'lock-closed-outline'}
                    size={18}
                    color={bloomVisible ? theme.colors.primary : (isDark ? "#FFFFFF" : theme.colors.primary)}
                  />
                </BlurView>
              </TouchableOpacity>

              <View style={{ width: 8 }} />

              <TouchableOpacity
                onPress={onPost}
                style={styles.actionButtonContainer}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#7c3aed', '#4338ca']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={onReactionPress}
                style={styles.actionButtonContainer}
                activeOpacity={0.7}
              >
                {(() => {
                  const activeReactionObj = REACTION_TYPES.find(r => r.type === userReaction);
                  return (
                    <MotiView
                      animate={{
                        scale: userReaction ? [1, 1.15, 1] : 1,
                      }}
                      transition={{ type: 'spring', damping: 12 }}
                      style={StyleSheet.absoluteFill}
                    >
                      <LinearGradient
                        colors={activeReactionObj
                          ? [activeReactionObj.color, activeReactionObj.color]
                          : (isDark ? ['#7c3aed', '#4338ca'] : ['#8b5cf6', '#6366f1'])}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionButtonGradient}
                      >
                        <Ionicons
                          name={activeReactionObj ? (activeReactionObj.icon as any) : "heart"}
                          size={userReaction ? 18 : 16}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    </MotiView>
                  );
                })()}
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
            </>
          )}
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
  emotionTagCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: -1,
  },
  emotionTagPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    gap: 6,
  },
  emotionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emotionTagText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  recordStage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 34,
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
    borderRadius: 60,
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
    zIndex: 10,
    elevation: 20,
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
    borderWidth: 0,
  },
  userProfileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  avatarOuter: {
    width: 54,
    height: 54,
    borderRadius: 15,
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
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
  bloomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    marginRight: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bloomIcon: {
    padding: 8,
  },
});
