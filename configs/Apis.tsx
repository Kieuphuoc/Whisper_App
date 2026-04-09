import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Constants from "expo-constants";

// Helper function to resolve the local backend IP automatically based on Metro's host IP
const getLocalIP = () => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      return hostUri.split(':')[0];
    }
  } catch (e) {
    console.error("Could not determine local IP from Expo Constants", e);
  }
  return "192.168.68.202"; // Ultimate fallback
};

// Priority: Environmental Variable > Local IP Fallback (Dynamic based on WiFi)
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${getLocalIP()}:5000`;

export const endpoints = {
  // Auth
  login: "/auth/login/",
  register: "/auth/register/",

  // User
  userMe: "/user/me",
  meStats: "/user/me/stats",
  userProfile: (id: string | number) => `/user/${id}`,
  userStats: (id: string | number) => `/user/${id}/stats`,
  userHistory: "/user/me/history",
  changePassword: "/user/me/password",
  userAvatar: "/user/me/avatar",
  userCover: "/user/me/cover",
  updateFcmToken: "/user/me/fcm-token",

  // Voice Pins
  voice: "/voice/",
  createVoicePin: "/voice/",
  voiceDetail: (id: string | number) => `/voice/${id}/`,
  updateVoicePin: (id: string | number) => `/voice/${id}`,
  deleteVoicePin: (id: string | number) => `/voice/${id}`,
  voicePublic: "/voice/public/",
  voicePublicByUser: (id: string | number) => `/voice/user/${id}/public/`,
  voiceFriends: "/voice/friends/",
  voiceRandom: "/voice/random",
  voiceBBox: "/voice/bbox",
  voiceDiscover: (id: string | number) => `/voice/${id}/discover`,
  voiceReactions: (id: string | number): string => `/voice/${id}/reactions/`,
  voiceComments: (id: string | number): string => `/voice/${id}/comments/`,
  commentReplies: (commentId: string | number): string => `/comments/${commentId}/replies/`,

  // Reactions
  reaction: "/reaction/",
  reactionDelete: (voicePinId: string | number) => `/reaction/${voicePinId}`,
  reactionSummary: (voicePinId: string | number) => `/reaction/voice/${voicePinId}/summary`,
  translate: (sourceText: string, targetLang = 'vi'): string => `/translate/?q=${encodeURIComponent(sourceText)}&target=${encodeURIComponent(targetLang)}`,

  // Notifications
  notifications: "/notification/",
  notificationsUnread: "/notification/unread",
  notificationRead: (id: string | number) => `/notification/${id}/read`,
  notificationsReadAll: "/notification/read-all",
  notificationsClear: "/notification/clear",

  // Reports
  submitReport: '/report/',
  myReports: '/report/my',
  reportDetail: (id: string | number) => `/report/${id}`,

  // Friends
  friendList: (userId: string | number) => `/friend/list/${userId}`,
  friendPending: "/friend/pending",
  friendRequest: "/friend/request",
  friendRespond: (id: string | number) => `/friend/request/${id}/respond`,
  friendCancel: (id: string | number) => `/friend/request/${id}`,
  friendRemove: "/friend/remove",
  friendStatus: (userId: string | number) => `/friend/status/${userId}`,

  // Chat
  chatRooms: "/chat/rooms",
  chatMessages: (roomId: string | number) => `/chat/rooms/${roomId}/messages`,
  chatSend: (roomId: string | number) => `/chat/rooms/${roomId}/send`,
  chatPrivate: (targetUserId: string | number) => `/chat/private/${targetUserId}`,
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching token for API request", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// For backward compatibility while we refactor, but we should eventually use axiosInstance directly
export const authApis = (token?: string) => {
  if (token) {
    // If token is explicitly passed, use it, but prefer the interceptor approach
    return axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  return axiosInstance;
};

export default axiosInstance;
