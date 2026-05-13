import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View, Alert, useColorScheme, ActivityIndicator, Text } from "react-native";
import { BlurView } from "expo-blur";
import MapView, { Region } from "react-native-maps";

import MapContainer from "@/components/home/MapContainer";
import VoiceButton from "@/components/home/VoiceButton";
import VoiceCameraCapture from "@/components/home/VoiceCameraCapture";
import VoiceUploadSheet from "@/components/home/VoiceUploadSheet";
import DraftsModal from "@/components/home/DraftsModal";
import { MyDispatchContext, MyUserContext } from "@/configs/Context";
import { useLocation } from "@/hooks/useLocation";
import { useRecorder } from "@/hooks/useRecorder";
import { useVisibility } from "@/hooks/useVisibility";
import { BoundingBox, useVoicePins } from "@/hooks/useVoicePins";
import { Ionicons } from "@expo/vector-icons";
import { useDiscovery } from "@/hooks/useDiscovery";
import VoicePinMiniCard from "@/components/discovery/VoicePinMiniCard";
import { VoicePin, Visibility, VoiceType } from "@/types";
import { theme } from "@/constants/Theme";
import FilterToggle from "@/components/home/Filter";
import QuickActions from "@/components/home/QuickActions";
import { useARProximity } from "@/hooks/useARProximity";
import ExploreOverlay from "@/components/voice-ar/ExploreOverlay";
import { markPromptedAR } from "@/storage/voiceARProgress";
import WalkthroughOverlay, { WalkthroughStep } from "@/components/onboarding/WalkthroughOverlay";
import { Dimensions } from "react-native";
import { useNotifications } from "@/hooks/useNotifications";
import { DraftStorage, VoiceDraft } from "@/utils/draftStorage";
// Ghost Voice tạm tắt — bật lại: mở comment import + state + VoiceUploadSheet props
// import { DEFAULT_GHOST_TTS_VOICE_ID } from "@/constants/ghostTtsVoices";
// import { DEFAULT_GHOST_ENGINE_ID, type GhostEngineId } from "@/constants/ghostEngines";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useFriends } from "@/hooks/useFriends";
import { expandBoundingBox, haversineDistanceMeters, pointInBoundingBox } from "@/utils/geo";
import { parseVoicePinFromDetailResponse } from "@/utils/parseVoiceDetail";

/** Padded viewport for pin retention (reduces churn at edges). */
const VIEWPORT_RETAIN_FACTOR = 2.35;
/** Keep pins near the user so AR proximity still works if the map is panned away. */
const USER_PIN_RETAIN_RADIUS_M = 1600;
/** Hard cap on markers in memory — native maps OOM if this grows without bound. */
const MAX_ACCUMULATED_PINS = 450;
const EMPTY_PINS: VoicePin[] = [];

