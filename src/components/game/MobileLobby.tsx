'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Gem, Coins, Users, Store, Sword, Star, Grid2X2, Gift, Hammer } from 'lucide-react';
import MobileCollection from './MobileCollection';

type TabId = 'battle' | 'collection' | 'shop' | 'club' | 'events';

interface MobileLobbyProps {
  playerName: string;
  level: number;
  exp: number;
  expMax: number;
  coins: number;
  gems: number;
  tickets?: number;
  onTabChange?: (tab: TabId) => void;
  onPlay?: () => void;
}

const TAB_META: Record<TabId, { label: string; desc: string }> = {
  battle: {
    label: 'Batalla',
    desc: 'Modo principal donde jugás partidas ranked 1 vs 1.',
  },
  collection: {
    label: 'Colección',
    desc: 'Muy pronto vas a poder mejorar y personalizar tus cartas.',
  },
  shop: {
    label: 'Tienda',
    desc: 'Próximamente: cofres, ofertas diarias y cosméticos.',
  },
  club: {
    label: 'Club',
    desc: 'Crea o unite a un club para compartir estrategias.',
  },
  events: {
    label: 'Eventos',
    desc: 'Modos especiales y torneos temporales en camino.',
  },
};

export default function MobileLobby({
  playerName,
  level,
  exp,
  expMax,
  coins,
  gems,
  tickets = 0,
  onTabChange,
  onPlay,
}: MobileLobbyProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>('battle');

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const expPercent = Math.min(100, Math.round((exp / Math.max(1, expMax)) * 100));

  const renderContent = () => {
    switch (activeTab) {
      case 'battle':
        return (
          <motion.div
            key="battle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <motion.section
              layout
              className="comic-card bg-[#0d4b63] border-[3px] border-slate-900 shadow-[0_10px_0_#020617] px-2 pt-2 pb-3"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex flex-col">
                  <span className="comic-section-title !text-[9px]">Modo principal</span>
                  <h2 className="comic-title text-lg text-white drop-shadow-[0_2px_0_#020617]">
                    Tablero de Explosiones
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-300 drop-shadow-[0_1px_0_#020617]" />
                  <span className="text-xs text-slate-100 font-semibold">Liga 1</span>
                </div>
              </div>
              <motion.div
                className="mt-1 relative w-full aspect-[16/11] rounded-2xl border-[3px] border-black bg-sky-500/30 overflow-hidden shadow-[0_6px_0_#020617]"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-white text-lg tracking-[0.2em] uppercase drop-shadow-[0_3px_0_#020617] text-center px-4">
                    Mapa / Vista del Tablero
                  </span>
                </div>
              </motion.div>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-100">
                  <span className="comic-section-title !text-[9px]">
                    Progreso de temporada
                  </span>
                  <span className="font-mono text-[11px] text-amber-200">
                    14 / 30 Trofeos
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-900 border-[2px] border-black overflow-hidden shadow-[0_2px_0_#020617]">
                  <div className="h-full bg-amber-400 w-1/3" />
                </div>
                <div className="flex justify-between mt-1">
                  {['common', 'common', 'rare', 'epic'].map((rarity, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -3, scale: 1.05 }}
                      className="w-10 h-10 rounded-xl bg-slate-900 border-[3px] border-black flex items-center justify-center shadow-[0_3px_0_#020617]"
                    >
                      <ChestIcon rarity={rarity as any} />
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.96, y: 2 }}
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  onClick={onPlay}
                  className="comic-btn comic-btn-primary !px-10 !py-3 text-base tracking-[0.25em]"
                >
                  ¡Batalla!
                </motion.button>
              </div>
            </motion.section>
            <LobbyInfoCard
              title="Misión diaria"
              subtitle="Ganás un cofre especial al conseguir 3 victorias hoy."
              icon={<Sword className="w-5 h-5 text-amber-300" />}
            />
          </motion.div>
        );
      case 'collection':
        return (
          <motion.div
            key="collection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full -mx-3"
          >
           <MobileCollection />
          </motion.div>
        );
      default:
        return (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <section className="comic-card bg-[#0d4b63] border-[3px] border-slate-900 shadow-[0_10px_0_#020617] px-3 py-6 flex flex-col items-center justify-center text-center gap-3">
              <motion.div
                animate={{ rotate: [-6, 4, -4, 6, -2, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-12 h-12 rounded-2xl bg-slate-900 border-[3px] border-black flex items-center justify-center shadow-[0_5px_0_#020617]"
              >
                <Hammer className="w-7 h-7 text-amber-300" />
              </motion.div>
              <h2 className="comic-title text-xl text-white">
                {TAB_META[activeTab].label} en construcción
              </h2>
              <p className="text-[12px] text-slate-100 max-w-xs">
                {TAB_META[activeTab].desc}
              </p>
              <span className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-amber-300 border-[3px] border-black text-[10px] font-display tracking-[0.18em] uppercase text-slate-900 shadow-[0_3px_0_#020617]">
                Próximamente
              </span>
            </section>

            <LobbyInfoCard
              title="Seguí jugando en Batalla"
              subtitle="Mientras terminamos esta sección, podés seguir sumando trofeos."
              icon={<Star className="w-5 h-5 text-sky-300" />}
            />
          </motion.div>
        );
    }
  };

  return (
    <div className="relative h-screen w-full max-w-md mx-auto bg-[radial-gradient(circle_at_1px_1px,#0b1120_1px,transparent_0)] bg-[length:22px_22px] overflow-hidden">
      <div className="flex flex-col h-full pb-20">
        <header className="px-3 pt-2 pb-1 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="flex items-center justify-center rounded-full bg-sky-500 border-[3px] border-black w-10 h-10 shadow-[0_3px_0_#020617]"
                >
                  <span className="font-display text-white text-lg leading-none drop-shadow-[0_2px_0_#020617]">
                    {level}
                  </span>
                </motion.div>
                <span className="text-[9px] font-display tracking-[0.2em] uppercase text-slate-200/80 mt-0.5">
                  Nivel
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-xs text-slate-100">
                  <span className="font-display text-[10px] tracking-[0.18em] uppercase">
                    {playerName || 'Capitán'}
                  </span>
                </div>
                <div className="mt-1 w-28 h-3 rounded-full bg-slate-900 border-[2px] border-black overflow-hidden shadow-[0_2px_0_#020617]">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-300 mt-0.5 font-mono">
                  {exp}/{expMax}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ResourceChip icon={<Coins className="w-3.5 h-3.5" />} value={coins} />
              <ResourceChip icon={<Gem className="w-3.5 h-3.5" />} value={gems} tone="pink" />
              {tickets > 0 && (
                <ResourceChip
                  icon={<Gift className="w-3.5 h-3.5" />}
                  value={tickets}
                  tone="amber"
                />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 pb-2">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>
      </div>

      <nav className="absolute inset-x-0 bottom-0 h-16 bg-slate-950/95 border-t-[3px] border-slate-900 shadow-[0_-6px_0_#020617] flex items-center justify-between px-3 gap-1">
        <BottomNavButton
          icon={<Store className="w-5 h-5" />}
          label="Tienda"
          active={activeTab === 'shop'}
          onClick={() => handleTabClick('shop')}
        />
        <BottomNavButton
          icon={<Grid2X2 className="w-5 h-5" />}
          label="Cartas"
          active={activeTab === 'collection'}
          onClick={() => handleTabClick('collection')}
        />
        <BottomNavButton
          icon={<Sword className="w-6 h-6" />}
          label="Batalla"
          active={activeTab === 'battle'}
          onClick={() => handleTabClick('battle')}
          highlight
        />
        <BottomNavButton
          icon={<Users className="w-5 h-5" />}
          label="Club"
          active={activeTab === 'club'}
          onClick={() => handleTabClick('club')}
        />
        <BottomNavButton
          icon={<Star className="w-5 h-5" />}
          label="Eventos"
          active={activeTab === 'events'}
          onClick={() => handleTabClick('events')}
        />
      </nav>
    </div>
  );
}

function ResourceChip({
  icon,
  value,
  tone = 'yellow',
}: {
  icon: React.ReactNode;
  value: number;
  tone?: 'yellow' | 'pink' | 'amber';
}) {
  const bg =
    tone === 'pink'
      ? 'bg-pink-500'
      : tone === 'amber'
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full border-[3px] border-black shadow-[0_3px_0_#020617] min-w-[64px] justify-center',
        bg
      )}
    >
      <span className="text-slate-900">{icon}</span>
      <span className="text-xs font-mono text-slate-900 font-bold">
        {value.toLocaleString('es-AR')}
      </span>
    </motion.div>
  );
}

function ChestIcon({ rarity }: { rarity: 'common' | 'rare' | 'epic' }) {
  const colors =
    rarity === 'epic'
      ? 'from-purple-500 to-fuchsia-400'
      : rarity === 'rare'
      ? 'from-sky-400 to-indigo-400'
      : 'from-amber-300 to-orange-400';

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-lg border-[2px] border-black bg-gradient-to-b flex items-center justify-center',
        colors
      )}
    >
      <span className="text-[11px] font-display text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
        {rarity === 'epic' ? 'E' : rarity === 'rare' ? 'R' : 'C'}
      </span>
    </div>
  );
}

function BottomNavButton({
  icon,
  label,
  active,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94, y: 1 }}
      animate={{
        y: active ? -3 : 0,
        scale: active ? 1.05 : 1,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={cn(
        'flex flex-col items-center justify-center flex-1 h-14 rounded-2xl border-[3px] border-black mx-0.5 text-[10px] font-display tracking-[0.18em] uppercase',
        active
          ? 'bg-amber-400 text-slate-900 shadow-[0_4px_0_#020617]'
          : 'bg-slate-900 text-slate-200 shadow-[0_3px_0_#020617] opacity-90',
        highlight && 'scale-105'
      )}
    >
      <div className="mb-0.5">{icon}</div>
      <span>{label}</span>
    </motion.button>
  );
}

function LobbyInfoCard({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="comic-card bg-[#0b3b4e] border-[3px] border-slate-900 shadow-[0_6px_0_#020617] px-3 py-2 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-900 border-[3px] border-black flex items-center justify-center shadow-[0_3px_0_#020617]">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="comic-title text-sm text-white leading-tight">{title}</h3>
        <p className="text-[11px] text-slate-200 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
