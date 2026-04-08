import { VoicePin } from "@/types";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Alert } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { authApis, endpoints } from "@/configs/Apis";

import { REACTION_TYPES } from "./VoicePinConstants";

export function useVoicePinTurntable(pin: VoicePin, autoPlay: boolean) {
  const player = useAudioPlayer(pin.audioUrl);
  const { playing } = useAudioPlayerStatus(player);

  const [reactionCount, setReactionCount] = useState(pin.reactionsCount ?? 0);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const reactionAnim = useRef(new Animated.Value(0)).current;
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; type: string }[]>([]);

  const [isThinking, setIsThinking] = useState(false);
  const [transcription, setTranscription] = useState(pin.transcription);
  const [showTranscription, setShowTranscription] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const armAnim = useRef(new Animated.Value(0)).current;
  const rotationProgress = useRef(0);
  const isPlayingRef = useRef(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    isPlayingRef.current = playing;

    const startRotation = (startValue: number) => {
      if (!isPlayingRef.current) return;

      const duration = 6000 * (1 - startValue);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && isPlayingRef.current) {
          rotateAnim.setValue(0);
          startRotation(0);
        }
      });
    };

    if (playing) {
      Animated.timing(armAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      startRotation(rotationProgress.current);
    } else {
      rotateAnim.stopAnimation((v) => {
        rotationProgress.current = v;
      });
      Animated.timing(armAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }
  }, [armAnim, playing, rotateAnim]);

  useEffect(() => {
    if (autoPlay && player) {
      player.play();
    }
  }, [autoPlay, player]);

  useEffect(() => {
    setReactionCount(pin.reactionsCount ?? 0);
    setUserReaction(null);
    setShowReactions(false);
    reactionAnim.setValue(0);
    setFloatingEmojis([]);
    setIsThinking(false);
    setTranscription(pin.transcription);
    setShowTranscription(false);
  }, [pin.id, pin.reactionsCount, pin.transcription, reactionAnim]);

  const fetchReaction = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const api = authApis(token);
      const res = await api.get(endpoints.reactionSummary(pin.id));
      if (res.data) {
        setReactionCount(res.data.total);
        setUserReaction(res.data.userReaction);
      }
    } catch (err) {
      console.log("Error fetching reaction summary", err);
    }
  };

  useEffect(() => {
    fetchReaction();
  }, [pin.id]);

  const fireVibe = (type: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingEmojis((prev) => [...prev, { id, type }]);
    
    // Haptics
    switch (type) {
      case "LIGHT_TAP":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "EMPATHY":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "RELAX":
        // Subtle or none
        break;
      case "STRONG":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  };

  const removeFloatingEmoji = (id: string) => {
    setFloatingEmojis((prev) => prev.filter((emoji) => emoji.id !== id));
  };

  const handleReaction = async (type: string | null) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để thả tim.");
      return;
    }

    const api = authApis(token);

    try {
      if (type === null || (userReaction === type && type === "LIKE")) {
        setReactionCount((prev) => Math.max(0, prev - 1));
        setUserReaction(null);
        await api.delete(endpoints.reactionDelete(pin.id));
        return;
      }

      const isChanging = userReaction !== null;
      setUserReaction(type);
      if (!isChanging) {
        setReactionCount((prev) => prev + 1);
      }

      fireVibe(type);

      await api.post(endpoints.reaction, { voicePinId: pin.id, type });
    } catch (err) {
      console.log("Error reacting", err);
      Alert.alert("Lỗi", "Không thể thả tim. Vui lòng thử lại sau.");
    }
  };

  const toggleReactions = () => {
    if (showReactions) {
      Animated.spring(reactionAnim, { toValue: 0, useNativeDriver: true }).start(() => {
        setShowReactions(false);
      });
      return;
    }

    setShowReactions(true);
    Animated.spring(reactionAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleToggleTranscription = async () => {
    if (!showTranscription) {
      if (!transcription) {
        setIsThinking(true);
        try {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            const api = authApis(token);
            const res = await api.get(endpoints.voiceDetail(pin.id));
            if (res.data?.data?.transcription) {
              setTranscription(res.data.data.transcription);
            }
          }
        } catch (err) {
          console.log("Error fetching transcription", err);
        } finally {
          setIsThinking(false);
          setShowTranscription(true);
        }
      } else {
        setShowTranscription(true);
      }
    } else {
      setShowTranscription(false);
    }
  };

  useEffect(() => {
    const triggerDiscovery = async () => {
      if (pin.type === "HIDDEN_AR" || pin.type?.toString() === "HIDDEN_AR") {
        try {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            const api = authApis(token);
            await api.post(endpoints.voiceDiscover(pin.id));
          }
        } catch (e) {
          console.log("Internal discovery attempt:", e);
        }
      }
    };

    if (autoPlay) {
      triggerDiscovery();
    }
  }, [autoPlay, pin.id, pin.type]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const armRotate = armAnim.interpolate({ inputRange: [0, 1], outputRange: ["-10deg", "5deg"] });

  return {
    player,
    playing,
    reactionCount,
    userReaction,
    showReactions,
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
    fireVibe,
    removeFloatingEmoji,
    handleToggleTranscription,
  };
}
