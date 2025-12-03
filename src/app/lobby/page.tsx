'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { User, Crown, Store, Users, Trophy, LogOut, Settings, Star, Coins, Sword } from 'lucide-react';

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
    <div className="min-h-screen w-full bg-[#050816] text-slate-100 flex flex-col items-center">
      {/* FONDO DE PUNTITOS (por si no lo tenés ya en body) */}
      <div className="pointer-events-none fixed inset-0 opacity-30 -z-10"
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #1f2937 1px, transparent 0)', backgroundSize: '22px 22px' }} />

      {/* 1. HUD SUPERIOR */}
      <header className="w-full max-w-6xl px-6 pt-4 pb-2 flex items-center justify-between">
        {/* Logo mini */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-red-500 border-2 border-black flex items-center justify-center shadow-[0_4px_0_#000]">
            <span className="text-xl">💣</span>
          </div>
          <div className="leading-tight">
            <p className="font-[var(--comic-font-display)] text-lg tracking-[0.18em] uppercase">
              Board Bombers
            </p>
            <p className="text-[11px] text-amber-300 uppercase tracking-[0.2em]">
              Modo Clásico
            </p>
          </div>
        </div>

        {/* Monedas / gemas / ajustes */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 border-2 border-black shadow-[0_3px_0_#000]">
            <Coins className="w-4 h-4 text-yellow-300" />
            <span>1 250</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 border-2 border-black shadow-[0_3px_0_#000]">
            <Star className="w-4 h-4 text-cyan-300" />
            <span>80</span>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 border-2 border-black shadow-[0_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[0_5px_0_#000] transition">
            <Settings className="w-4 h-4" />
            <span>Ajustes</span>
          </button>
        </div>
      </header>

      {/* 2. ZONA CENTRAL */}
      <main className="w-full max-w-6xl flex-1 px-6 pb-6 flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Columna izquierda: jugador */}
        <section className="w-full lg:w-1/4 flex flex-col gap-4">
          {/* Tarjeta jugador */}
          <div className="bg-sky-900/80 border-[3px] border-black rounded-2xl p-4 shadow-[0_8px_0_#000]">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-sky-500 border-4 border-black flex items-center justify-center">
                <User className="w-7 h-7" />
              </div>
              <div>
                <p className="font-[var(--comic-font-display)] text-lg tracking-[0.18em] uppercase">
                  {user.displayName || 'Jugador'}
                </p>
                <p className="text-xs text-amber-300 font-semibold">Nivel 5 • Demo</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/70 border-2 border-black rounded-xl px-3 py-2 flex items-center justify-between">
                <span>Victorias</span>
                <span className="font-bold">23</span>
              </div>
              <div className="bg-slate-900/70 border-2 border-black rounded-xl px-3 py-2 flex items-center justify-between">
                <span>Racha</span>
                <span className="font-bold text-emerald-300">+3</span>
              </div>
            </div>
          </div>

          {/* Botones secundarios */}
          <div className="flex flex-col gap-2 text-sm">
            <LobbySecondaryButton icon={<Users className="w-4 h-4" />} label="Amigos" />
            <LobbySecondaryButton icon={<Crown className="w-4 h-4" />} label="Club" />
            <LobbySecondaryButton icon={<User className="w-4 h-4" />} label="Perfil" />
          </div>
        </section>

        {/* Columna central: tablero + Jugar */}
        <section className="w-full lg:w-2/4 flex flex-col items-center justify-between gap-4">
          {/* Panel central tipo arena */}
          <div className="w-full bg-sky-800/80 border-[4px] border-black rounded-[32px] pt-4 pb-5 px-4 shadow-[0_10px_0_#000] flex flex-col items-center gap-4">
            {/* Texto arriba del panel */}
            <div className="text-center">
              <p className="font-[var(--comic-font-display)] text-sm tracking-[0.3em] uppercase text-amber-300">
                Modo clásico
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Revelá cartas, esquivá bombas y suma más puntos que tu rival.
              </p>
            </div>

            {/* Mini preview del tablero */}
            <div className="bg-slate-900/70 border-2 border-black rounded-3xl px-4 py-4 flex flex-col gap-3 items-center">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                VISTA PREVIA TABLERO
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-xl bg-sky-500 border-[3px] border-black flex items-center justify-center shadow-[0_4px_0_#000]"
                  >
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase">
                      BOMBERS
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón Jugar grande */}
            <button 
              onClick={() => router.push('/game')}
              className="mt-1 w-full max-w-xs bg-emerald-400 border-[4px] border-black rounded-full py-3 flex items-center justify-center gap-2 shadow-[0_10px_0_#000] hover:-translate-y-1 hover:shadow-[0_14px_0_#000] active:translate-y-1 active:shadow-[0_4px_0_#000] transition-transform">
              <Sword className="w-5 h-5" />
              <span className="font-[var(--comic-font-display)] text-lg tracking-[0.3em] uppercase text-slate-900">
                Jugar
              </span>
            </button>
          </div>

          {/* Tooltip / mensaje */}
          <p className="text-[11px] text-slate-400 text-center mt-1">
            Consejo: plantar bombas en el tablero rival es más efectivo cuando tiene muchas cartas reveladas.
          </p>
        </section>

        {/* Columna derecha: Ranking / Tienda / Eventos */}
        <section className="w-full lg:w-1/4 flex flex-col gap-3">
          <LobbyPanel icon={<Trophy className="w-5 h-5" />} title="Ranking" subtitle="#124 en la Beta" />
          <LobbyPanel icon={<Store className="w-5 h-5" />} title="Tienda" subtitle="Aspectos de cartas pronto" />
          <LobbyPanel icon={<Crown className="w-5 h-5" />} title="Eventos" subtitle="Próximo torneo en 3 días" />
        </section>
      </main>

      {/* 3. BARRA INFERIOR */}
      <footer className="w-full max-w-6xl px-6 pb-4 flex items-center justify-between text-[11px] text-slate-400">
        <span>Versión 0.1.0 • Demo</span>
        <button onClick={handleLogout} className="flex items-center gap-1 text-amber-300 hover:text-amber-200">
          <LogOut className="w-3 h-3" />
          <span>Cerrar sesión</span>
        </button>
      </footer>
    </div>
  );
}

/* Componentes auxiliares */

function LobbySecondaryButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900/80 border-[3px] border-black shadow-[0_6px_0_#000] hover:-translate-y-0.5 hover:shadow-[0_8px_0_#000] transition">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-6 w-6 rounded-full bg-slate-800 border-2 border-black flex items-center justify-center">
          {icon}
        </span>
        <span className="font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <span className="text-[10px] text-slate-400">Ver</span>
    </button>
  );
}

function LobbyPanel({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button className="w-full text-left bg-slate-900/80 border-[3px] border-black rounded-2xl px-3 py-3 shadow-[0_8px_0_#000] hover:-translate-y-0.5 hover:shadow-[0_10px_0_#000] transition">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-sky-600 border-2 border-black flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="font-[var(--comic-font-display)] text-sm tracking-[0.2em] uppercase">
            {title}
          </p>
          <p className="text-[11px] text-slate-300">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}