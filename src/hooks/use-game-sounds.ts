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
                const fUrl = await getDownloadURL(flipRef);
                setFlipUrl(fUrl);
            } catch (error) {
                 if ((error as any).code !== 'storage/object-not-found') {
                    console.error("Error fetching flip sound:", error);
                 }
            }
            try {
                const bombRef = ref(storage, 'sfx/explosion.mp3');
                const bUrl = await getDownloadURL(bombRef);
                setBombUrl(bUrl);
            } catch (error) {
                if ((error as any).code !== 'storage/object-not-found') {
                    console.error("Error fetching bomb sound:", error);
                }
            }
             try {
                const dealRef = ref(storage, 'sfx/draw.mp3');
                const dUrl = await getDownloadURL(dealRef);
                setDealUrl(dUrl);
            } catch (error) {
                if ((error as any).code !== 'storage/object-not-found') {
                    console.error("Error fetching deal sound:", error);
                }
            }
        }
        fetchSoundUrls();
    }, [storage]);


  const [playFlip] = useSound(flipUrl!, { volume: 0.35, soundEnabled: !!flipUrl });
  const [playBomb] = useSound(bombUrl!, { volume: 0.5, soundEnabled: !!bombUrl });
  const [playDeal] = useSound(dealUrl!, { volume: 0.4, soundEnabled: !!dealUrl });

  return { playFlip, playBomb, playDeal };
};
