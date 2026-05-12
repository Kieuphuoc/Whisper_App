import AsyncStorage from '@react-native-async-storage/async-storage';
import { Visibility } from '../types';
import * as Location from 'expo-location';
import type { GhostEngineId } from '../constants/ghostEngines';

const DRAFTS_KEY = '@whisper:voice_drafts';

export interface VoiceDraft {
    id: string;
    audioUri: string;
    photoUri: string | null;
    location: Location.LocationObject | null;
    visibility: Visibility;
    /** Ghost Voice: TTS từ transcript */
    ghostVoice?: boolean;
    /** Giọng Azure (vd vi-VN-HoaiMyNeural) */
    ttsVoice?: string;
    /** tts | rvc */
    ghostEngine?: GhostEngineId;
    /** @deprecated dùng ghostVoice */
    isAnonymous?: boolean;
    transcription: string | null;
    emotionLabel: string;
    timestamp: number;
}

export const DraftStorage = {
    async saveDraft(draft: Omit<VoiceDraft, 'id' | 'timestamp'>): Promise<void> {
        try {
            const existingDrafts = await this.getDrafts();
            const newDraft: VoiceDraft = {
                ...draft,
                id: Date.now().toString(),
                timestamp: Date.now(),
            };
            const updatedDrafts = [newDraft, ...existingDrafts];
            await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    },

    async getDrafts(): Promise<VoiceDraft[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(DRAFTS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (error) {
            console.error('Error getting drafts:', error);
            return [];
        }
    },

    async deleteDraft(id: string): Promise<void> {
        try {
            const existingDrafts = await this.getDrafts();
            const updatedDrafts = existingDrafts.filter(d => d.id !== id);
            await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
        } catch (error) {
            console.error('Error deleting draft:', error);
        }
    },

    async clearAllDrafts(): Promise<void> {
        try {
            await AsyncStorage.removeItem(DRAFTS_KEY);
        } catch (error) {
            console.error('Error clearing drafts:', error);
        }
    }
};
