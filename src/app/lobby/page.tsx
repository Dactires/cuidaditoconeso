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
  variant = 'primary',
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'logout';
  className?: string;
}) => {
  const Icon = icon;
  
  const variants = {
    primary: 'comic-btn-primary',
    secondary: 'comic-btn-secondary',
    logout: 'bg-red-500 hover:bg-red-600 text-white',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`comic-btn w-full h-24 text-lg flex-col gap-1.5 ${variants[variant]} ${className}`}
    >
      <Icon className="h-8 w-8" />
      <span>{label}</span>
    </button>
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
      <div className="flex items-center justify-center h-full">
        <p className="comic-title text-2xl animate-pulse">
          Cargando Sala...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl text-center">
        <h1 className="comic-login-title mb-4">
          Board Bombers
        </h1>
        <p className="comic-login-subtitle mb-10">
          Bienvenido, {user.displayName || user.email}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2">
            <LobbyButton
              icon={Swords}
              label="Jugar"
              onClick={() => router.push('/game')}
              className="h-32 text-2xl"
            />
          </div>
          <LobbyButton icon={User} label="Perfil" onClick={() => {}} disabled />
          <LobbyButton icon={Trophy} label="Ranking" onClick={() => {}} disabled />
          <LobbyButton icon={Users} label="Amigos" onClick={() => {}} disabled />
          <LobbyButton icon={Shield} label="Club" onClick={() => {}} disabled />
          <LobbyButton icon={Store} label="Tienda" onClick={() => {}} disabled />
          <LobbyButton icon={Calendar} label="Eventos" onClick={() => {}} disabled />
        </div>

        <div className="mt-12 flex justify-center gap-6">
            <button disabled onClick={() => {}} className="comic-btn comic-btn-secondary disabled:opacity-50"><Settings/>Ajustes</button>
            <button onClick={handleLogout} className="comic-btn bg-red-600 text-white border-black hover:bg-red-700"><LogOut/>Cerrar Sesión</button>
        </div>
      </div>
    </div>
  );
}
