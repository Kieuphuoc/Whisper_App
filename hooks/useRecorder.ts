import {
    RecordingPresets,
    useAudioRecorder,
} from "expo-audio";
import { useState } from "react";

export function useRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  const record = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  };

  const stop = async () => {
    await recorder.stop();
    setIsRecording(false);
  };

  return { recorder, isRecording, record, stop };
}
