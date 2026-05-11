import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL

export const endpoints = {
  // Auth
  login: "/auth/login/",
  register: "/auth/register/",
  googleLogin: "/auth/google",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",

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
  myAchievements: "/user/me/achievements",
  myDiscovered: "/user/me/discovered",
  userAchievements: (id: string | number) => `/user/${id}/achievements`,
  userDiscovered: (id: string | number) => `/user/${id}/discovered`,
  searchUsers: (q: string) => `/user/search?q=${q}`,

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
  voiceAnalyze: "/voice/analyze/",
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
  notificationRoomRead: (roomId: string | number) => `/notification/room/${roomId}/read`,
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

  // Privacy Zones
  privacyZones: "/privacy-zone",
  privacyZoneToggle: (id: string | number) => `/privacy-zone/${id}/toggle`,
  privacyZoneDelete: (id: string | number) => `/privacy-zone/${id}`,
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
    const instance = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token}` }
    });
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
    return instance;
  }
  return axiosInstance;
};

// Global logout notification mechanism
let onUnauthorizedCallback: () => void = () => { };
let unauthorizedHandling: Promise<void> | null = null;

export const onUnauthorized = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

export const handleUnauthorized = async () => {
  if (unauthorizedHandling) return unauthorizedHandling;

  unauthorizedHandling = (async () => {
    console.log("[Axios Interceptor] 401 Unauthorized detected. Clearing storage and logging out.");
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    } catch (e) {
      console.error("Error during auto-logout", e);
    } finally {
      unauthorizedHandling = null;
    }
  })();

  return unauthorizedHandling;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
