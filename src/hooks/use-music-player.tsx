
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useStorage } from "@/firebase";
import { ref, getDownloadURL } from "firebase/storage";

// Define el tipo para el contexto de la música
interface MusicContextType {
  playLobbyMusic: () => void;
  playBattleMusic: () => void;
  stopAllMusic: () => void;
  isLoading: boolean;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// --- Componente de Audio Oculto ---
// Este componente manejará los elementos <audio> nativos
const AudioPlayer = ({
  lobbyUrl,
  battleUrl,
  lobbyRef,
  battleRef,
}: {
  lobbyUrl: string | null;
  battleUrl: string | null;
  lobbyRef: React.RefObject<HTMLAudioElement>;
  battleRef: React.RefObject<HTMLAudioElement>;
}) => {
  return (
    <>
      {lobbyUrl && (
        <audio
          ref={lobbyRef}
          src={lobbyUrl}
          loop
          preload="auto"
          className="hidden"
        />
      )}
      {battleUrl && (
        <audio
          ref={battleRef}
          src={battleUrl}
          loop
          preload="auto"
          className="hidden"
        />
      )}
    </>
  );
};


// --- Proveedor de Música ---
export const MusicProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const storage = useStorage();
  const [lobbyUrl, setLobbyUrl] = useState<string | null>(null);
  const [battleUrl, setBattleUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs para los elementos <audio>
  const lobbyAudioRef = useRef<HTMLAudioElement>(null);
  const battleAudioRef = useRef<HTMLAudioElement>(null);

  // Efecto para obtener las URLs de la música desde Firebase
  useEffect(() => {
    const fetchMusicUrls = async () => {
      if (!storage) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const lobbyRef = ref(storage, "music/lobby.mp3");
        const battleRef = ref(storage, "music/battle.mp3");

        const [lobbyDownloadUrl, battleDownloadUrl] = await Promise.all([
          getDownloadURL(lobbyRef).catch(e => {
            if ((e as any).code !== 'storage/object-not-found') console.error("Error fetching lobby music:", e);
            return null;
          }),
          getDownloadURL(battleRef).catch(e => {
            if ((e as any).code !== 'storage/object-not-found') console.error("Error fetching battle music:", e);
            return null;
          }),
        ]);
        
        setLobbyUrl(lobbyDownloadUrl);
        setBattleUrl(battleDownloadUrl);

      } catch (error) {
        console.error("An unexpected error occurred while fetching music URLs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMusicUrls();
  }, [storage]);
  
  const setVolume = () => {
    if (lobbyAudioRef.current) lobbyAudioRef.current.volume = 0.25;
    if (battleAudioRef.current) battleAudioRef.current.volume = 0.25;
  }

  // Funciones de control de música
  const playLobbyMusic = useCallback(() => {
    if (isLoading || !lobbyAudioRef.current) return;
    setVolume();
    battleAudioRef.current?.pause();
    lobbyAudioRef.current?.play().catch(console.error);
  }, [isLoading]);

  const playBattleMusic = useCallback(() => {
    if (isLoading || !battleAudioRef.current) return;
    setVolume();
    lobbyAudioRef.current?.pause();
    battleAudioRef.current?.play().catch(console.error);
  }, [isLoading]);

  const stopAllMusic = useCallback(() => {
    lobbyAudioRef.current?.pause();
    battleAudioRef.current?.pause();
  }, []);
  
    // Pausa la música si la pestaña no está visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllMusic();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopAllMusic]);


  return (
    <MusicContext.Provider
      value={{ playLobbyMusic, playBattleMusic, stopAllMusic, isLoading }}
    >
      <AudioPlayer
        lobbyUrl={lobbyUrl}
        battleUrl={battleUrl}
        lobbyRef={lobbyAudioRef}
        battleRef={battleAudioRef}
      />
      {children}
    </MusicContext.Provider>
  );
};


// --- Hook para usar el reproductor ---
export const useMusicPlayer = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicProvider");
  }
  return context;
};
