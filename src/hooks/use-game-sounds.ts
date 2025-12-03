
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useStorage } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import useSound from 'use-sound';

// Define el tipo para el contexto
interface GameSoundsContextType {
  playBomb: () => void;
  playFlip: () => void;
  playDeal: () => void;
  isLoading: boolean;
}

const GameSoundsContext = createContext<GameSoundsContextType | undefined>(
  undefined
);

// Define las rutas de los archivos de sonido en Firebase Storage
const sfxPaths = {
  bomb: 'sfx/explosion.mp3',
  flip: 'sfx/flip.mp3',
  deal: 'sfx/draw.mp3',
};

// --- Proveedor de Sonidos ---
export const GameSoundsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const storage = useStorage();
  const [bombUrl, setBombUrl] = useState<string | null>(null);
  const [flipUrl, setFlipUrl] = useState<string | null>(null);
  const [dealUrl, setDealUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para cargar las URLs de los sonidos
  useEffect(() => {
    const fetchSoundUrls = async () => {
      if (!storage) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Carga cada sonido individualmente para evitar que un error detenga a todos
        try {
          const bombRef = ref(storage, sfxPaths.bomb);
          setBombUrl(await getDownloadURL(bombRef));
        } catch (e) {
          console.warn(`Could not load sound: ${sfxPaths.bomb}`, e);
        }
        try {
          const flipRef = ref(storage, sfxPaths.flip);
          setFlipUrl(await getDownloadURL(flipRef));
        } catch (e) {
          console.warn(`Could not load sound: ${sfxPaths.flip}`, e);
        }
        try {
          const dealRef = ref(storage, sfxPaths.deal);
          setDealUrl(await getDownloadURL(dealRef));
        } catch (e) {
          console.warn(`Could not load sound: ${sfxPaths.deal}`, e);
        }

      } catch (error) {
        console.error("An unexpected error occurred fetching sound URLs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSoundUrls();
  }, [storage]);

  // Hooks de use-sound que solo se activan si la URL existe
  const [playBomb] = useSound(bombUrl!, { volume: 0.4, interrupt: true });
  const [playFlip] = useSound(flipUrl!, { volume: 0.5 });
  const [playDeal] = useSound(dealUrl!, { volume: 0.5 });

  const value = {
    playBomb: useCallback(() => bombUrl && playBomb(), [bombUrl, playBomb]),
    playFlip: useCallback(() => flipUrl && playFlip(), [flipUrl, playFlip]),
    playDeal: useCallback(() => dealUrl && playDeal(), [dealUrl, playDeal]),
    isLoading,
  };

  return (
    <GameSoundsContext.Provider value={value}>
      {children}
    </GameSoundsContext.Provider>
  );
};

// --- Hook para usar los sonidos ---
export const useGameSounds = () => {
  const context = useContext(GameSoundsContext);
  if (context === undefined) {
    throw new Error('useGameSounds must be used within a GameSoundsProvider');
  }
  return context;
};
