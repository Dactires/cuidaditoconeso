
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
import type { PlayFunction, StopFunction, Sound } from "use-sound/dist/types";

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

  // Refs to store the playback functions and sound instances
  const lobbySoundRef = useRef<{ play: PlayFunction; stop: StopFunction; sound: Sound | null; isPlaying: boolean; } | null>(null);
  const battleSoundRef = useRef<{ play: PlayFunction; stop: StopFunction; sound: Sound | null; isPlaying: boolean; } | null>(null);

  // This state is just to trigger re-renders when playback status changes
  const [playbackState, setPlaybackState] = useState({ lobby: false, battle: false });

  // Fetch URLs from Firebase Storage
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
  
  // Custom hook to manage sound loading and playback
  const useMusicTrack = (url: string | null) => {
    const [play, { stop, sound, isPlaying }] = useSound(url, {
        volume: 0.25,
        loop: true, // Use the library's loop for simplicity now
        // onend will be ignored if loop is true, but good practice
        onplay: () => setPlaybackState(s => ({...s, [sound?.src === lobbyUrl ? 'lobby' : 'battle']: true})),
        onstop: () => setPlaybackState(s => ({...s, [sound?.src === lobbyUrl ? 'lobby' : 'battle']: false})),
        onend: () => setPlaybackState(s => ({...s, [sound?.src === lobbyUrl ? 'lobby' : 'battle']: false})),
    });
    return { play, stop, sound, isPlaying };
  };

  const lobbyAudio = useMusicTrack(lobbyUrl);
  const battleAudio = useMusicTrack(battleUrl);

  useEffect(() => {
    lobbySoundRef.current = lobbyAudio;
    battleSoundRef.current = battleAudio;
  }, [lobbyAudio, battleAudio]);

  const stopAllMusic = useCallback(() => {
    lobbySoundRef.current?.stop();
    battleSoundRef.current?.stop();
  }, []);
  
  const playLobbyMusic = useCallback(() => {
    if (isLoading || !lobbyUrl) return;
    stopAllMusic();
    lobbySoundRef.current?.play();
  }, [isLoading, lobbyUrl, stopAllMusic]);

  const playBattleMusic = useCallback(() => {
    if (isLoading || !battleUrl) return;
    stopAllMusic();
    battleSoundRef.current?.play();
  }, [isLoading, battleUrl, stopAllMusic]);

  // Handle browser tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lobbySoundRef.current?.sound?.pause();
        battleSoundRef.current?.sound?.pause();
      } else {
        if (lobbySoundRef.current?.isPlaying) lobbySoundRef.current?.sound?.play();
        if (battleSoundRef.current?.isPlaying) battleSoundRef.current?.sound?.play();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Ensure music stops completely on component unmount
      lobbySoundRef.current?.sound?.unload();
      battleSoundRef.current?.sound?.unload();
    };
  }, []);

  return (
    <MusicContext.Provider
      value={{
        playLobbyMusic,
        playBattleMusic,
        stopAllMusic,
        isLobbyPlaying: playbackState.lobby,
        isBattlePlaying: playbackState.battle,
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
