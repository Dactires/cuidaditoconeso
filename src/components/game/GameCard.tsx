'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import { BombIcon } from '@/components/icons/BombIcon';
import { Card as UICard, CardContent, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

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

const flipVariants = {
  hidden: { rotateY: 180 },
  visible: { rotateY: 0 },
};

const explosionVariants = {
  initial: { scale: 1, x: 0, y: 0, rotate: 0 },
  exploding: {
    scale: [1, 1.2, 0],
    rotate: [0, 10, -10, 0],
    x: [0, 5, -5, 0],
    y: [0, -10, 10, 0],
    opacity: [1, 1, 0],
    transition: { duration: 0.8, ease: "circOut" },
  }
}

export default function GameCard({ card, onClick, isSelected = false, isSelectable = false, isExploding = false }: GameCardProps) {
  
  const cardStyling = card?.type === 'Personaje' && card.color ? colorMap[card.color] : bombColor;

  const cardContent = (
    <motion.div
      className="absolute w-full h-full"
      style={{ backfaceVisibility: 'hidden' }}
      variants={flipVariants}
      initial={false}
      animate={{ rotateY: card?.isFaceUp ? 0 : 180 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* Card Front */}
      <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)'}}>
        <UICard
          className={cn(
            'w-full h-full flex flex-col items-center justify-center border-2 text-white rounded-lg shadow-lg relative',
            'border-slate-600',
            cardStyling?.bg,
            isSelectable && cardStyling?.glow
          )}
        >
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/30">
            <p className={cn("text-xs font-bold font-display tracking-widest", cardStyling?.text)}>
              {card?.type === 'Bomba' ? 'BOMBA' : card?.value}
            </p>
          </div>
          <CardTitle className="font-display text-7xl font-bold">
            {card?.type === 'Bomba'
              ? <BombIcon className="w-16 h-16" />
              : card?.value}
          </CardTitle>
           <CardContent className="p-1 absolute bottom-1">
            <p className="text-xs font-display tracking-wider font-semibold uppercase opacity-60">{card?.type}</p>
          </CardContent>
        </UICard>
      </div>

      {/* Card Back */}
      <div className="w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
        <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center p-2 border-2 border-slate-700 shadow-inner">
           <div className="w-full h-full rounded-md border-2 border-slate-700 border-dashed flex items-center justify-center">
            <span className="text-slate-600 font-display font-bold text-2xl -rotate-12 opacity-70 select-none">
              BOMBERS
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className='w-full h-full'
      style={{ perspective: 1000 }}
      onClick={!card ? undefined : onClick}
      variants={isExploding ? explosionVariants : undefined}
      animate={isExploding ? "exploding" : "initial"}
    >
        <motion.div
            className={cn('relative w-full h-full cursor-pointer rounded-lg', !card && 'cursor-default')}
            whileHover={isSelectable ? { scale: 1.05, y: -5 } : {}}
            whileTap={isSelectable ? { scale: 0.95 } : {}}
        >
        {isSelected && <motion.div className="absolute -inset-1 rounded-lg bg-accent z-[-1]" layoutId="selection-glow" />}
        {!card ? (
            <div className="w-full h-full rounded-lg bg-black/20 border border-dashed border-slate-700" />
        ) : (
           cardContent
        )}
        </motion.div>
    </motion.div>
  );
}
