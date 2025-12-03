
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import MobileLobby from '@/components/game/MobileLobby';

// --- MAIN PAGE COMPONENT ---
export default function LobbyPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
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
      onPlay={() => router.push('/game')}
      onTabChange={(tab) => {
        console.log('Tab changed to:', tab);
        // Example navigation:
        // if (tab === 'collection') router.push('/collection');
      }}
    />
  );
}
