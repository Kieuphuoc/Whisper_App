import { Memory, RandomVoice, UserBasic, VoicePin, VoiceType } from "@/types";

const emotions = ["😊", "🎵", "🌅", "🔥", "💭", "😢", "🎉"];
const locations = [
  "Central Park",
  "Coffee Shop",
  "Library",
  "Beach",
  "Home",
  "Office",
  "Mountain",
];

const random = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const randomMinutes = () =>
  `${Math.floor(Math.random() * 3)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, "0")}`;

const randomLat = () => 10 + Math.random() * 0.1;
const randomLng = () => 106 + Math.random() * 0.1;

/* =====================================================
   Memory Mock
===================================================== */

export const generateMockMemories = (count = 15): Memory[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${i + 1}`,
    content: `Voice memory #${i + 1}`,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    latitude: randomLat(),
    longitude: randomLng(),
    duration: randomMinutes(),
    emotionLabel: random(emotions),
    address: random(locations),
  }));
};

const mockUser: UserBasic = {
  username: "abc",
  name: "Demo User",
  avatar: "https://i.pravatar.cc/150?img=3",
};

export const generateMockVoicePins = (count = 10): VoicePin[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    content: `Voice pin ${i + 1}`,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    latitude: randomLat(),
    longitude: randomLng(),
    visibility: "PUBLIC",
    createdAt: new Date().toISOString(),
    listensCount: Math.floor(Math.random() * 200),
    user: mockUser,
    emotionLabel: random(emotions),
    duration: Math.floor(Math.random() * 180),
    reactionsCount: Math.floor(Math.random() * 50),
    commentsCount: Math.floor(Math.random() * 10),
    type: VoiceType.STANDARD,
    isAnonymous: false,
    unlockRadius: 0,
    address: random(locations),
  }));
};

export const generateRandomVoices = (count = 8): RandomVoice[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `rv-${i}`,
    emotion: random(emotions),
    duration: randomMinutes(),
    distance: `${Math.floor(Math.random() * 500)}m`,
    isPlaying: false,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  }));
};
