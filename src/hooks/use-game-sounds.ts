'use client';
import useSound from 'use-sound';

export const useGameSounds = () => {
  const [playFlip] = useSound('/sounds/flip.mp3', { volume: 0.4 });
  const [playBomb] = useSound('/sounds/bomb.mp3', { volume: 0.5 });
  const [playDeal] = useSound('/sounds/deal.mp3', { volume: 0.3 });

  return { playFlip, playBomb, playDeal };
};
