export type GhostEngineId = "tts" | "rvc";

export const GHOST_ENGINE_OPTIONS: {
  id: GhostEngineId;
  label: string;
  subtitle: string;
}[] = [
  { id: "tts", label: "Đọc TTS", subtitle: "Azure · theo transcript" },
  { id: "rvc", label: "Đổi timbre", subtitle: "RVC / So-VITS · giữ ngữ điệu" },
];

export const DEFAULT_GHOST_ENGINE_ID: GhostEngineId = "tts";
