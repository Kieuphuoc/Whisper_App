import axios, { AxiosInstance } from "axios";

const BASE_URL = "http://192.168.88.104:5000/";

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

  // Comments
  getComments: (voiceId: string | number) => `/voice/${voiceId}/comment`,
  createComment: "/voice/", // (nên xem lại route cụ thể)
  updateComment: (commentId: string | number) => `/voice/${commentId}`,
  deleteComment: (commentId: string | number) => `/voice/${commentId}`,

  // Friends
  friendRequest: "/friend/request",
  friendRespond: (id: string | number) => `/friend/request/${id}/respond`,
  friendCancel: (id: string | number) => `/friend/request/${id}`,
  friendRemove: "/friend/remove",
  friendList: "/friend/list/",
  friendPending: "/friend/pending"
};

export const authApis = (token: string): AxiosInstance => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `${token}`,
    },
  });
};

const defaultAxios = axios.create({
  baseURL: BASE_URL,
});

export default defaultAxios;
