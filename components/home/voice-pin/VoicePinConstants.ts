import { Ionicons } from "@expo/vector-icons";

export const VISIBILITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  PUBLIC: "earth-outline",
  FRIENDS: "people-outline",
  PRIVATE: "lock-closed-outline",
};

export const REACTION_TYPES = [
  { type: "LIKE", label: "Thích", icon: "thumbs-up" as const, color: "#3b82f6", image: require("../../../assets/reactions/like.webp") },
  { type: "LOVE", label: "Yêu", icon: "heart" as const, color: "#f43f5e", image: require("../../../assets/reactions/love.webp") },
  { type: "LAUGH", label: "Haha", icon: "happy" as const, color: "#f59e0b", image: require("../../../assets/reactions/cry.webp") },
  { type: "ANGRY", label: "Giận", icon: "flame" as const, color: "#ef4444", image: require("../../../assets/reactions/angry.webp") },
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
