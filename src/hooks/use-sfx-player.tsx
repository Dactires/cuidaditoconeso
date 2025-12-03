
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { gameSfxApi } from '@/lib/game-logic';
import useSound from 'use-sound';

// Type for the dictionary of play functions
type PlayFunctions = {
  [key: string]: () => void;
};

interface SfxContextType {
  // This function is now mostly for internal/debugging use if needed
  playSound: (cardId: string) => void;
  isLoading: boolean;
}

const SfxContext = createContext<SfxContextType | undefined>(undefined);

// This component is the key to the fix.
// It receives a SINGLE url and id, and calls useSound for it.
// It will be rendered multiple times in a loop, which is safe.
const SoundHook = ({ soundId, url, onPlayReady }: { soundId: string, url: string, onPlayReady: (id: string, playFn: () => void) => void }) => {
    const [play] = useSound(url, { volume: 0.35, interrupt: true });

    useEffect(() => {
        onPlayReady(soundId, play);
    }, [soundId, play, onPlayReady]);

    return null; // This component doesn't render anything visible.
}


export const SfxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { firestore } = useFirebase();
  const [sfxMap, setSfxMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch all sound URLs from Firestore
  useEffect(() => {
    const fetchAllSfxUrls = async () => {
      if (!firestore) return;
      
      setIsLoading(true);
      const urls = new Map<string, string>();
      try {
        const cardImagesCollectionRef = collection(firestore, 'card-images');
        const snapshot = await getDocs(cardImagesCollectionRef);
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ability?.soundUrl && doc.id) {
            urls.set(doc.id, data.ability.soundUrl);
          }
        });
        // Set basic sounds manually
        urls.set('flip', '/sfx/flip.mp3');
        urls.set('draw', '/sfx/draw.mp3');

        setSfxMap(urls);
      } catch (error) {
        console.error('Error fetching SFX URLs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllSfxUrls();
  }, [firestore]);

  // IMPORTANT: This effect provides the playSound function to the game logic module.
  useEffect(() => {
    // This is the master play function that the game logic will call via the API bridge
    const playSoundById = (cardId: string) => {
        const url = sfxMap.get(cardId);
        if (url) {
            // It's not the most optimal to create an Audio object on the fly,
            // but it avoids the Rules of Hooks issue and is reliable.
            // For a production app, a more complex pooling system would be better.
            const audio = new Audio(url);
            audio.volume = 0.35;
            audio.play().catch(console.error);
        }
    };
    
    gameSfxApi.playSoundById = playSoundById;

  }, [sfxMap]); // Re-create the master function if the sfxMap changes

  // Since we are not using the context for now, we can simplify this.
  const value = { playSound: (id: string) => gameSfxApi.playSoundById(id), isLoading };

  return (
    <SfxContext.Provider value={value}>
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
