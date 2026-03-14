import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useContext, useState, useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity, View, Alert, useColorScheme } from "react-native";
import MapView from "react-native-maps";

import MapContainer from "@/components/home/MapContainer";
import VoiceButton from "@/components/home/VoiceButton";
import VoiceCameraCapture from "@/components/home/VoiceCameraCapture";
import VoiceUploadSheet from "@/components/home/VoiceUploadSheet";
import FriendsModal from "@/components/FriendsModal";
import { MyDispatchContext, MyUserContext } from "@/configs/Context";
import { useLocation } from "@/hooks/useLocation";
import { useRecorder } from "@/hooks/useRecorder";
import { useVisibility } from "@/hooks/useVisibility";
import { useVoicePins } from "@/hooks/useVoicePins";
import { Ionicons } from "@expo/vector-icons";
import { useDiscovery } from "@/hooks/useDiscovery";
import VoicePinMiniCard from "@/components/discovery/VoicePinMiniCard";
import { VoicePin } from "@/types";
import { theme } from "@/constants/Theme";
import StatsBento from "@/components/home/StatsBento";
import FilterToggle from "@/components/home/Filter";
import QuickActions from "@/components/home/QuickActions";

export default function HomeScreen() {
  const colorScheme = useColorScheme() || "light";
  const currentTheme = theme[colorScheme];
  const { location } = useLocation();
  const { visibility, setVisibility } = useVisibility("PUBLIC");
  const { pins, refetch } = useVoicePins(visibility);
  const dispatch = useContext(MyDispatchContext);
  const user = useContext(MyUserContext);
  const router = useRouter();

  // Step state
  const [pendingAudioUri, setPendingAudioUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [friendsVisible, setFriendsVisible] = useState(false);

  // Discovery
  const { isScanning, discoveredPin, error, triggerScan, resetDiscovery } = useDiscovery();
  const [isMiniCardOpen, setIsMiniCardOpen] = useState(false);
  const [externalSelectedPin, setExternalSelectedPin] = useState<VoicePin | null>(null);
  const [autoPlayPin, setAutoPlayPin] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (error) {
      Alert.alert("Khám phá", error);
    }
  }, [error]);

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

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      if (dispatch) dispatch({ type: "LOGOUT" });
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const recenterMap = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } else if (!location) {
      Alert.alert("Vị trí", "Đang lấy vị trí của bạn...");
    }
  };

  return (
    <View style={styles.container}>
      <MapContainer
        location={location}
        pins={pins}
        isScanning={isScanning}
        discoveredPin={discoveredPin}
        onPressDiscoveredPin={() => setIsMiniCardOpen(true)}
        externalSelectedPin={externalSelectedPin}
        onSelectPin={(pin) => {
          setExternalSelectedPin(pin);
          if (!pin) setAutoPlayPin(false);
        }}
        autoPlayPin={autoPlayPin}
        ref={mapRef}
      />

      <VoiceButton
        isRecording={isRecording}
        onPress={isRecording ? stop : record}
      />
      <TouchableOpacity 
        style={[styles.recenterButton, { backgroundColor: currentTheme.colors.background }]}
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
          style={[styles.loginButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => router.push("/(auth)/login")}
        >
          <Ionicons name="log-in-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Notification button */}
      {/* <TouchableOpacity
        style={[styles.notifButton, { backgroundColor: currentTheme.colors.background }]}
        onPress={() => router.push("/(tabs)/notification")}
      >
        <Ionicons name="notifications-outline" size={22} color="#f59e0b" />
      </TouchableOpacity> */}

      <FilterToggle value={visibility} onChange={setVisibility} />
      <StatsBento voicePins={pins} />
      <QuickActions
        onExplore={() => {
          if (location) {
            triggerScan(location.coords.latitude, location.coords.longitude);
          } else {
            Alert.alert("Vị trí", "Đang lấy vị trí của bạn...");
          }
        }}
        onFriends={() => setFriendsVisible(true)}
        onTrending={() => {
            Alert.alert("Trending", "Tính năng đang được phát triển");
        }}
        isScanning={isScanning}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoutButton: {
    position: "absolute",
    top: 60,
    left: 25,
    padding: theme.light.spacing.sm + 2,
    borderRadius: theme.light.radius.full,
    ...theme.light.shadows.md,
    zIndex: 1000,
  },
  friendsButton: {
    position: "absolute" as const,
    top: 60,
    right: 76,
    padding: theme.light.spacing.sm + 2,
    borderRadius: theme.light.radius.full,
    ...theme.light.shadows.md,
    zIndex: 1000,
  },
  notifButton: {
    position: "absolute" as const,
    top: 120,
    left: 25,
    padding: theme.light.spacing.sm + 2,
    borderRadius: theme.light.radius.full,
    ...theme.light.shadows.md,
    zIndex: 1000,
  },
  loginButton: {
    position: "absolute" as const,
    top: 60,
    right: 25,
    padding: theme.light.spacing.sm + 2,
    borderRadius: theme.light.radius.full,
    ...theme.light.shadows.md,
    zIndex: 1000,
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
    ...theme.light.shadows.lg,
    elevation: 8,
    zIndex: 2000,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
});
