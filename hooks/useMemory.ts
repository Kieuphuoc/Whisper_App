import { Emotion, VoicePin } from '@/types';
import { useMemo, useState } from 'react';

export function useMemory(data: VoicePin[]) {
  const [emotionFilter, setEmotionFilter] = useState<Emotion | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const memories = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter((item) => {
      const year = new Date(item.createdAt).getFullYear();

      if (emotionFilter && item.emotionLabel !== emotionFilter) return false;
      if (yearFilter && year !== yearFilter) return false;

      return true;
    });
  }, [data, emotionFilter, yearFilter]);

  return {
    memories,
    setEmotionFilter,
    setYearFilter,
  };
}
