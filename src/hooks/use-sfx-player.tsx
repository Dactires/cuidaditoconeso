
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { gameSfxApi } from '@/lib/game-logic';

interface SfxContextType {
  playSound: (url: string) => void;
  isLoading: boolean;
}

const SfxContext = createContext<SfxContextType | undefined>(undefined);

// Define a pool size for audio players
const POOL_SIZE = 5;

// This component manages a pool of <audio> elements
const AudioPool = ({
  sfxUrls,
  audioPoolRef,
}: {
  sfxUrls: Map<string, string>;
  audioPoolRef: React.RefObject<HTMLAudioElement[]>;
}) => {
  // Initialize the refs array if it's not already
  if (audioPoolRef.current === null) {
    (audioPoolRef as React.MutableRefObject<HTMLAudioElement[]>).current = [];
  }

  return (
    <>
      {Array.from({ length: POOL_SIZE }).map((_, i) => (
        <audio
          key={i}
          ref={(el) => {
            if (el && audioPoolRef.current) {
              audioPoolRef.current[i] = el;
            }
          }}
          preload="auto"
          className="hidden"
        />
      ))}
    </>
  );
};

export const SfxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { firestore } = useFirebase();
  const [sfxUrls, setSfxUrls] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Ref for the pool of <audio> elements
  const audioPoolRef = useRef<HTMLAudioElement[]>([]);
  const nextAudioIndex = useRef(0);

  // Fetch all ability sound URLs from Firestore on mount
  useEffect(() => {
    const fetchAllSfxUrls = async () => {
      if (!firestore) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const cardImagesCollectionRef = collection(firestore, 'card-images');
        const snapshot = await getDocs(cardImagesCollectionRef);
        const urls = new Map<string, string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ability?.soundUrl) {
            // Use doc.id as a key if you want to reference sound by card ID,
            // or the URL itself if you pass the full URL to playSound.
            urls.set(data.ability.soundUrl, data.ability.soundUrl);
          }
        });
        setSfxUrls(urls);
      } catch (error) {
        console.error('Error fetching SFX URLs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllSfxUrls();
  }, [firestore]);

  // The function to play a sound from the pool
  const playSound = useCallback((url: string) => {
    if (isLoading || !sfxUrls.has(url) || !audioPoolRef.current) return;

    const audio = audioPoolRef.current[nextAudioIndex.current];
    if (audio) {
      audio.src = url;
      audio.volume = 0.3; // Set desired volume
      audio.play().catch((e) => console.error('SFX play error:', e));
    }

    // Move to the next audio element in the pool
    nextAudioIndex.current = (nextAudioIndex.current + 1) % POOL_SIZE;
  }, [isLoading, sfxUrls]);

  // IMPORTANT: This effect provides the playSound function to the game logic module.
  useEffect(() => {
    gameSfxApi.playSound = playSound;
  }, [playSound]);

  return (
    <SfxContext.Provider value={{ playSound, isLoading }}>
      <AudioPool sfxUrls={sfxUrls} audioPoolRef={audioPoolRef} />
      {children}
    </SfxContext.Provider>
  );
};

// Hook to use the SFX player (optional, if needed in other UI components)
export const useSfxPlayer = () => {
  const context = useContext(SfxContext);
  if (context === undefined) {
    throw new Error('useSfxPlayer must be used within an SfxProvider');
  }
  return context;
};
