'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Swords,
  User,
  Trophy,
  Users,
  Shield,
  Store,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { motion } from 'framer-motion';

const LobbyButton = ({
  icon,
  label,
  onClick,
  disabled = false,
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  const Icon = icon;
  return (
    <motion.div whileHover={{ scale: disabled ? 1 : 1.05 }} whileTap={{ scale: disabled ? 1 : 0.95 }}>
      <Button
        onClick={onClick}
        disabled={disabled}
        className={`w-full h-24 font-display flex-col gap-1 text-lg tracking-wider comic-badge-lg ${className}`}
      >
        <Icon className="h-8 w-8" />
        <span>{label}</span>
      </Button>
    </motion.div>
  );
};

export default function LobbyPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <p className="text-foreground text-2xl font-display animate-pulse">
          Cargando Sala...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <style jsx global>{`
        .comic-badge-lg {
          @apply rounded-2xl px-4 py-2 bg-amber-400 text-black font-display uppercase tracking-widest shadow-[0_6px_0_rgba(0,0,0,0.5)];
          box-shadow:
            0 6px 0 rgba(0, 0, 0, 0.5),
            0 0 0 4px #000;
          border: 4px solid white;
          transition: all 0.1s ease-in-out;
        }
        .comic-badge-lg:active {
          transform: translateY(4px);
          box-shadow:
            0 2px 0 rgba(0, 0, 0, 0.5),
            0 0 0 4px #000;
        }
        .comic-badge-lg:disabled {
            background-color: #6b7280;
            color: #d1d5db;
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
            box-shadow:
                0 6px 0 rgba(0, 0, 0, 0.5),
                0 0 0 4px #000;
        }
        .bg-play { background-color: #4ade80; }
        .bg-play:hover:not(:disabled) { background-color: #6ee7b7; }

        .bg-secondary-action { background-color: #60a5fa; }
        .bg-secondary-action:hover:not(:disabled) { background-color: #93c5fd; }
        
        .bg-logout { background-color: #f87171; }
        .bg-logout:hover:not(:disabled) { background-color: #fca5a5; }

      `}</style>
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-6xl font-display text-white drop-shadow-[5px_5px_0_rgba(0,0,0,0.8)] mb-4">
          Board Bombers
        </h1>
        <p className="text-amber-300 font-semibold text-lg mb-10">
          Bienvenido, {user.displayName || user.email}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2">
            <LobbyButton
              icon={Swords}
              label="Jugar"
              onClick={() => router.push('/game')}
              className="bg-play h-32 text-2xl"
            />
          </div>
          <LobbyButton icon={User} label="Perfil" onClick={() => {}} disabled className="bg-secondary-action"/>
          <LobbyButton icon={Trophy} label="Ranking" onClick={() => {}} disabled className="bg-secondary-action"/>
          <LobbyButton icon={Users} label="Amigos" onClick={() => {}} disabled />
          <LobbyButton icon={Shield} label="Club" onClick={() => {}} disabled />
          <LobbyButton icon={Store} label="Tienda" onClick={() => {}} disabled />
          <LobbyButton icon={Calendar} label="Eventos" onClick={() => {}} disabled />
        </div>

        <div className="mt-12 flex justify-center gap-6">
            <Button variant="ghost" onClick={() => {}} disabled className="text-slate-400 font-display flex items-center gap-2"><Settings/>Ajustes</Button>
            <Button variant="ghost" onClick={handleLogout} className="text-amber-300 font-display flex items-center gap-2 hover:text-amber-200"><LogOut/>Cerrar Sesión</Button>
        </div>
      </div>
    </div>
  );
}
