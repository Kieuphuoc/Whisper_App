import { Visibility } from '@/types';
import { useState } from 'react';

export function useVisibility(defaultValue: Visibility = 'FRIENDS') {
  const [visibility, setVisibility] = useState<Visibility>(defaultValue);

  return {
    visibility,
    setVisibility,
  };
}
