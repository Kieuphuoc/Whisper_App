import axios, { AxiosInstance } from "axios";

const BASE_URL = "http://192.168.88.104:5000";

export const endpoints = {
  // Auth
  login: "/auth/login/",

  // User
  me: "/user/me/",
  meStats: "/me/stats/",
  userProfile: (id: string | number) => `/user/${id}`,
  userStats: (id: string | number) => `/user/${id}/stats/`,

  // Voice Pins
  voice: "/voice/",
  createVoicePin: "/voice/",
  voiceDetail: (id: string | number) => `/voice/${id}/`,
  updateVoicePin: (id: string | number) => `/voice/${id}`,
  deleteVoicePin: (id: string | number) => `/voice/${id}`,
  voicePublic: "/voice/public/",
  voicePublicByUser: (id: string | number) => `/voice/user/${id}/public/`,
  voiceFriends: "/voice/friends/",
  voiceDetail: (id: string | number): string => `/voice/${id}/`,
  voiceReactions: (id: string | number): string => `/voice/${id}/reactions/`,
  voiceComments: (id: string | number): string => `/voice/${id}/comments/`,
  commentReplies: (commentId: string | number): string => `/comments/${commentId}/replies/`,
  translate: (sourceText: string, targetLang = 'vi'): string => `/translate/?q=${encodeURIComponent(sourceText)}&target=${encodeURIComponent(targetLang)}`,
  login: "/auth/login/",
  register: "/auth/register/",
  review: (event_id: string | number): string => `/event/${event_id}/reviews/`,
  userMe: "/user/me",
  userStats: "/user/me/stats",
  // Notifications
  notifications: "/notification/",
  notificationsUnread: "/notification/unread",
  notificationRead: (id: string | number) => `/notification/${id}/read`,
  notificationsReadAll: "/notification/read-all",
  notificationsClear: "/notification/clear",
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
    },
  });
};

const defaultAxios = axios.create({
  baseURL: BASE_URL,
});

export default defaultAxios;
