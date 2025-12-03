"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useStorage } from "@/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import useSound from "use-sound";
import { SoundSprite } from "use-sound/dist/types";

interface MusicContextType {
  playLobbyMusic: () => void;
  playBattleMusic: () => void;
  stopAllMusic: () => void;
  isLobbyPlaying: boolean;
  isBattlePlaying: boolean;
  isLoading: boolean;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const sprite = {
  loop: [0, 60000, true] as [number, number, boolean], // Loop a 60-second segment
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const storage = useStorage();
  const [lobbyUrl, setLobbyUrl] = useState<string | null>(null);
  const [battleUrl, setBattleUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMusicUrls = async () => {
      if (!storage) return;
      setIsLoading(true);
      try {
        const lobbyRef = ref(storage, "music/lobby.mp3");
        const battleRef = ref(storage, "music/battle.mp3");

        const lobbyDownloadUrl = await getDownloadURL(lobbyRef);
        const battleDownloadUrl = await getDownloadURL(battleRef);

        setLobbyUrl(lobbyDownloadUrl);
        setBattleUrl(battleDownloadUrl);
      } catch (error) {
        console.error("Error fetching music URLs:", error);
        // It's okay if they don't exist, the player just won't play them.
      } finally {
        setIsLoading(false);
      }
    };

    fetchMusicUrls();
  }, [storage]);

  const [
    playLobby,
    { stop: stopLobby, isPlaying: isLobbyPlaying, sound: lobbySound },
  ] = useSound(lobbyUrl || "", {
    volume: 0.2,
    loop: true,
  });
  const [
    playBattle,
    { stop: stopBattle, isPlaying: isBattlePlaying, sound: battleSound },
  ] = useSound(battleUrl || "", {
    volume: 0.25,
    loop: true,
  });

  const playLobbyMusic = useCallback(() => {
    if (lobbyUrl && !isLobbyPlaying) {
      stopBattle();
      playLobby();
    }
  }, [lobbyUrl, isLobbyPlaying, stopBattle, playLobby]);

  const playBattleMusic = useCallback(() => {
    if (battleUrl && !isBattlePlaying) {
      stopLobby();
      playBattle();
    }
  }, [battleUrl, isBattlePlaying, stopLobby, playBattle]);

  const stopAllMusic = useCallback(() => {
    if (isLobbyPlaying) stopLobby();
    if (isBattlePlaying) stopBattle();
  }, [isLobbyPlaying, stopLobby, isBattlePlaying, stopBattle]);

  // Ensure sounds are stopped on unmount or page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lobbySound?.pause();
        battleSound?.pause();
      } else {
        if (isLobbyPlaying) lobbySound?.play();
        if (isBattlePlaying) battleSound?.play();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAllMusic();
    };
  }, [stopAllMusic, lobbySound, battleSound, isLobbyPlaying, isBattlePlaying]);


  return (
    <MusicContext.Provider
      value={{
        playLobbyMusic,
        playBattleMusic,
        stopAllMusic,
        isLobbyPlaying,
        isBattlePlaying,
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
