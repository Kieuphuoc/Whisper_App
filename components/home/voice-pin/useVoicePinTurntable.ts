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
      case "LIKE":
      case "LAUGH":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "LOVE":
      case "WOW":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "SAD":
        Haptics.selectionAsync();
        break;
      case "ANGRY":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  };

  const removeFloatingEmoji = (id: string) => {
    setFloatingEmojis((prev) => prev.filter((emoji) => emoji.id !== id));
  };

  const handleReaction = async (type: string | null) => {
    // #region agent log
    fetch('http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a18a31'},body:JSON.stringify({sessionId:'a18a31',runId:'pre-fix',hypothesisId:'R1',location:'useVoicePinTurntable.ts:129',message:'handleReaction called',data:{pinId:pin.id,type:type??null,currentUserReaction:userReaction},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const token = await AsyncStorage.getItem("token");
    // #region agent log
    fetch('http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a18a31'},body:JSON.stringify({sessionId:'a18a31',runId:'pre-fix',hypothesisId:'R2',location:'useVoicePinTurntable.ts:132',message:'token loaded for reaction',data:{hasToken:!!token},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!token) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để thả tim.");
      return;
    }

    const api = authApis(token);

    try {
      if (type === null || (userReaction === type && type === "LIKE")) {
        // #region agent log
        fetch('http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a18a31'},body:JSON.stringify({sessionId:'a18a31',runId:'pre-fix',hypothesisId:'R3',location:'useVoicePinTurntable.ts:143',message:'attempt delete reaction',data:{pinId:pin.id,type:type??null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setReactionCount((prev) => Math.max(0, prev - 1));
        setUserReaction(null);
        await api.delete(endpoints.reactionDelete(pin.id));
        // #region agent log
        fetch('http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a18a31'},body:JSON.stringify({sessionId:'a18a31',runId:'pre-fix',hypothesisId:'R3',location:'useVoicePinTurntable.ts:147',message:'delete reaction success',data:{pinId:pin.id},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return;
      }

      const isChanging = userReaction !== null;
      setUserReaction(type);
      if (!isChanging) {
        setReactionCount((prev) => prev + 1);
      }

      fireVibe(type);

      // #region agent log
      fetch('http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a18a31'},body:JSON.stringify({sessionId:'a18a31',runId:'pre-fix',hypothesisId:'R4',location:'useVoicePinTurntable.ts:159',message:'attempt create/update reaction',data:{pinId:pin.id,type,isChanging},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      await api.post(endpoints.reaction, { voicePinId: pin.id, type });
      // #region agent log
      fetch('http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a18a31'},body:JSON.stringify({sessionId:'a18a31',runId:'pre-fix',hypothesisId:'R4',location:'useVoicePinTurntable.ts:162',message:'create/update reaction success',data:{pinId:pin.id,type},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch (err) {
      const e = err as any;
      // #region agent log
      fetch('http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a18a31'},body:JSON.stringify({sessionId:'a18a31',runId:'pre-fix',hypothesisId:'R5',location:'useVoicePinTurntable.ts:166',message:'reaction request failed',data:{pinId:pin.id,type:type??null,errorMessage:e?.message??String(err),status:e?.response?.status??null,responseData:e?.response?.data??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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

    // Close transcription if open
    setShowTranscription(false);
    
    setShowReactions(true);
    Animated.spring(reactionAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleToggleTranscription = async () => {
    if (!showTranscription) {
      // Close reactions if open
      if (showReactions) {
        Animated.spring(reactionAnim, { toValue: 0, useNativeDriver: true }).start(() => {
          setShowReactions(false);
        });
      }

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
          if (!transcription && !pin.transcription) {
             Alert.alert("Thông báo", "Âm thanh này chưa có bản phiên âm.");
          } else {
             setShowTranscription(true);
          }
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
