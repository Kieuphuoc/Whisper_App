import axios, { AxiosInstance } from "axios";

export const BASE_URL = "http://10.5.1.190:5000";

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
};

export const authApis = (token: string): AxiosInstance => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      // Content-Type header is removed to allow automatic boundary generation for FormData
    },
  });
};

const defaultAxios = axios.create({
  baseURL: BASE_URL,
});

export default defaultAxios;
