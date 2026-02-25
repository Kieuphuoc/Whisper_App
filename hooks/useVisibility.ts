import { Visibility } from '@/types';
import { useState } from 'react';

export function useVisibility(defaultValue: Visibility = 'PUBLIC') {
  const [visibility, setVisibility] = useState<Visibility>(defaultValue);

  return {
    visibility,
    setVisibility,
  };
}
