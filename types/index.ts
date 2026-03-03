
export type Visibility = 'PRIVATE' | 'PUBLIC' | 'FRIENDS';

export const VISIBILITY_LIST: Visibility[] = [
    'PRIVATE',
    'FRIENDS',
    'PUBLIC',
];

export const VISIBILITY_LABEL: Record<Visibility, string> = {
    PRIVATE: 'Riêng tư',
    FRIENDS: 'Bạn bè',
    PUBLIC: 'Công khai',
};

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null;

export type SortType = 'time' | 'location' | 'emotion';


export interface User {
    id: number;
    username: string;
    email?: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
    level?: number;
    xp?: number;
    scanRadius?: number;
    token?: string;
    createdAt: string;
    updatedAt: string;
}


export interface UserBasic {
    displayName?: string;
    username?: string;
    avatar?: string;
}

export type UserAction =
    | { type: 'SET_USER'; payload: User }
    | { type: 'LOGOUT' };

export enum VoiceType {
    STANDARD = 'STANDARD',
    HIDDEN_AR = 'HIDDEN_AR',
}

export type Emotion =
    | 'Happy'
    | 'Sad'
    | 'Calm'
    | 'Nostalgic'
    | 'Romantic'
    | 'Curious';


export interface VoicePin {
    // --- Core ---
    id: number;
    audioUrl: string;
    content?: string;
    imageUrl?: string;

    // --- Location & Context ---
    latitude: number;
    longitude: number;
    address?: string;


    // --- Privacy & Mode ---
    visibility: Visibility;
    isAnonymous: boolean;

    // --- AR & Hidden Voice ---
    type: VoiceType;            // STANDARD | HIDDEN_AR
    unlockRadius: number;       // meters

    // --- AI & Emotion ---
    emotionLabel?: string;      // "Happy" | "Sad" | ...
    emotionScore?: number;      // 0 → 1
    stickerUrl?: string;

    // --- Device Metadata ---
    deviceModel?: string;       // "iPhone 14 Pro"
    osVersion?: string;         // "iOS 16.2"

    // --- Stats (denormalized) ---
    listensCount: number;
    reactionsCount: number;
    commentsCount: number;
    duration?: number;          // seconds

    // --- Relations ---
    userId?: number;
    user?: UserBasic;
    images?: Image[];

    // --- System ---
    createdAt: string;
    updatedAt?: string;
}

// ============ VoicePinCardProps ============

export interface VoicePinCardProps {
    voicePin: VoicePin;
    onClose: () => void;
}

// ============ VoicePinClusterProps ============

export interface VoicePinClusterProps {
    voicePins: VoicePin[];
    latitude?: number;
    longitude?: number;
    onPress: (voicePin: VoicePin) => void;
}

// ============ Image ============

export interface Image {
    id: number;
    imageUrl: string;
    createdAt: string;
    voicePinId: number;
}

// ============ Reaction ============

export interface Reaction {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    userId: number;
    voicePinId: number;
    user?: User;
}

// ============ Comment ============

export interface Comment {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: number;
    voicePinId: number;
    parentId?: number;
    user?: UserBasic;
    replies?: Comment[];
}

// ============ Friendship ============

export interface Friendship {
    id: number;
    senderId: number;
    receiverId: number;
    status: FriendRequestStatus;
    createdAt: string;
    updatedAt: string;
    sender?: User;
    receiver?: User;
}


// ============ RandomVoice ============

export interface RandomVoice {
    id: string;
    emotion: string;
    duration: string;
    distance: string;
    isPlaying: boolean;
    audioUrl?: string;
}

// ============ Memory ============

export interface Memory {
    id: number | string;
    emotionLabel: string;
    audioUrl: string;
    createdAt: string;
    content: string;
    address?: string;
    duration?: string;
}

// ============ Profile VoicePin ============

export interface ProfileVoicePin {
    id: string;
    title: string;
    emotion: string;
    duration: string;
    playCount: number;
    location: string;
}

export interface ViewHistory {
    id: number;
    viewedAt: string;
    userId: number;
    voicePinId: number;
    voicePin: VoicePin;
}

export type RootStackParamList = {
    voiceDetail: { voicePinId: string };
    home: undefined;
    '(tabs)': undefined;
    '(auth)': undefined;
};
