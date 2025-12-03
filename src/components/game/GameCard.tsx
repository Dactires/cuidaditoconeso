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

  const style =
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
        'w-full h-full rounded-lg cursor-pointer relative',
        isSelected && 'ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900',
      )}
      onClick={onClick}
      whileHover={isSelectable ? { scale: 1.05, y: -4 } : {}}
      whileTap={isSelectable ? { scale: 0.96 } : {}}
      animate={baseAnimation}
    >
      {/* Si está boca abajo → solo reverso */}
      {!card.isFaceUp ? (
        <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center p-2 border-2 border-slate-700 shadow-inner">
          <div className="w-full h-full rounded-md border-2 border-slate-700 border-dashed flex items-center justify-center">
            <span className="text-slate-600 font-display font-bold text-2xl -rotate-12 opacity-70 select-none">
              BOMBERS
            </span>
          </div>
        </div>
      ) : (
        // Si está boca arriba → frente
        <UICard
          className={cn(
            'w-full h-full flex flex-col items-center justify-center border-2 text-white rounded-lg shadow-lg relative',
            'border-slate-600',
            style.bg,
            isSelectable && style.glow,
          )}
        >
          {/* Esquina superior con valor o BOMBA */}
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/40">
            <p
              className={cn(
                'text-xs font-bold font-display tracking-widest',
                style.text,
              )}
            >
              {card.type === 'Bomba' ? 'BOMBA' : card.value}
            </p>
          </div>

          {/* Valor central o icono de bomba */}
          <CardTitle className="font-display text-5xl md:text-6xl font-bold">
            {card.type === 'Bomba' ? (
              <BombIcon className="w-12 h-12 md:w-14 md:h-14" />
            ) : (
              card.value
            )}
          </CardTitle>

          {/* Tipo de carta abajo */}
          <CardContent className="p-1 absolute bottom-1">
            <p className="text-[10px] font-display tracking-wider font-semibold uppercase opacity-70">
              {card.type}
            </p>
          </CardContent>
        </UICard>
      )}
    </motion.div>
  );
}