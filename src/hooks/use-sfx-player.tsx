
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
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Type for the dictionary of play functions
type PlayFunctions = {
  [key: string]: () => void;
};

interface SfxContextType {
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
  const { firestore, storage } = useFirebase();
  const [sfxMap, setSfxMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [playFunctions, setPlayFunctions] = useState<PlayFunctions>({});

  // 1. Fetch all sound URLs from Firestore and Storage
  useEffect(() => {
    const fetchAllSfxUrls = async () => {
      if (!firestore || !storage) return;
      
      setIsLoading(true);
      const urls = new Map<string, string>();
      try {
        // Fetch from card definitions in Firestore
        const cardImagesCollectionRef = collection(firestore, 'card-images');
        const snapshot = await getDocs(cardImagesCollectionRef);
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ability?.soundUrl && doc.id) {
            urls.set(doc.id, data.ability.soundUrl);
          }
        });
        
        // Fetch generic sounds from Storage
        const genericSounds = ['flip', 'draw', 'explosion'];
        await Promise.all(genericSounds.map(async (soundName) => {
            try {
                const soundRef = ref(storage, `sfx/${soundName}.mp3`);
                const url = await getDownloadURL(soundRef);
                urls.set(soundName, url);
            } catch (e) {
                console.warn(`Could not load sound: sfx/${soundName}.mp3`, e);
            }
        }));

        setSfxMap(urls);
      } catch (error) {
        console.error('Error fetching SFX URLs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllSfxUrls();
  }, [firestore, storage]);

  // 2. This effect provides the playSound function to the game logic module.
  useEffect(() => {
    // This is the master play function that the game logic will call via the API bridge
    const playSoundById = (soundId: string) => {
        const playFn = playFunctions[soundId];
        if (playFn) {
            playFn();
        } else {
            console.warn(`Sound not found or not ready for ID: ${soundId}`);
        }
    };
    
    gameSfxApi.playSoundById = playSoundById;

  }, [playFunctions]); // Re-create the master function if the playFunctions map changes

  const handlePlayReady = useCallback((id: string, playFn: () => void) => {
    setPlayFunctions(prev => ({...prev, [id]: playFn }));
  }, []);


  return (
    <SfxContext.Provider value={{ playSound: (id) => gameSfxApi.playSoundById(id), isLoading }}>
        {Array.from(sfxMap.entries()).map(([id, url]) => (
            <SoundHook key={id} soundId={id} url={url} onPlayReady={handlePlayReady} />
        ))}
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
