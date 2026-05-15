import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export const GRADIO_SPACE_URL = "https://kieuphuoc-rvc-beatrice-voice-conversion.hf.space/";
export const GRADIO_API_URL = `${GRADIO_SPACE_URL}gradio_api/`;

// #region agent log
const DBG = (location: string, message: string, data: any = {}, hypothesisId?: string) => {
  try {
    console.log(`[DEBUG-5d1677][${location}] ${message}`, JSON.stringify(data));
    fetch('http://192.168.1.116:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '5d1677' },
      body: JSON.stringify({
        sessionId: '5d1677',
        location: `gradioService.ts:${location}`,
        message,
        data,
        hypothesisId,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch {}
};
// #endregion

export interface TransformVoiceOptions {
  audioUri: string;
  modelType?: "RVC v2" | "Beatrice v2";
  targetSpeaker?: number; 
  pitch?: number; 
}

/**
 * Custom Gradio Service using REST API for maximum React Native compatibility.
 * Bypasses @gradio/client to avoid SSE/WebSocket issues.
 */
export const gradioService = {
  /**
   * Generates a random session hash for Gradio requests.
   */
  generateSessionHash(): string {
    return Math.random().toString(36).substring(2, 13);
  },

  /**
   * Uploads a file to the Gradio space using standard React Native FormData.
   */
  async uploadFile(uri: string): Promise<string> {
    console.log(`[GradioService] Uploading file: ${uri}`);
    
    const formData = new FormData();
    const fileName = uri.split('/').pop() || 'audio.m4a';
    
    // Determine mime type
    let mimeType = 'audio/m4a';
    if (uri.endsWith('.wav')) mimeType = 'audio/wav';
    else if (uri.endsWith('.mp3')) mimeType = 'audio/mpeg';

    // React Native standard way to append file to FormData
    formData.append('files', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: fileName,
      type: mimeType,
    } as any);

    const response = await fetch(`${GRADIO_API_URL}upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    if (Array.isArray(result) && result.length > 0) {
      console.log(`[GradioService] File uploaded successfully: ${result[0]}`);
      return result[0]; // Returns the internal Gradio path
    }
    
    throw new Error("Invalid upload response from Gradio");
  },

  /**
   * Parse Gradio sse_v3 protocol events from full response text.
   * Each line: `data: {"msg":"...","event_id":"...","output":{...}}`
   */
  _parseSseV3Events(fullText: string, expectedEventId: string): { resolved?: any; error?: string } {
    const lines = fullText.split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      let payload: any;
      try {
        payload = JSON.parse(t.substring(5).trim());
      } catch {
        continue;
      }
      if (!payload || typeof payload !== 'object') continue;
      const msg = payload.msg;
      if (msg === 'process_completed') {
        if (payload.success === false) {
          const errMsg = (payload.output && (payload.output.error || payload.output.message)) || 'Gradio processing failed';
          return { error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) };
        }
        const data = payload.output && Array.isArray(payload.output.data) ? payload.output.data : null;
        if (data) return { resolved: data };
        return { resolved: payload.output };
      }
      if (msg === 'unexpected_error' || msg === 'queue_full') {
        return { error: payload.message || payload.msg || 'Gradio queue error' };
      }
    }
    return {};
  },

  /**
   * Calls a Gradio endpoint using Gradio 6 sse_v3 protocol (queue/join + queue/data).
   */
  async callQueueEndpoint(fnIndex: number, data: any[], sessionHash: string, endpointName: string): Promise<any> {
    // #region agent log
    const startTime = Date.now();
    DBG('callQueueEndpoint.entry', 'Starting queue/join + queue/data', { fnIndex, endpointName, sessionHash, dataPreview: JSON.stringify(data).substring(0, 200) }, 'F,G');
    // #endregion

    const joinRes = await fetch(`${GRADIO_API_URL}queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        event_data: null,
        fn_index: fnIndex,
        session_hash: sessionHash,
      }),
    });

    // #region agent log
    DBG('callQueueEndpoint.joinResponse', 'queue/join response', {
      endpointName,
      status: joinRes.status,
      ok: joinRes.ok,
      elapsedMs: Date.now() - startTime,
    }, 'F,G');
    // #endregion

    if (!joinRes.ok) {
      const errText = await joinRes.text();
      throw new Error(`queue/join failed: ${joinRes.status} ${errText.substring(0, 200)}`);
    }
    const joinData = await joinRes.json();
    const eventId = joinData.event_id;
    if (!eventId) throw new Error('queue/join did not return event_id');

    console.log(`[GradioService] Joined queue (${endpointName}), event: ${eventId}`);

    const dataUrl = `${GRADIO_API_URL}queue/data?session_hash=${encodeURIComponent(sessionHash)}`;
    const maxAttempts = 3;
    let lastErr: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const attemptStart = Date.now();
      try {
        // #region agent log
        DBG('callQueueEndpoint.sseAttempt', 'fetch SSE attempt', { endpointName, attempt, dataUrl, elapsedMs: Date.now() - startTime }, 'F,G');
        // #endregion

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 240000);

        const response = await fetch(dataUrl, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        });
        clearTimeout(timer);

        // #region agent log
        DBG('callQueueEndpoint.sseResponse', 'SSE response headers', {
          endpointName,
          attempt,
          status: response.status,
          ok: response.ok,
          elapsedMs: Date.now() - attemptStart,
        }, 'F,G');
        // #endregion

        if (!response.ok) throw new Error(`SSE HTTP ${response.status}`);

        const fullText = await response.text();

        // #region agent log
        DBG('callQueueEndpoint.sseBody', 'fetched full SSE body', {
          endpointName,
          attempt,
          bodyLen: fullText.length,
          bodyHead: fullText.substring(0, 400),
          bodyTail: fullText.length > 400 ? fullText.substring(fullText.length - 400) : '',
          elapsedMs: Date.now() - attemptStart,
        }, 'F,G');
        // #endregion

        const parsed = this._parseSseV3Events(fullText, eventId);
        if (parsed.error) {
          // #region agent log
          DBG('callQueueEndpoint.parsedError', 'queue error event (no retry, server-side error)', { endpointName, error: parsed.error }, 'F,G,M');
          // #endregion
          throw new Error(parsed.error);
        }
        if (parsed.resolved !== undefined) {
          // #region agent log
          DBG('callQueueEndpoint.resolved', 'process_completed parsed', { endpointName, elapsedMs: Date.now() - startTime }, 'F,G');
          // #endregion
          return parsed.resolved;
        }
        throw new Error('SSE stream ended without process_completed');
      } catch (err: any) {
        lastErr = err;
        const errMsg = err?.message || String(err);
        // Server-side errors (validation, processing errors) won't change on retry.
        const isServerSideError =
          errMsg.includes('validation error') ||
          errMsg.includes('Pydantic') ||
          errMsg.includes('process_completed');
        // #region agent log
        DBG('callQueueEndpoint.sseAttemptFailed', 'SSE attempt failed', {
          endpointName,
          attempt,
          error: errMsg,
          isServerSideError,
          elapsedMs: Date.now() - attemptStart,
        }, 'F,G,M');
        // #endregion
        if (isServerSideError) break;
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 800 * attempt));
        }
      }
    }

    throw new Error(lastErr?.message || 'Gradio queue SSE failed');
  },

  /**
   * Sends audio to the Hugging Face Gradio Space to transform the voice.
   */
  async transformVoice({
    audioUri,
    modelType = "RVC v2",
    targetSpeaker = 0,
    pitch = 0,
  }: TransformVoiceOptions): Promise<string> {
    try {
      const sessionHash = this.generateSessionHash();
      console.log(`[GradioService] Starting transform (Session: ${sessionHash})`);
      // #region agent log
      const tvStart = Date.now();
      DBG('transformVoice.start', 'transform started', { sessionHash, modelType, targetSpeaker, pitch, audioUri }, 'A,B');
      // #endregion

      // 1. Upload the file
      const uploadedFilePath = await this.uploadFile(audioUri);
      // #region agent log
      DBG('transformVoice.uploaded', 'upload completed', { uploadedFilePath, elapsedMs: Date.now() - tvStart }, 'B');
      // #endregion
      const audioFileObj = {
        path: uploadedFilePath,
        url: `${GRADIO_SPACE_URL}gradio_api/file=${uploadedFilePath}`,
        orig_name: audioUri.split('/').pop() || 'audio.m4a',
        size: 0,
        mime_type: null,
        is_stream: false,
        // Gradio 6 Pydantic FileData validator requires this exact meta tag.
        meta: { _type: 'gradio.FileData' },
      };
      // #region agent log
      DBG('transformVoice.audioFileObj', 'built audio file object', { audioFileObj }, 'M');
      // #endregion

      // 2. Load example model (required by this specific space's logic)
      console.log(`[GradioService] Loading model weights...`);
      const loadData = await this.callQueueEndpoint(1, [], sessionHash, 'load_example_model');
      // #region agent log
      DBG('transformVoice.loadDone', 'load_example_model completed', { hasData: !!loadData, elapsedMs: Date.now() - tvStart }, 'F,G');
      // #endregion

      const rvcModelData = loadData[0];
      const rvcIndexData = loadData[1];

      // 3. Perform conversion
      console.log(`[GradioService] Converting voice (Mode: ${modelType})...`);
      const convertData = await this.callQueueEndpoint(
        2,
        [
          audioFileObj,     // source
          modelType,        // m_type
          rvcModelData,     // rvc_model
          rvcIndexData,     // rvc_index
          null,             // beat_model
          targetSpeaker,    // beat_speaker
          0,                // beat_formant
          pitch,            // pitch
          "rmvpe",          // f0 method
          0.75,             // idx_rate
          0.33,             // prot
        ],
        sessionHash,
        'convert',
      );

      // #region agent log
      DBG('transformVoice.convertData', 'convert raw output', { convertData: Array.isArray(convertData) ? convertData : convertData, elapsedMs: Date.now() - tvStart }, 'M,N');
      // #endregion

      if (Array.isArray(convertData) && convertData.length > 0) {
        const resultAudio = convertData[0];
        const statusMsg = typeof convertData[1] === 'string' ? convertData[1] : null;
        if (resultAudio && resultAudio.url) {
          return resultAudio.url;
        }
        // Server returned success=true but data[0]=null, with status message in data[1].
        if (statusMsg) throw new Error(statusMsg);
      }

      throw new Error("Invalid conversion result");
    } catch (error: any) {
      console.error("[GradioService] Error:", error.message);
      throw new Error(error.message || "Lỗi khi biến đổi giọng nói. Vui lòng thử lại!");
    }
  }
};
