import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import MapContainer from "@/components/home/MapContainer";
import VisibilityFilter from "@/components/home/VisibilityFilter";
import VoiceButton from "@/components/home/VoiceButton";
import { MyDispatchContext } from "@/configs/Context";
import { voicePin } from "@/data/voicePin";
import { useLocation } from "@/hooks/useLocation";
import { useRandomVoice } from "@/hooks/useRandomVoice";
import { useRecorder } from "@/hooks/useRecorder";
import { useVisibility } from "@/hooks/useVisibility";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { location } = useLocation();
  const { isRecording, record, stop } = useRecorder();
  const { currentVoice, playRandomVoice } = useRandomVoice(voicePin);
  const { visibility, setVisibility } = useVisibility('PUBLIC');
  const dispatch = useContext(MyDispatchContext);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      if (dispatch) {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <View style={styles.container}>
      <MapContainer location={location} />

      <VoiceButton
        isRecording={isRecording}
        onPress={isRecording ? stop : record}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
      </TouchableOpacity>

      {/* <RandomVoicePlayer
        voice={currentVoice}
        onRandomPress={playRandomVoice}
      /> */}
      <VisibilityFilter
        value={visibility}
        onChange={setVisibility}
      />

      {/* <Button
        title="Go detail"
        onPress={() => router.push("/(tabs)/home/voiceDetail")}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoutButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
});
