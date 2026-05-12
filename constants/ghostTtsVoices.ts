/** Giọng neural Azure Speech (vi-VN) — đồng bộ với allowlist backend */
export type GhostTtsVoiceOption = {
  id: string;
  label: string;
  subtitle: string;
};

export const GHOST_TTS_VOICES: GhostTtsVoiceOption[] = [
  {
    id: "vi-VN-HoaiMyNeural",
    label: "Hoài My",
    subtitle: "Nữ · Tiếng Việt",
  },
  {
    id: "vi-VN-NamMinhNeural",
    label: "Nam Minh",
    subtitle: "Nam · Tiếng Việt",
  },
];

export const DEFAULT_GHOST_TTS_VOICE_ID = GHOST_TTS_VOICES[0].id;
