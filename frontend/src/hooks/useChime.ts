import { useCallback } from 'react';
import { playPurrChime } from '../utils/sound';

export function useChime() {
  const play = useCallback(() => {
    playPurrChime();
  }, []);

  return { playChime: play };
}
