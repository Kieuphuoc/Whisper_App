import { Client } from "@gradio/client";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

export const GRADIO_SPACE_URL = "https://kieuphuoc-rvc-beatrice-voice-conversion.hf.space/";

export interface TransformVoiceOptions {
  audioUri: string;
  modelType?: "RVC v2" | "Beatrice v2";
  targetSpeaker?: number; // For Beatrice
  pitch?: number; // Semitones (-12 to 12)
  rvcModelUrl?: string; // Optional URL or local path to .pth
  rvcIndexUrl?: string; // Optional URL or local path to .index
  beatModelUrl?: string; // Optional URL or local path to .pt.gz
}

export const gradioService = {
  /**
   * Converts a local audio file URI to a Blob (required by Gradio Client).
   */
  async uriToBlob(uri: string): Promise<Blob> {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      return await response.blob();
    } else {
      // In React Native, fetch(file://...) might not work reliably for Blobs
      // but expo-file-system can read it as base64, then we convert to Blob
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist at URI: " + uri);
      }
      
      const base64Str = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Determine mime type
      let mimeType = 'audio/m4a';
      if (uri.endsWith('.wav')) mimeType = 'audio/wav';
      else if (uri.endsWith('.mp3')) mimeType = 'audio/mpeg';

      // React Native's fetch implementation can handle base64 data URIs
      const response = await fetch(`data:${mimeType};base64,${base64Str}`);
      return await response.blob();
    }
  },

  /**
   * Sends audio to the Hugging Face Gradio Space to transform the voice.
   */
  async transformVoice({
    audioUri,
    modelType = "Beatrice v2", // Default to Beatrice as it's often simpler (no .pth needed if preloaded, but we pass null anyway)
    targetSpeaker = 0,
    pitch = 0,
    rvcModelUrl = null,
    rvcIndexUrl = null,
    beatModelUrl = null,
  }: TransformVoiceOptions): Promise<string> {
    try {
      console.log(`[GradioService] Connecting to ${GRADIO_SPACE_URL}...`);
      const client = await Client.connect(GRADIO_SPACE_URL);

      console.log(`[GradioService] Converting audio URI to Blob: ${audioUri}`);
      const audioBlob = await this.uriToBlob(audioUri);

      // Helper to convert URLs to Blobs if provided, otherwise pass null
      const fetchModelBlob = async (url: string | null) => {
          if (!url) return null;
          const res = await fetch(url);
          return await res.blob();
      };

      const rvcModelBlob = await fetchModelBlob(rvcModelUrl);
      const rvcIndexBlob = await fetchModelBlob(rvcIndexUrl);
      const beatModelBlob = await fetchModelBlob(beatModelUrl);

      console.log(`[GradioService] Sending data to /convert endpoint...`);
      // The /convert endpoint expects 11 arguments:
      // 0: source (Audio)
      // 1: m_type ("RVC v2" or "Beatrice v2")
      // 2: rvc_model (File .pth)
      // 3: rvc_index (File .index)
      // 4: beat_model (File .pt.gz)
      // 5: beat_speaker (number)
      // 6: beat_formant (number)
      // 7: pitch (number)
      // 8: f0 (string)
      // 9: idx_rate (number)
      // 10: prot (number)
      const result = await client.predict("/convert", [
        audioBlob,        // source
        modelType,        // m_type
        rvcModelBlob,     // rvc_model
        rvcIndexBlob,     // rvc_index
        beatModelBlob,    // beat_model
        targetSpeaker,    // beat_speaker
        0,                // beat_formant (default 0)
        pitch,            // pitch (default 0)
        "rmvpe",          // f0 method
        0.75,             // idx_rate
        0.33,             // prot
      ]);

      console.log("[GradioService] Result received:", result);

      // The result is an array: [Converted Audio Data, Status String]
      const responseData = result.data as any[];
      if (responseData && responseData.length > 0) {
        const audioData = responseData[0];
        
        if (audioData && audioData.url) {
          return audioData.url;
        } else if (typeof audioData === 'string') {
           // Sometimes it returns the URL string directly
           return audioData;
        }
      }

      throw new Error(`Invalid response format from Gradio: ${JSON.stringify(result.data)}`);
    } catch (error) {
      console.error("[GradioService] Error transforming voice:", error);
      throw error;
    }
  }
};
