
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useStorage } from "@/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import useSound from "use-sound";

interface MusicContextType {
  playLobbyMusic: () => void;
  playBattleMusic: () => void;
  stopAllMusic: () => void;
  isLobbyPlaying: boolean;
  isBattlePlaying: boolean;
  isLoading: boolean;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const storage = useStorage();
  const [lobbyUrl, setLobbyUrl] = useState<string | null>(null);
  const [battleUrl, setBattleUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs to track active playback intention
  const isPlayingLobbyRef = useRef(false);
  const isPlayingBattleRef = useRef(false);

  useEffect(() => {
    const fetchMusicUrls = async () => {
      if (!storage) return;
      setIsLoading(true);
      
      const lobbyRef = ref(storage, "music/lobby.mp3");
      const battleRef = ref(storage, "music/battle.mp3");

      try {
        const lobbyDownloadUrl = await getDownloadURL(lobbyRef);
        setLobbyUrl(lobbyDownloadUrl);
      } catch (error) {
        if ((error as any).code !== 'storage/object-not-found') {
          console.error("Error fetching lobby music:", error);
        }
      }
      
      try {
        const battleDownloadUrl = await getDownloadURL(battleRef);
        setBattleUrl(battleDownloadUrl);
      } catch (error) {
         if ((error as any).code !== 'storage/object-not-found') {
          console.error("Error fetching battle music:", error);
        }
      }
      setIsLoading(false);
    };

    fetchMusicUrls();
  }, [storage]);
  
  const [playLobby, { stop: stopLobby, isPlaying: isLobbyAudioPlaying, sound: lobbySound }] =
    useSound(lobbyUrl, {
      volume: 0.2,
      onend: () => {
        if (isPlayingLobbyRef.current) {
          playLobby();
        }
      },
    });

  const [playBattle, { stop: stopBattle, isPlaying: isBattleAudioPlaying, sound: battleSound }] =
    useSound(battleUrl, {
      volume: 0.25,
      onend: () => {
        if (isPlayingBattleRef.current) {
          playBattle();
        }
      },
    });

  const stopAllMusic = useCallback(() => {
    isPlayingLobbyRef.current = false;
    isPlayingBattleRef.current = false;
    if (isLobbyAudioPlaying) stopLobby();
    if (isBattleAudioPlaying) stopBattle();
  }, [isLobbyAudioPlaying, stopLobby, isBattleAudioPlaying, stopBattle]);
  
  const playLobbyMusic = useCallback(() => {
    if (isLoading || !lobbyUrl) return;
    stopAllMusic();
    isPlayingLobbyRef.current = true;
    playLobby();
  }, [isLoading, lobbyUrl, playLobby, stopAllMusic]);

  const playBattleMusic = useCallback(() => {
    if (isLoading || !battleUrl) return;
    stopAllMusic();
    isPlayingBattleRef.current = true;
    playBattle();
  }, [isLoading, battleUrl, playBattle, stopAllMusic]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lobbySound?.pause();
        battleSound?.pause();
      } else {
        if (isPlayingLobbyRef.current) lobbySound?.play();
        if (isPlayingBattleRef.current) battleSound?.play();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Ensure music stops completely on component unmount
      if(lobbySound) lobbySound.stop();
      if(battleSound) battleSound.stop();
    };
  }, [lobbySound, battleSound]);

  return (
    <MusicContext.Provider
      value={{
        playLobbyMusic,
        playBattleMusic,
        stopAllMusic,
        isLobbyPlaying: isLobbyAudioPlaying,
        isBattlePlaying: isBattleAudioPlaying,
        isLoading,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicProvider");
  }
  return context;
};
