import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import MapContainer from "@/components/home/MapContainer";
import VisibilityFilter from "@/components/home/VisibilityFilter";
import VoiceButton from "@/components/home/VoiceButton";
import VoiceCameraCapture from "@/components/home/VoiceCameraCapture";
import VoiceUploadSheet from "@/components/home/VoiceUploadSheet";
import FriendsModal from "@/components/FriendsModal";
import { MyDispatchContext } from "@/configs/Context";
import { useLocation } from "@/hooks/useLocation";
import { useRecorder } from "@/hooks/useRecorder";
import { useVisibility } from "@/hooks/useVisibility";
import { useVoicePins } from "@/hooks/useVoicePins";
import { Ionicons } from "@expo/vector-icons";

/**
 * Flow:
 *   1. Press VoiceButton → recording starts
 *   2. Press again → stop recording
 *   3. Camera opens (capture only, no album)
 *   4. Snap photo (or skip) → VoiceUploadSheet opens
 *   5. Choose visibility → Publish → pin saved to DB → appears on map
 */
export default function HomeScreen() {
  const { location } = useLocation();
  const { visibility, setVisibility } = useVisibility("PUBLIC");
  const { pins, refetch } = useVoicePins(visibility);
  const dispatch = useContext(MyDispatchContext);

  // Step state
  const [pendingAudioUri, setPendingAudioUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [friendsVisible, setFriendsVisible] = useState(false);

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

  return (
    <View style={styles.container}>
      <MapContainer location={location} pins={pins} />

      <VoiceButton
        isRecording={isRecording}
        onPress={isRecording ? stop : record}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
      </TouchableOpacity>

      {/* Friends button */}
      <TouchableOpacity style={styles.friendsButton} onPress={() => setFriendsVisible(true)}>
        <Ionicons name="people-outline" size={22} color="#8b5cf6" />
      </TouchableOpacity>

      <VisibilityFilter value={visibility} onChange={setVisibility} />

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
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  friendsButton: {
    position: "absolute" as const,
    top: 60,
    right: 76,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
});
