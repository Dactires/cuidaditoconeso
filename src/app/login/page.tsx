'use client';

import React from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/login/login';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/lobby');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <p className="text-foreground text-2xl font-display animate-pulse">
          Cargando...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-body">
      <div className="w-full max-w-md">
        <h1 className="text-5xl font-display text-center text-white drop-shadow-[4px_4px_0_rgba(0,0,0,0.8)] mb-2">
          Board Bombers
        </h1>
        <p className="text-center text-amber-300 mb-8 font-semibold">
          Un juego de estrategia, riesgo y recompensa.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
