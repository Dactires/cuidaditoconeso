
'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import MobileLobby from '@/components/game/MobileLobby';
import { CARD_DEFINITIONS, GameCardDef } from '@/lib/card-definitions';
import { collection, getDocs } from 'firebase/firestore';
import { useMusicPlayer } from '@/hooks/use-music-player';


// Hook para cargar las imágenes de las cartas
const useCardDefinitionsWithImages = () => {
  const firestore = useFirestore();
  const [cardDefsWithImages, setCardDefsWithImages] = useState<GameCardDef[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCardImages = async () => {
      if (!firestore) return;
      setLoading(true);
      try {
        const imageCollectionRef = collection(firestore, 'card-images');
        const imageSnapshot = await getDocs(imageCollectionRef);
        const imageUrls = new Map<string, string>();
        imageSnapshot.forEach(doc => {
          imageUrls.set(doc.id, doc.data().imageUrl);
        });

        const enrichedDefs = CARD_DEFINITIONS.map(def => ({
          ...def,
          imageUrl: imageUrls.get(def.id) || def.imageUrl || undefined,
        }));

        setCardDefsWithImages(enrichedDefs);
      } catch (error) {
        console.error("Error fetching card images:", error);
        setCardDefsWithImages(CARD_DEFINITIONS); // Fallback to definitions without images
      } finally {
        setLoading(false);
      }
    };

    fetchCardImages();
  }, [firestore]);

  return { cardDefsWithImages, loading };
}


// --- MAIN PAGE COMPONENT ---
export default function LobbyPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { cardDefsWithImages, loading: areCardsLoading } = useCardDefinitionsWithImages();
  const router = useRouter();
  const { playLobbyMusic, stopAllMusic } = useMusicPlayer();

  const isUserLoading = isAuthLoading || areCardsLoading;

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    // Play lobby music when component mounts, stop other tracks
    stopAllMusic();
    playLobbyMusic();
  }, [playLobbyMusic, stopAllMusic]);


  if (isUserLoading || !user || !cardDefsWithImages) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="comic-title text-2xl animate-pulse">
          Cargando Sala...
        </p>
      </div>
    );
  }

  // Se renderiza siempre MobileLobby como la única vista del Lobby,
  // ya que su diseño es responsivo y se adapta a todas las pantallas.
  return (
    <MobileLobby
      playerName={user.displayName || "Jugador"}
      level={13}
      exp={281}
      expMax={300}
      coins={1000}
      gems={297}
      tickets={2}
      cardDefinitions={cardDefsWithImages}
      onPlay={() => router.push('/game')}
      onTabChange={(tab) => {
        console.log('Tab changed to:', tab);
        // Example navigation:
        // if (tab === 'collection') router.push('/collection');
      }}
    />
  );
}
