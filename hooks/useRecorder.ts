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

// Add helper to configure audio mode optimally
const configureAudioMode = async (isRecording: boolean) => {
  try {
    await setAudioModeAsync({
      allowsRecording: isRecording,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      interruptionMode: isRecording ? 'doNotMix' : 'mixWithOthers',
      shouldPlayInBackground: false,
    });
  } catch (error) {
    console.warn("Failed to set audio mode:", error);
  }
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

    // Configure optimal audio session for recording
    await configureAudioMode(true);

    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  };

  const stop = async () => {
    await recorder.stop();
    setIsRecording(false);

    // Reset audio mode so playback works normally and loudly via speaker
    await configureAudioMode(false);

    const uri = recorder.uri;
    if (uri && onRecordingComplete) {
      onRecordingComplete(uri);
    }
  };

  return { recorder, isRecording, record, stop };
}
