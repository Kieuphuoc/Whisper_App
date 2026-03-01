// hooks/useAdminVoices.ts
import { Visibility, VoicePin } from '@/types';
import { useState } from 'react';

export function useAdminVoices(initialData: VoicePin[]) {
  const [voices, setVoices] = useState<VoicePin[]>(initialData);
  const [filter, setFilter] = useState<Visibility | 'ALL'>('ALL');

  const filteredVoices =
    !voices || !Array.isArray(voices)
      ? []
      : filter === 'ALL'
        ? voices
        : voices.filter(v => v.visibility === filter);

  const hideVoice = (id: number) => {
    setVoices(prev =>
      prev.map(v =>
        v.id === id ? { ...v, visibility: 'PRIVATE' } : v
      )
    );
  };

  const deleteVoice = (id: number) => {
    setVoices(prev => prev.filter(v => v.id !== id));
  };

  return {
    voices: filteredVoices,
    setFilter,
    hideVoice,
    deleteVoice,
  };
}
