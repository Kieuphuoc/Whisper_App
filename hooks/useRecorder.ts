import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { Alert, Platform } from "react-native";
import { useState } from "react";

type UseRecorderOptions = {
  onRecordingComplete?: (uri: string) => void;
};

export function useRecorder({ onRecordingComplete }: UseRecorderOptions = {}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  const record = async () => {
    // Check & request microphone permission (required on Android & iOS)
    const { granted } = await getRecordingPermissionsAsync();
    if (!granted) {
      const response = await requestRecordingPermissionsAsync();
      if (!response.granted) {
        Alert.alert(
          "Cần quyền microphone",
          "Ứng dụng cần quyền microphone để ghi âm. Vui lòng bật trong Cài đặt.",
        );
        return;
      }
    }

    // iOS: activate audio session for recording
    if (Platform.OS === "ios") {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    }

    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  };

  const stop = async () => {
    await recorder.stop();
    setIsRecording(false);

    // iOS: reset audio mode so playback works normally
    if (Platform.OS === "ios") {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    }

    const uri = recorder.uri;
    if (uri && onRecordingComplete) {
      onRecordingComplete(uri);
    }
  };

  return { recorder, isRecording, record, stop };
}
