'use client';
import useSound from 'use-sound';

export const useGameSounds = () => {
  const [playFlip] = useSound('/sfx/flip.mp3', { volume: 0.35 });
  const [playBomb] = useSound('/sfx/explosion.mp3', { volume: 0.5 });
  const [playDeal] = useSound('/sfx/draw.mp3', { volume: 0.4 });

  return { playFlip, playBomb, playDeal };
};
