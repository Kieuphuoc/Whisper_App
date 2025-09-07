import axios, { AxiosInstance } from "axios";

const BASE_URL = "http://192.168.88.104:5000/";

export const endpoints = {
  voice: "/voice/",
  createVoicePin: "/voice/",
  voicePublic: "/voice/public/",
  voiceFriends: "/voice/friends/",
  login: "/auth/login/",
  review: (event_id: string | number): string => `/event/${event_id}/reviews/`,
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
