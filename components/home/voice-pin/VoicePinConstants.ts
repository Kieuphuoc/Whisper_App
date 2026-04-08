import { Ionicons } from "@expo/vector-icons";

export const VISIBILITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  PUBLIC: "earth-outline",
  FRIENDS: "people-outline",
  PRIVATE: "lock-closed-outline",
};

export const REACTION_TYPES = [
  { type: "LIGHT_TAP", label: "Chạm nhẹ", icon: "radio-button-on-outline" as const },
  { type: "EMPATHY", label: "Đồng cảm", icon: "pulse-outline" as const },
  { type: "RELAX", label: "Thư giãn", icon: "water-outline" as const },
  { type: "STRONG", label: "Mạnh", icon: "flash-outline" as const },
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number]["type"];

export const REPORT_REASONS = [
  { key: 'SPAM', label: 'Spam', icon: 'mail-unread-outline' as const },
  { key: 'HARASSMENT', label: 'Quấy rối', icon: 'hand-left-outline' as const },
  { key: 'HATE_SPEECH', label: 'Ngôn từ thù hận', icon: 'warning-outline' as const },
  { key: 'VIOLENCE', label: 'Bạo lực', icon: 'skull-outline' as const },
  { key: 'NUDITY', label: 'Nội dung nhạy cảm', icon: 'eye-off-outline' as const },
  { key: 'MISINFORMATION', label: 'Thông tin sai lệch', icon: 'newspaper-outline' as const },
  { key: 'COPYRIGHT', label: 'Vi phạm bản quyền', icon: 'copy-outline' as const },
  { key: 'OTHER', label: 'Lý do khác', icon: 'ellipsis-horizontal-outline' as const },
] as const;
