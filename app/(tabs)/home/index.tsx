import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, TouchableOpacity, View, Alert, useColorScheme } from "react-native";
import MapView, { Region } from "react-native-maps";

import MapContainer from "@/components/home/MapContainer";
import VoiceButton from "@/components/home/VoiceButton";
import VoiceCameraCapture from "@/components/home/VoiceCameraCapture";
import VoiceUploadSheet from "@/components/home/VoiceUploadSheet";
import FriendsModal from "@/components/FriendsModal";
import { MyDispatchContext, MyUserContext } from "@/configs/Context";
import { useLocation } from "@/hooks/useLocation";
import { useRecorder } from "@/hooks/useRecorder";
import { useVisibility } from "@/hooks/useVisibility";
import { BoundingBox, useVoicePins } from "@/hooks/useVoicePins";
import { Ionicons } from "@expo/vector-icons";
import { useDiscovery } from "@/hooks/useDiscovery";
import VoicePinMiniCard from "@/components/discovery/VoicePinMiniCard";
import { VoicePin } from "@/types";
import { theme } from "@/constants/Theme";
import StatsBento from "@/components/home/StatsBento";
import FilterToggle from "@/components/home/Filter";
import QuickActions from "@/components/home/QuickActions";
import { useARProximity } from "@/hooks/useARProximity";
import ExploreOverlay from "@/components/voice-ar/ExploreOverlay";
import { markPromptedAR } from "@/storage/voiceARProgress";
import WalkthroughOverlay, { WalkthroughStep } from "@/components/onboarding/WalkthroughOverlay";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useFriends } from "@/hooks/useFriends";
import { expandBoundingBox, haversineDistanceMeters, pointInBoundingBox } from "@/utils/geo";

/** Padded viewport for pin retention (reduces churn at edges). */
const VIEWPORT_RETAIN_FACTOR = 2.35;
/** Keep pins near the user so AR proximity still works if the map is panned away. */
const USER_PIN_RETAIN_RADIUS_M = 1600;
/** Hard cap on markers in memory — native maps OOM if this grows without bound. */
const MAX_ACCUMULATED_PINS = 450;
const EMPTY_PINS: VoicePin[] = [];


