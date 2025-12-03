'use client';
import useSound from 'use-sound';
import { useStorage } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { useEffect, useState } from 'react';

export const useGameSounds = () => {
    const storage = useStorage();
    const [flipUrl, setFlipUrl] = useState<string | null>(null);
    const [bombUrl, setBombUrl] = useState<string | null>(null);
    const [dealUrl, setDealUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchSoundUrls = async () => {
            if (!storage) return;
            try {
                const flipRef = ref(storage, 'sfx/flip.mp3');
                const bombRef = ref(storage, 'sfx/explosion.mp3');
                const dealRef = ref(storage, 'sfx/draw.mp3');

                const [fUrl, bUrl, dUrl] = await Promise.all([
                    getDownloadURL(flipRef).catch(() => null),
                    getDownloadURL(bombRef).catch(() => null),
                    getDownloadURL(dealRef).catch(() => null)
                ]);
                
                setFlipUrl(fUrl);
                setBombUrl(bUrl);
                setDealUrl(dUrl);

            } catch (error) {
                console.error("Error fetching game sounds:", error);
            }
        }
        fetchSoundUrls();
    }, [storage]);


  const [playFlip] = useSound(flipUrl!, { volume: 0.35, soundEnabled: !!flipUrl });
  const [playBomb] = useSound(bombUrl!, { volume: 0.5, soundEnabled: !!bombUrl });
  const [playDeal] = useSound(dealUrl!, { volume: 0.4, soundEnabled: !!dealUrl });

  return { playFlip, playBomb, playDeal };
};
