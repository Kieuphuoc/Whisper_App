export type AiTransformOption = {
  id: string;
  label: string;
  subtitle: string;
  icon: string; // Ionicons name
  colors: [string, string]; // Gradient colors
  
  // Gradio API Configuration
  modelType?: "RVC v2" | "Beatrice v2";
  targetSpeaker?: number; // For Beatrice
  pitch?: number; // Semitones (-12..12), used to differentiate voices in RVC mode
  rvcModelUrl?: string; // Optional URL for .pth
  rvcIndexUrl?: string; // Optional URL for .index
  beatModelUrl?: string; // Optional URL for .pt.gz
};

// The HF Space only exposes an example RVC model (BENEE8000). Beatrice v2 mode
// requires a user-supplied .pt.gz model file which we don't have, so all voices
// default to RVC v2 and differentiate using pitch shift.
export const AI_TRANSFORM_VOICES: AiTransformOption[] = [
  {
    id: "vi-VN-HoaiMyNeural",
    label: "Hoài My",
    subtitle: "Nữ · Truyền cảm, ấm áp",
    icon: "woman",
    colors: ["#8b5cf6", "#6d28d9"], // Purple
    modelType: "RVC v2",
    pitch: 4,
  },
  {
    id: "vi-VN-NamMinhNeural",
    label: "Nam Minh",
    subtitle: "Nam · Mạnh mẽ, tin cậy",
    icon: "man",
    colors: ["#3b82f6", "#1d4ed8"], // Blue
    modelType: "RVC v2",
    pitch: -3,
  },
  {
    id: "vi-VN-PhuongPaneNeural",
    label: "Mỹ An",
    subtitle: "Nữ · Nhẹ nhàng, trong trẻo",
    icon: "heart",
    colors: ["#ec4899", "#be185d"], // Pink
    modelType: "RVC v2",
    pitch: 6,
  },
  {
    id: "vi-VN-ThanhHienNeural",
    label: "Thanh Huy",
    subtitle: "Nam · Trầm ấm, sâu lắng",
    icon: "musical-notes",
    colors: ["#f59e0b", "#d97706"], // Amber/Gold
    modelType: "RVC v2",
    pitch: -5,
  },
  {
    id: "anime",
    label: "Anime Boy",
    subtitle: "Hoạt hình · Trẻ trung, năng động",
    icon: "sparkles",
    colors: ["#10b981", "#059669"], // Green
    modelType: "RVC v2",
    pitch: 10,
  },
  {
    id: "robot",
    label: "Robot Z",
    subtitle: "Người máy · Hiện đại, độc đáo",
    icon: "hardware-chip",
    colors: ["#64748b", "#334155"], // Slate
    modelType: "RVC v2",
    pitch: -8,
  },
];

export const DEFAULT_AI_TRANSFORM_VOICE_ID = AI_TRANSFORM_VOICES[0].id;
