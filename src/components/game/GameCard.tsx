'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import { BombIcon } from '@/components/icons/BombIcon';
import { Card as UICard, CardContent, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface GameCardProps {
  card: Card | null;
  onClick: () => void;
  isSelected?: boolean;
  isSelectable?: boolean;
  isExploding?: boolean;
}

const colorMap: { [key: string]: { bg: string; glow: string; text: string } } = {
  Rojo: { bg: 'bg-red-800', glow: 'shadow-[0_0_15px_3px_rgba(249,115,115,0.4)]', text: 'text-red-200' },
  Azul: { bg: 'bg-blue-800', glow: 'shadow-[0_0_15px_3px_rgba(96,165,250,0.4)]', text: 'text-blue-200' },
  Verde: { bg: 'bg-green-800', glow: 'shadow-[0_0_15px_3px_rgba(74,222,128,0.4)]', text: 'text-green-200' },
  Amarillo: { bg: 'bg-yellow-800', glow: 'shadow-[0_0_15px_3px_rgba(253,224,71,0.4)]', text: 'text-yellow-200' },
};

const bombColor = { bg: 'bg-orange-800', glow: 'shadow-[0_0_20px_5px_rgba(249,115,22,0.6)]', text: 'text-orange-200' };

export default function GameCard({
  card,
  onClick,
  isSelected = false,
  isSelectable = false,
  isExploding = false,
}: GameCardProps) {
  // Slot vacío (por ejemplo casillero sin carta)
  if (!card) {
    return (
      <div className="w-full h-full rounded-lg bg-black/20 border-2 border-dashed border-slate-700" />
    );
  }

  const cardStyling =
    card.type === 'Personaje' && card.color ? colorMap[card.color] : bombColor;

  const baseAnimation = isExploding
    ? {
        scale: [1, 1.2, 0.8, 0],
        opacity: [1, 1, 0.8, 0],
        rotate: [0, 5, -5, 0],
        transition: { duration: 0.6, ease: 'easeOut' },
      }
    : { scale: 1, opacity: 1 };

  return (
    <motion.div
      className={cn(
        'w-full h-full cursor-pointer relative',
        isSelected && 'ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900',
      )}
      onClick={onClick}
      whileHover={isSelectable ? { scale: 1.05, y: -4 } : {}}
      whileTap={isSelectable ? { scale: 0.96 } : {}}
      animate={baseAnimation}
    >
      {!card.isFaceUp ? (
        <div className="w-full h-full rounded-2xl bg-[#0f172a] p-1 border-[3px] border-black shadow-[0_8px_0_#020617]">
            <div className="relative w-full h-full rounded-xl bg-sky-400 border-[3px] border-black overflow-hidden">
                <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_1px_1px,#38bdf8_1px,transparent_0)] bg-[length:8px_8px]" />
                <div className="relative h-full w-full flex flex-col items-center justify-center gap-1">
                    <BombIcon className="w-8 h-8 drop-shadow-[0_3px_0_#020617]" />
                    <span className="font-display text-xs tracking-[0.25em] uppercase text-slate-900 drop-shadow-[0_2px_0_#f9fafb]">
                        Board Bombers
                    </span>
                </div>
            </div>
        </div>
      ) : (
        <UICard
          className={cn(
            'w-full h-full flex flex-col items-center justify-center relative',
            'rounded-2xl border-[3px] border-black bg-sky-400',
            'shadow-[0_8px_0_#020617]',
            isSelected && 'ring-4 ring-amber-300 ring-offset-4 ring-offset-slate-900',
            cardStyling?.bg
          )}
        >
          <div className="absolute -top-2 -left-2 px-2 py-1 rounded-full bg-black text-white border-[2px] border-white shadow-[0_4px_0_#020617]">
            <p className="text-xs font-display tracking-[0.2em] uppercase">
              {card?.type === 'Bomba' ? 'Bomba' : card?.value}
            </p>
          </div>

          <CardTitle className="font-display text-6xl md:text-7xl font-black drop-shadow-[0_4px_0_#020617]">
            {card?.type === 'Bomba'
              ? <BombIcon className="w-16 h-16" />
              : card?.value}
          </CardTitle>

          <CardContent className="px-2 py-0.5 absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 rounded-full border-[2px] border-white">
            <p className="text-[10px] font-display tracking-[0.25em] uppercase text-amber-300">
              {card?.type}
            </p>
          </CardContent>
        </UICard>
      )}
    </motion.div>
  );
}
