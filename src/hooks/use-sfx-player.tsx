
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

// A component that pre-caches sounds and provides play functions
const SoundManager = ({
  setPlayFunctions,
}: {
  setPlayFunctions: (functions: PlayFunctions) => void;
}) => {
  const { firestore } = useFirebase();
  const [sfxMap, setSfxMap] = useState<Map<string, string>>(new Map());

  // 1. Fetch all sound URLs from Firestore
  useEffect(() => {
    const fetchAllSfxUrls = async () => {
      if (!firestore) return;
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
      }
    };
    fetchAllSfxUrls();
  }, [firestore]);

  // 2. This is a dummy component that just holds the useSound hooks
  const SoundHooks = () => {
    const playFunctions: PlayFunctions = {};
    
    // Create a useSound hook for each entry in the sfxMap
    sfxMap.forEach((url, id) => {
      const [play] = useSound(url, { volume: 0.35, interrupt: true });
      playFunctions[id] = play;
    });

    // 3. Update the parent's state with the created play functions
    useEffect(() => {
      setPlayFunctions(playFunctions);
    }, [sfxMap]); // Reruns when sfxMap changes

    return null; // This component doesn't render anything
  };

  return <SoundHooks />;
};


export const SfxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [playFunctions, setPlayFunctions] = useState<PlayFunctions>({});
  const [isLoading, setIsLoading] = useState(true);

  // The master play function that the game logic will call
  const playSoundById = useCallback((cardId: string) => {
    const playFn = playFunctions[cardId];
    if (playFn) {
      playFn();
    } else {
      // console.warn(`Sound not found for cardId: ${cardId}`);
    }
  }, [playFunctions]);

  // IMPORTANT: This effect provides the playSound function to the game logic module.
  useEffect(() => {
    gameSfxApi.playSoundById = playSoundById;
    // When playFunctions are ready, loading is done
    if(Object.keys(playFunctions).length > 0) {
        setIsLoading(false);
    }
  }, [playSoundById, playFunctions]);

  return (
    <SfxContext.Provider value={{ playSound: playSoundById, isLoading }}>
      {/* The SoundManager is now a child and updates this provider's state */}
      <SoundManager setPlayFunctions={setPlayFunctions} />
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
