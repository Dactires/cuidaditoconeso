
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

// A dummy component that holds the useSound hooks to build the play functions map
const SoundHooksComponent = ({
  sfxMap,
  onFunctionsReady,
}: {
  sfxMap: Map<string, string>;
  onFunctionsReady: (functions: PlayFunctions) => void;
}) => {
  const playFunctions: PlayFunctions = {};

  sfxMap.forEach((url, id) => {
    const [play] = useSound(url, { volume: 0.35, interrupt: true });
    playFunctions[id] = play;
  });

  useEffect(() => {
    // Pass the newly created functions object up to the provider
    onFunctionsReady(playFunctions);
    // This effect should only re-run if the map of URLs itself changes.
    // The functions object is re-created on every render, so it can't be a dependency.
  }, [sfxMap]); // eslint-disable-line react-hooks/exhaustive-deps

  return null; // This component doesn't render anything
};


export const SfxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { firestore } = useFirebase();
  const [sfxMap, setSfxMap] = useState<Map<string, string>>(new Map());
  const [playFunctions, setPlayFunctions] = useState<PlayFunctions>({});
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
      }
    };
    fetchAllSfxUrls();
  }, [firestore]);

  // The master play function that the game logic will call
  const playSoundById = useCallback((cardId: string) => {
    const playFn = playFunctions[cardId];
    if (playFn) {
      playFn();
    }
  }, [playFunctions]);

  // IMPORTANT: This effect provides the playSound function to the game logic module.
  useEffect(() => {
    gameSfxApi.playSoundById = playSoundById;
  }, [playSoundById]);

  // Callback for when the sound hooks are ready
  const handleFunctionsReady = useCallback((functions: PlayFunctions) => {
    setPlayFunctions(functions);
    if(Object.keys(functions).length > 0) {
        setIsLoading(false);
    }
  }, []);

  return (
    <SfxContext.Provider value={{ playSound: playSoundById, isLoading }}>
      {/* The SoundHooksComponent is now a child and updates this provider's state via callback */}
      <SoundHooksComponent sfxMap={sfxMap} onFunctionsReady={handleFunctionsReady} />
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