export default function HomeScreen() {
  const colorScheme = useColorScheme() || "light";
  const currentTheme = theme[colorScheme];
  const { location } = useLocation();
  const { visibility, setVisibility } = useVisibility("PUBLIC");
  const params = useLocalSearchParams<{ selectPinId?: string; autoPlay?: string }>();

  // Bounding box state for map-based fetching
  const [bbox, setBbox] = useState<BoundingBox | undefined>(undefined);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Aligns with useVoicePins query key (4 decimals) — skip setState when viewport cell unchanged. */
  const lastBboxKeyRef = useRef<string | null>(null);

  const { data: latestPins = EMPTY_PINS, refetch, isFetching } = useVoicePins(visibility, bbox, { enabled: !!bbox });
  const [accumulatedPins, setAccumulatedPins] = useState<VoicePin[]>([]);

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

  // Merge bbox results, then evict pins far outside the padded viewport (and not near the user).
  // Without eviction, every pan/zoom adds markers until the app runs out of native memory.
  useEffect(() => {
    if (!latestPins && !bbox) return;

    setAccumulatedPins((prev) => {
      const pinsToProcess = latestPins || [];
      const pinMap = new Map(prev.map((p) => [p.id, p]));
      
      let hasNewPins = false;
      if (pinsToProcess.length > 0) {
        for (const p of pinsToProcess) {
          if (!pinMap.has(p.id)) {
            pinMap.set(p.id, p);
            hasNewPins = true;
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
          // Keep pins whose coordinates couldn't be resolved — don't evict them
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

        if (!hasNewPins && pins.length === initialCount && pins.length === prev.length) {
            return prev; // Skip update if nothing changed
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

      // If the array content is exactly the same as before, don't update to avoid re-renders
      if (pins.length === prev.length && pins.every((p, i) => p.id === prev[i].id)) {
        return prev;
      }

      return pins;
    });
  }, [latestPins, bbox, location?.coords.latitude, location?.coords.longitude]);
  const dispatch = useContext(MyDispatchContext);
  const user = useContext(MyUserContext);
  const router = useRouter();

  // Lightweight AR proximity (foreground-only, low frequency)
  const { location: arLocation, nearbyPin: nearbyARPin, distanceMeters: nearbyARDistance } = useARProximity(accumulatedPins);
  const [arOverlayVisible, setArOverlayVisible] = useState(false);
  const arOverlayPinIdRef = useRef<number | null>(null);
  const handledSelectParamRef = useRef<string | null>(null);

  // Step state
  const [pendingAudioUri, setPendingAudioUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [friendsVisible, setFriendsVisible] = useState(false);

  // Discovery
  const { isScanning, discoveredPin, error, triggerScan } = useDiscovery();
  const [isMiniCardOpen, setIsMiniCardOpen] = useState(false);
  const [externalSelectedPin, setExternalSelectedPin] = useState<VoicePin | null>(null);
  const [autoPlayPin, setAutoPlayPin] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Friends Hook
  const { friends, receivedCount, refetch: refetchFriends } = useFriends();

  // Walkthrough state
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
            description: 'Nhấn vào nút Micro để bắt đầu ghi lại những khoảnh khắc và tâm tư của bạn tại địa điểm này.',
            icon: 'mic',
            targetPos: { bottom: 110, left: SCREEN_WIDTH / 2 - 37.5, width: 75, height: 75 }
          },
          {
            id: 'stats',
            title: 'Chỉ số của bạn',
            description: 'Xem nhanh tổng số VoicePins bạn đã tạo và những thành tựu bạn đạt được.',
            icon: 'stats-chart',
            targetPos: { top: 60, right: 25, width: 60, height: 60 } // Roughly near stats or profile
          },
          {
            id: 'explore',
            title: 'Khám phá xung quanh',
            description: 'Sử dụng các phím tắt để quét tìm những VoicePins bí ẩn hoặc kết nối với bạn bè.',
            icon: 'planet',
            targetPos: { bottom: 40, left: 10, width: SCREEN_WIDTH - 20, height: 60 }
          },
          {
            id: 'recenter',
            title: 'Định vị lại',
            description: 'Nhấn vào đây bất cứ lúc nào để quay lại vị trí hiện tại của bạn trên bản đồ.',
            icon: 'navigate',
            targetPos: { bottom: 122, left: SCREEN_WIDTH / 2 + 60, width: 50, height: 50 }
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

  // Debug: log current location & AR proximity state (Removed as per user request)
  useEffect(() => {
    if (!__DEV__) return;
    if (!arLocation) return;
    // const arCount = accumulatedPins.filter((p) => p.type?.toString?.() === "HIDDEN_AR").length;
    // console.log(
    //   "[AR] location=",
    //   arLocation.coords.latitude,
    //   arLocation.coords.longitude,
    //   "arPins=",
    //   arCount,
    //   "nearby=",
    //   nearbyARPin?.id,
    //   "d=",
    //   nearbyARDistance
    // );
  }, [arLocation, accumulatedPins, nearbyARPin?.id, nearbyARDistance]);

  // Show AR overlay when entering 100m (anti-flicker)
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

  // If coming back from AR screens, select & autoplay pin
  useEffect(() => {
    const selectPinId = params.selectPinId;
    if (!selectPinId) return;
    if (handledSelectParamRef.current === selectPinId) return;
    handledSelectParamRef.current = selectPinId;

    const idNum = Number(selectPinId);
    const target = accumulatedPins.find((p) => p.id === idNum);
    if (target) {
      setExternalSelectedPin(target);
      setAutoPlayPin(params.autoPlay === "1");
    }
  }, [params.selectPinId, params.autoPlay, accumulatedPins]);

  // Step 1 & 2: record
  const { isRecording, record, stop } = useRecorder({
    onRecordingComplete: (uri) => {
      setPendingAudioUri(uri);
      setCameraVisible(true); // Step 3: open camera
    },
  });

  // Step 3 → 4: photo taken → open upload sheet
  const handlePhotoTaken = (uri: string) => {
    setPendingPhotoUri(uri);
    setCameraVisible(false);
    setUploadSheetVisible(true);
  };

  // Step 3 (skip): skip photo → still open upload sheet
  const handleCameraSkip = () => {
    setPendingPhotoUri(null);
    setCameraVisible(false);
    setUploadSheetVisible(true);
  };

  // Reset all pending state
  const resetFlow = () => {
    setPendingAudioUri(null);
    setPendingPhotoUri(null);
    setCameraVisible(false);
    setUploadSheetVisible(false);
  };

  const recenterMap = () => {
    if (location && mapRef.current) {
        const region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        (mapRef.current as any).animateToRegion(region, 1000);
    } else if (!location) {
      Alert.alert("Vị trí", "Đang lấy vị trí của bạn...");
    }
  };

  const handleRegionChangeComplete = useCallback((region: Region) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

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
    setExternalSelectedPin(pin);
    if (!pin) setAutoPlayPin(false);
  }, []);

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
          autoPlayPin={autoPlayPin}
          onRegionChangeComplete={handleRegionChangeComplete}
          ref={mapRef as any}
        />



      <VoiceButton
        isRecording={isRecording}
        onPress={isRecording ? stop : record}
      />
      <TouchableOpacity
        style={[
            styles.recenterButton, 
            { 
                backgroundColor: currentTheme.colors.surface,
                ...currentTheme.shadow.lg 
            }
        ]}
        onPress={recenterMap}
        activeOpacity={0.7}
      >
        <Ionicons name="navigate" size={24} color={currentTheme.colors.primary} />
      </TouchableOpacity>

      {/* <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: currentTheme.colors.background }]}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
      </TouchableOpacity> */}


      {/* Login button — chỉ hiện khi chưa đăng nhập */}
      {!user && (
        <TouchableOpacity
          style={[
            styles.absoluteButton, 
            { 
                top: 60, 
                right: 25, 
                backgroundColor: currentTheme.colors.primary,
                padding: currentTheme.spacing.sm + 2,
                borderRadius: currentTheme.borderRadius.full,
                ...currentTheme.shadow.md,
            }
          ]}
          onPress={() => router.push("/(auth)/login")}
        >
          <Ionicons name="log-in-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Chat button */}
      {user && (
        <TouchableOpacity
          style={[
            styles.absoluteButton, 
            { 
                top: 120, 
                right: 25, 
                backgroundColor: currentTheme.colors.surface,
                padding: currentTheme.spacing.sm + 2,
                borderRadius: currentTheme.borderRadius.full,
                ...currentTheme.shadow.md,
            }
          ]}
          onPress={() => router.push("/chat")}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={currentTheme.colors.primary} />
          {/* Badge for unread chat messages could go here */}
        </TouchableOpacity>
      )}

      <FilterToggle value={visibility} onChange={setVisibility} />

      {/* <StatsBento voicePins={accumulatedPins} /> */}
      <QuickActions
        onExplore={() => {
          if (location) {
            triggerScan(location.coords.latitude, location.coords.longitude);
          } else {
            Alert.alert("Vị trí", "Đang lấy vị trí của bạn...");
          }
        }}
        onFriends={() => setFriendsVisible(true)}
        onNotifications={() => router.push('/(tabs)/notification')}
        onTrending={() => {
          Alert.alert("Trending", "Tính năng đang được phát triển");
        }}
        isScanning={isScanning}
        receivedCount={receivedCount}
        unreadCount={receivedCount}
      />

      {isMiniCardOpen && discoveredPin && (
        <VoicePinMiniCard
          pin={discoveredPin}
          onClose={() => setIsMiniCardOpen(false)}
          onPlayVoice={(pin) => {
            setIsMiniCardOpen(false);
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

      {/* Step 3: Camera */}
      <VoiceCameraCapture
        visible={cameraVisible}
        onPhotoTaken={handlePhotoTaken}
        onSkip={handleCameraSkip}
      />

      {/* Step 4: Upload */}
      <VoiceUploadSheet
        visible={uploadSheetVisible}
        audioUri={pendingAudioUri}
        photoUri={pendingPhotoUri}
        location={location}
        visibility={visibility}
        onClose={resetFlow}
        onUploadSuccess={() => { refetch(); resetFlow(); }}
      />

      {/* Friends modal */}
      <FriendsModal visible={friendsVisible} onClose={() => setFriendsVisible(false)} />

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
  absoluteButton: {
    position: "absolute",
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  recenterButton: {
    position: "absolute",
    bottom: 122, // Vertically centered with VoiceButton (110 + 75/2 - 50/2)
    left: "50%",
    marginLeft: 60, // Positioned to the right of VoiceButton
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 2000,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
});
