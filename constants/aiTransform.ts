export type AiTransformOption = {
  id: string;
  label: string;
  subtitle: string;
  icon: string; // Ionicons name
  colors: [string, string]; // Gradient colors
  
  // Gradio API Configuration
  modelType?: "RVC v2" | "Beatrice v2";
  targetSpeaker?: number; // For Beatrice
  rvcModelUrl?: string; // Optional URL for .pth
  rvcIndexUrl?: string; // Optional URL for .index
  beatModelUrl?: string; // Optional URL for .pt.gz
};

export const AI_TRANSFORM_VOICES: AiTransformOption[] = [
  {
    id: "vi-VN-HoaiMyNeural",
    label: "Hoài My",
    subtitle: "Nữ · Truyền cảm, ấm áp",
    icon: "woman",
    colors: ["#8b5cf6", "#6d28d9"], // Purple
    modelType: "Beatrice v2",
    targetSpeaker: 0,
  },
  {
    id: "vi-VN-NamMinhNeural",
    label: "Nam Minh",
    subtitle: "Nam · Mạnh mẽ, tin cậy",
    icon: "man",
    colors: ["#3b82f6", "#1d4ed8"], // Blue
    modelType: "Beatrice v2",
    targetSpeaker: 1,
  },
  {
    id: "vi-VN-PhuongPaneNeural",
    label: "Mỹ An",
    subtitle: "Nữ · Nhẹ nhàng, trong trẻo",
    icon: "heart",
    colors: ["#ec4899", "#be185d"], // Pink
  },
  {
    id: "vi-VN-ThanhHienNeural",
    label: "Thanh Huy",
    subtitle: "Nam · Trầm ấm, sâu lắng",
    icon: "musical-notes",
    colors: ["#f59e0b", "#d97706"], // Amber/Gold
  },
  {
    id: "anime",
    label: "Anime Boy",
    subtitle: "Hoạt hình · Trẻ trung, năng động",
    icon: "sparkles",
    colors: ["#10b981", "#059669"], // Green
  },
  {
    id: "robot",
    label: "Robot Z",
    subtitle: "Người máy · Hiện đại, độc đáo",
    icon: "hardware-chip",
    colors: ["#64748b", "#334155"], // Slate
  },
];

export const DEFAULT_AI_TRANSFORM_VOICE_ID = AI_TRANSFORM_VOICES[0].id;