function isHiddenARVoicePin(pin: VoicePin): boolean {
  return pin.type === VoiceType.HIDDEN_AR || String(pin.type) === "HIDDEN_AR";
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() || "light";
  const currentTheme = theme[colorScheme];
  const isDark = colorScheme === "dark";
  const glassSurface = isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)";
  const primaryFabColor = isDark ? "#ffffff" : currentTheme.colors.primary;
  const { location } = useLocation();
  const { visibility, setVisibility } = useVisibility("FRIENDS");
  const params = useLocalSearchParams<{ selectPinId?: string; autoPlay?: string; lat?: string; lng?: string }>();

  // Bounding box state for map-based fetching
  const [bbox, setBbox] = useState<BoundingBox | undefined>(undefined);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Aligns with useVoicePins query key (4 decimals) — skip setState when viewport cell unchanged. */
  const lastBboxKeyRef = useRef<string | null>(null);
  const currentRegionRef = useRef<Region | null>(null);

  const { data: latestPins = EMPTY_PINS, refetch, isFetching } = useVoicePins(visibility, bbox, { enabled: !!bbox });
  const [accumulatedPins, setAccumulatedPins] = useState<VoicePin[]>([]);

  // ===========================================================================
  // [TEMPORARY STRESS TEST CODE] 
  // Change 'mockCount' to test different limits (e.g., 100, 300, 450, 600, 1000)
  // Remember to remove or comment this block when finished testing!
  // ===========================================================================
  /*
  useEffect(() => {
    if (!location) return;
    const mockCount = 450; // <--- THAY ĐỔI CON SỐ NÀY ĐỂ TEST HIỆU NĂNG

    const mockData = Array.from({ length: mockCount }).map((_, i) => ({
      id: 9999 + i,
      latitude: location.coords.latitude + (Math.random() - 0.5) * 0.04,
      longitude: location.coords.longitude + (Math.random() - 0.5) * 0.04,
      audioUrl: "mock",
      content: `Stress Test Pin ${i}`,
      visibility: "PUBLIC",
      userId: 1,
      user: { username: "tester", avatar: null },
      createdAt: new Date().toISOString()
    }));

    setAccumulatedPins(mockData as any);
  }, [location]);
  */
  // ===========================================================================

  // Reset cache when changing filter
  useEffect(() => {
    setAccumulatedPins([]);
    lastBboxKeyRef.current = null;
  }, [visibility]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!latestPins && !bbox) return;

    setAccumulatedPins((prev) => {
      const pinsToProcess = latestPins || [];
      const pinMap = new Map(prev.map((p) => [p.id, p]));

      let hasChanges = false;
      if (pinsToProcess.length > 0) {
        for (const p of pinsToProcess) {
          const existing = pinMap.get(p.id);
          if (!existing) {
            pinMap.set(p.id, p);
            hasChanges = true;
          } else if (
            existing.audioDuration !== p.audioDuration ||
            existing.transcription !== p.transcription ||
            existing.status !== p.status ||
            existing.updatedAt !== p.updatedAt
          ) {
            pinMap.set(p.id, { ...existing, ...p });
            hasChanges = true;
          }
        }
      }

      let pins = Array.from(pinMap.values());

      if (bbox) {
        const expanded = expandBoundingBox(bbox, VIEWPORT_RETAIN_FACTOR);
        const uLat = location?.coords.latitude;
        const uLng = location?.coords.longitude;

        const initialCount = pins.length;
        pins = pins.filter((p) => {
          if (p.latitude == null || p.longitude == null) return true;
          if (pointInBoundingBox(p.latitude, p.longitude, expanded)) return true;
          if (uLat != null && uLng != null) {
            const d = haversineDistanceMeters(
              { latitude: uLat, longitude: uLng },
              { latitude: p.latitude, longitude: p.longitude }
            );
            if (d <= USER_PIN_RETAIN_RADIUS_M) return true;
          }
          return false;
        });

        if (!hasChanges && pins.length === initialCount && pins.length === prev.length) {
          return prev;
        }
      }

      if (pins.length > MAX_ACCUMULATED_PINS) {
        const center = bbox
          ? { latitude: (bbox.minLat + bbox.maxLat) / 2, longitude: (bbox.minLng + bbox.maxLng) / 2 }
          : location
            ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
            : { latitude: 0, longitude: 0 };
        pins = [...pins]
          .sort(
            (a, b) =>
              haversineDistanceMeters(center, { latitude: a.latitude, longitude: a.longitude }) -
              haversineDistanceMeters(center, { latitude: b.latitude, longitude: b.longitude })
          )
          .slice(0, MAX_ACCUMULATED_PINS);
      }

      if (__DEV__) {
        console.log(`[HomeScreen] BBox pins fetched: ${pinsToProcess.length}, Accumulated: ${pins.length}`);
        if (pinsToProcess.length > 0 && pins.length === 0) {
          console.warn(`[HomeScreen] All ${pinsToProcess.length} fetched pins were evicted! bbox=${JSON.stringify(bbox)}, location=${JSON.stringify(location?.coords)}`);
        }
      }

      if (!hasChanges && pins.length === prev.length && pins.every((p, i) => p.id === prev[i].id)) {
        return prev;
      }

      return pins;
    });
  }, [latestPins, bbox, location?.coords.latitude, location?.coords.longitude]);
  const dispatch = useContext(MyDispatchContext);
  const user = useContext(MyUserContext);
  const router = useRouter();

  const { location: arLocation, nearbyPin: nearbyARPin, distanceMeters: nearbyARDistance } = useARProximity(accumulatedPins);
  const [arOverlayVisible, setArOverlayVisible] = useState(false);
  const arOverlayPinIdRef = useRef<number | null>(null);
  const handledSelectParamRef = useRef<string | null>(null);

  const [pendingAudioUri, setPendingAudioUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [draftsVisible, setDraftsVisible] = useState(false);

  const [pendingTranscription, setPendingTranscription] = useState<string | null>(null);
  const [pendingEmotionLabel, setPendingEmotionLabel] = useState<string>("Bình yên");
  const [pendingVisibility, setPendingVisibility] = useState<Visibility>("FRIENDS");
  // const [pendingGhostVoice, setPendingGhostVoice] = useState(false);
  // const [pendingGhostTtsVoiceId, setPendingGhostTtsVoiceId] = useState(DEFAULT_GHOST_TTS_VOICE_ID);
  // const [pendingGhostEngine, setPendingGhostEngine] = useState<GhostEngineId>(DEFAULT_GHOST_ENGINE_ID);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (location && !bbox && !lastBboxKeyRef.current) {
      const delta = 0.01;
      const initialBbox: BoundingBox = {
        minLat: location.coords.latitude - delta / 2,
        maxLat: location.coords.latitude + delta / 2,
        minLng: location.coords.longitude - delta / 2,
        maxLng: location.coords.longitude + delta / 2,
      };

      const key = [
        initialBbox.minLat.toFixed(4),
        initialBbox.maxLat.toFixed(4),
        initialBbox.minLng.toFixed(4),
        initialBbox.maxLng.toFixed(4),
      ].join("|");

      lastBboxKeyRef.current = key;
      setBbox(initialBbox);
    }
  }, [location, bbox]);

  const { isScanning, discoveredPin, error, triggerScan } = useDiscovery();
  const [isMiniCardOpen, setIsMiniCardOpen] = useState(false);
  const [externalSelectedPin, setExternalSelectedPin] = useState<VoicePin | null>(null);
  const [autoPlayPin, setAutoPlayPin] = useState(false);
  const mapRef = useRef<MapView>(null);

  const { friends, receivedCount, refetch: refetchFriends } = useFriends();
  const { unreadCount, refetch: refetchNotifs } = useNotifications();

  const [walkthroughVisible, setWalkthroughVisible] = useState(false);
  const [walkthroughSteps, setWalkthroughSteps] = useState<WalkthroughStep[]>([]);

  useEffect(() => {
    const checkWalkthrough = async () => {
      const completed = await AsyncStorage.getItem("walkthrough_completed");
      if (completed !== "true") {
        setWalkthroughSteps([
          {
            id: 'voice',
            title: 'Ghi âm Kỷ niệm',
            description: 'Chào bạn! Tôi là Whispery. Hãy nhấn vào nút Micro lớn ở giữa để bắt đầu ghi lại những khoảnh khắc và tâm tư của bạn tại đây nhé!',
            icon: 'mic',
            targetPos: { bottom: 110, left: SCREEN_WIDTH / 2 - 36, width: 72, height: 72 }
          },
          {
            id: 'dock',
            title: 'Trung tâm Phím tắt',
            description: 'Góc trái này là nơi bạn truy cập nhanh vào Thông báo và Tin nhắn để giữ liên lạc với mọi người.',
            icon: 'grid',
            targetPos: { bottom: 110, left: 20, width: 56, height: 56 }
          },
          {
            id: 'explore',
            title: 'Khám phá Thế giới',
            description: 'Sử dụng thanh công cụ này để quét radar tìm những VoicePin ẩn giấu xung quanh bạn.',
            icon: 'compass',
            targetPos: { top: 135, left: 20, width: 68, height: 110 }
          },
          {
            id: 'recenter',
            title: 'Định vị lại',
            description: 'Nếu bạn bị lạc trên bản đồ, chỉ cần nhấn vào đây để quay lại vị trí hiện tại của mình ngay lập tức!',
            icon: 'paper-plane',
            targetPos: { bottom: 110, right: 20, width: 56, height: 56 }
          }
        ]);
        setWalkthroughVisible(true);
      }
    };
    if (user) {
      checkWalkthrough();
    }
  }, [user]);

  const finishWalkthrough = async () => {
    await AsyncStorage.setItem("walkthrough_completed", "true");
    setWalkthroughVisible(false);
  };

  useEffect(() => {
    if (error) {
      Alert.alert("Khám phá", error);
    }
  }, [error]);

  useEffect(() => {
    if (!__DEV__) return;
    if (!arLocation) return;
  }, [arLocation, accumulatedPins, nearbyARPin?.id, nearbyARDistance]);

  useEffect(() => {
    if (nearbyARPin && typeof nearbyARDistance === "number") {
      if (arOverlayPinIdRef.current !== nearbyARPin.id) {
        arOverlayPinIdRef.current = nearbyARPin.id;
        setArOverlayVisible(true);
      }
    } else {
      arOverlayPinIdRef.current = null;
      setArOverlayVisible(false);
    }
  }, [nearbyARPin, nearbyARDistance]);

  useEffect(() => {
    const selectPinId = params.selectPinId;
    if (!selectPinId) return;
    if (handledSelectParamRef.current === selectPinId) return;
    handledSelectParamRef.current = selectPinId;

    const idNum = Number(selectPinId);
    
    const findAndSelectPin = async () => {
      let target = accumulatedPins.find((p) => p.id === idNum);
      
      // If we have lat/lng in params, focus map immediately for better UX
      if (params.lat && params.lng) {
        const pLat = parseFloat(params.lat);
        const pLng = parseFloat(params.lng);
        if (!isNaN(pLat) && !isNaN(pLng)) {
           // Move map even if we don't have the full pin object yet
           if (mapRef.current) {
            const region = {
              latitude: pLat,
              longitude: pLng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            const map = mapRef.current as any;
            if (map.animateToRegion) {
              map.animateToRegion(region, 800);
            }
           }
        }
      }

      if (!target) {
        try {
          const { authApis, endpoints } = await import("@/configs/Apis");
          const api = authApis();
          const res = await api.get(endpoints.voiceDetail(idNum));
          target = parseVoicePinFromDetailResponse(res) ?? undefined;
          
          if (target) {
            // Add to accumulated pins so it stays on map
            setAccumulatedPins(prev => {
              if (prev.some(p => p.id === target?.id)) return prev;
              return [...prev, target!];
            });
          }
        } catch (error) {
          console.error("Error fetching shared pin:", error);
        }
      }

      if (target) {
        handleSelectMapPin(target);
        if (params.autoPlay === "true" || params.autoPlay === "1") {
          setAutoPlayPin(true);
        }
      }
    };

    findAndSelectPin();
  }, [params.selectPinId, params.autoPlay, accumulatedPins, handleSelectMapPin]);

  const { isRecording, record, stop } = useRecorder({
    onRecordingComplete: (uri) => {
      setPendingAudioUri(uri);
      setCameraVisible(true);
    },
  });

  const handlePhotoTaken = (uri: string) => {
    setPendingPhotoUri(uri);
    setCameraVisible(false);
    setUploadSheetVisible(true);
  };

  const handleCameraSkip = () => {
    setPendingPhotoUri(null);
    setCameraVisible(false);
    setUploadSheetVisible(true);
  };

  const handleSelectDraft = (draft: VoiceDraft) => {
    setPendingAudioUri(draft.audioUri);
    setPendingPhotoUri(draft.photoUri);
    setPendingTranscription(draft.transcription);
    setPendingEmotionLabel(draft.emotionLabel);
    setPendingVisibility(draft.visibility);
    // setPendingGhostVoice(!!draft.ghostVoice || !!draft.isAnonymous);
    // setPendingGhostTtsVoiceId(draft.ttsVoice || DEFAULT_GHOST_TTS_VOICE_ID);
    // setPendingGhostEngine(draft.ghostEngine === "rvc" ? "rvc" : DEFAULT_GHOST_ENGINE_ID);
    setActiveDraftId(draft.id);
    setDraftsVisible(false);
    setUploadSheetVisible(true);
  };

  const resetFlow = () => {
    setPendingAudioUri(null);
    setPendingPhotoUri(null);
    setPendingTranscription(null);
    setPendingEmotionLabel("Bình yên");
    setPendingVisibility("FRIENDS");
    // setPendingGhostVoice(false);
    // setPendingGhostTtsVoiceId(DEFAULT_GHOST_TTS_VOICE_ID);
    // setPendingGhostEngine(DEFAULT_GHOST_ENGINE_ID);
    setActiveDraftId(null);
    setCameraVisible(false);
    setUploadSheetVisible(false);
  };

  const recenterMap = () => {
    if (mapRef.current && location) {
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      // For MapViewClustering, sometimes we need to access the map methods via the ref
      const map = mapRef.current as any;
      if (map.animateToRegion) {
        map.animateToRegion(region, 1000);
      } else if (map.getMap && map.getMap().animateToRegion) {
        map.getMap().animateToRegion(region, 1000);
      }
    } else if (!location) {
      Alert.alert("Vị trí", "Đang lấy vị trí của bạn...");
    }
  };

  const handleRegionChangeComplete = useCallback((region: Region) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    currentRegionRef.current = region;
    debounceTimerRef.current = setTimeout(() => {
      const newBbox: BoundingBox = {
        minLat: region.latitude - region.latitudeDelta / 2,
        maxLat: region.latitude + region.latitudeDelta / 2,
        minLng: region.longitude - region.longitudeDelta / 2,
        maxLng: region.longitude + region.longitudeDelta / 2,
      };
      const key = [
        newBbox.minLat.toFixed(4),
        newBbox.maxLat.toFixed(4),
        newBbox.minLng.toFixed(4),
        newBbox.maxLng.toFixed(4),
      ].join("|");
      if (lastBboxKeyRef.current === key) {
        return;
      }
      lastBboxKeyRef.current = key;
      setBbox(newBbox);
    }, 280);
  }, []);

  const handlePressDiscoveredPin = useCallback(() => {
    setIsMiniCardOpen(true);
  }, []);

  const handleSelectMapPin = useCallback((pin: VoicePin | null) => {
    if (!pin) {
      setExternalSelectedPin(null);
      setAutoPlayPin(false);
      return;
    }

    const latestPin = accumulatedPins.find((p) => p.id === pin.id) ?? pin;

    // 1. Check if already focused to avoid unnecessary delay
    const currentRegion = currentRegionRef.current;
    const isAlreadyFocused = currentRegion && 
      Math.abs(currentRegion.latitude - latestPin.latitude) < 0.0001 &&
      Math.abs(currentRegion.longitude - latestPin.longitude) < 0.0001 &&
      currentRegion.latitudeDelta <= 0.0051;

    const duration = isAlreadyFocused ? 0 : 800;

    // 2. Focus if needed
    if (mapRef.current && !isAlreadyFocused) {
      const region = {
        latitude: latestPin.latitude,
        longitude: latestPin.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      const map = mapRef.current as any;
      if (map.animateToRegion) {
        map.animateToRegion(region, duration);
      } else if (map.getMap && map.getMap().animateToRegion) {
        map.getMap().animateToRegion(region, duration);
      }
    }

    // 3. AR pins → hunt flow; otherwise show VoicePinCard after focus
    setTimeout(() => {
      if (isHiddenARVoicePin(latestPin)) {
        setExternalSelectedPin(null);
        setAutoPlayPin(false);
        router.push({ pathname: "/voice-ar/hunt", params: { pinId: String(latestPin.id) } });
        return;
      }
      setExternalSelectedPin(latestPin);
    }, duration);
  }, [accumulatedPins, router]);

  return (
    <View style={styles.container}>
      <MapContainer
        location={location}
        pins={accumulatedPins}
        isScanning={isScanning}
        discoveredPin={discoveredPin}
        onPressDiscoveredPin={handlePressDiscoveredPin}
        externalSelectedPin={externalSelectedPin}
        onSelectPin={handleSelectMapPin}
        onDeletePin={(id) => {
          setAccumulatedPins(prev => prev.filter(p => p.id !== id));
        }}
        autoPlayPin={autoPlayPin}
        onRegionChangeComplete={handleRegionChangeComplete}
        ref={mapRef as any}
      />

      {/* Top Section: Filter */}
      <FilterToggle value={visibility} onChange={setVisibility} />

      {/* Explore Button: Left side below Filter */}
      <View style={[
        styles.exploreWrapper,
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 5,
        }
      ]}>
        <View style={[
          styles.exploreBar,
          {
            backgroundColor: isDark ? 'rgba(18,18,18,0.9)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }
        ]}>
          <BlurView
            intensity={isDark ? 20 : 40}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.exploreButton}
            onPress={() => {
              if (location) {
                triggerScan(location.coords.latitude, location.coords.longitude);
              } else {
                Alert.alert("Vị trí", "Đang lấy vị trí của bạn...");
              }
            }}
            disabled={isScanning}
          >
            <View style={[styles.exploreIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
              {isScanning ? (
                <ActivityIndicator size="small" color="#8b5cf6" />
              ) : (
                <Ionicons name="compass" size={22} color="#8b5cf6" />
              )}
            </View>
            <Text style={[styles.exploreLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>Khám phá</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.exploreButton}
            onPress={() => router.push('/friends')}
          >
            <View style={[styles.exploreIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
              <Ionicons name="people" size={22} color="#8b5cf6" />
              {receivedCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{receivedCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.exploreLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>Bạn bè</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Button: right side near the top */}
      <View style={[
        styles.chatControls,
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 5,
        }
      ]}>
        <View style={[
          styles.exploreBar,
          {
            backgroundColor: isDark ? 'rgba(18,18,18,0.9)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }
        ]}>
          <BlurView
            intensity={isDark ? 20 : 40}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push("/chat")}
            activeOpacity={0.7}
          >
            <View style={[styles.exploreIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
              <Ionicons name="chatbubble-ellipses" size={22} color="#8b5cf6" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.exploreLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recenter map: circular FAB, right side aligned with QuickActions */}
      <View style={[
        styles.mapControls,
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 5,
        }
      ]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Định vị lại vị trí hiện tại"
          style={[
            styles.recenterFab,
            {
              backgroundColor: isDark ? 'rgba(18,18,18,0.9)' : 'rgba(255,255,255,0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            },
          ]}
          onPress={recenterMap}
          activeOpacity={0.85}
        >
          <View style={styles.recenterFabInner}>
            <BlurView
              intensity={isDark ? 20 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.recenterFabIconWrap,
                { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' },
              ]}
            >
              <Ionicons name="paper-plane" size={22} color="#8b5cf6" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Section: Primary Action & Menu */}
      <VoiceButton
        isRecording={isRecording}
        onPress={isRecording ? stop : record}
      />

      <QuickActions
        onFriends={() => router.push('/friends')}
        onNotifications={() => router.push('/(tabs)/notification?from=home')}
        onDrafts={() => setDraftsVisible(true)}
        onAlbum={() => router.push('/(tabs)/album')}
        receivedCount={receivedCount}
        unreadCount={unreadCount}
      />

      {isMiniCardOpen && discoveredPin && (
        <VoicePinMiniCard
          pin={discoveredPin}
          onClose={() => setIsMiniCardOpen(false)}
          onPlayVoice={(pin) => {
            setIsMiniCardOpen(false);
            if (isHiddenARVoicePin(pin)) {
              setAutoPlayPin(false);
              router.push({ pathname: "/voice-ar/hunt", params: { pinId: String(pin.id) } });
              return;
            }
            setExternalSelectedPin(pin);
            setAutoPlayPin(true);
          }}
          onRandomAgain={() => {
            if (location) {
              setIsMiniCardOpen(false);
              triggerScan(location.coords.latitude, location.coords.longitude);
            }
          }}
        />
      )}

      <VoiceCameraCapture
        visible={cameraVisible}
        onPhotoTaken={handlePhotoTaken}
        onSkip={handleCameraSkip}
      />

      <VoiceUploadSheet
        visible={uploadSheetVisible}
        audioUri={pendingAudioUri}
        photoUri={pendingPhotoUri}
        location={location}
        visibility={pendingVisibility}
        initialTranscription={pendingTranscription}
        initialEmotionLabel={pendingEmotionLabel}
        // initialGhostVoice={pendingGhostVoice}
        // initialGhostTtsVoiceId={pendingGhostTtsVoiceId}
        // initialGhostEngine={pendingGhostEngine}
        onClose={resetFlow}
        onUploadSuccess={async () => { 
          if (activeDraftId) {
            await DraftStorage.deleteDraft(activeDraftId);
          }
          refetch(); 
          resetFlow(); 
        }}
      />

      <DraftsModal
        visible={draftsVisible}
        onClose={() => setDraftsVisible(false)}
        onSelectDraft={handleSelectDraft}
      />

      {arOverlayVisible && nearbyARPin && typeof nearbyARDistance === "number" && (
        <ExploreOverlay
          pin={nearbyARPin}
          distanceMeters={nearbyARDistance}
          onDismiss={async () => {
            setArOverlayVisible(false);
            await markPromptedAR(nearbyARPin.id, 10 * 60);
          }}
          onStart={async () => {
            await markPromptedAR(nearbyARPin.id, 10 * 60);
            setArOverlayVisible(false);
            router.push({ pathname: "/voice-ar/hunt", params: { pinId: String(nearbyARPin.id) } });
          }}
        />
      )}

      <WalkthroughOverlay
        visible={walkthroughVisible}
        steps={walkthroughSteps}
        onFinish={finishWalkthrough}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapControls: {
    position: "absolute",
    right: 20,
    bottom: 110,
    zIndex: 1000,
  },
  recenterFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  recenterFabInner: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  recenterFabIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  chatControls: {
    position: "absolute",
    right: 20,
    top: 135,
    zIndex: 1000,
  },
  exploreWrapper: {
    position: "absolute",
    top: 135,
    left: 20,
    zIndex: 100,
  },
  exploreBar: {
    borderRadius: 22,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1,
    width: 68,
  },
  exploreButton: {
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  exploreIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  exploreLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  divider: {
    width: 32,
    height: 1,
    marginVertical: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

