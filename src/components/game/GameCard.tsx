'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import { BombIcon } from '@/components/icons/BombIcon';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';

interface GameCardProps {
  card: Card | null;
  onClick: () => void;
  isSelected?: boolean;
  isSelectable?: boolean;
  isExploding?: boolean;
  isRivalMove?: boolean;
  isMobile?: boolean;
  isDimmed?: boolean;
  isInHand?: boolean;
  isDisabled?: boolean;
  cardBackImageUrl?: string;
}

const cardVariants = {
  idle: {
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
  hover: {
    scale: 1.08,
    y: -10,
    transition: { type: "spring", stiffness: 350, damping: 18 },
  },
  pressed: {
    scale: 0.97,
    y: 2,
    transition: { type: "spring", stiffness: 450, damping: 20 },
  },
  selected: {
    scale: 1.1,
    y: -18,
    filter: "drop-shadow(0 0 10px rgba(56,189,248,0.8))",
    transition: { type: "spring", stiffness: 320, damping: 18 },
  },
  disabled: {
    scale: 0.98,
    opacity: 0.45,
    filter: "grayscale(0.3)",
  },
};

export default function GameCard({
  card,
  onClick,
  isSelected = false,
  isSelectable = false,
  isExploding = false,
  isRivalMove = false,
  isMobile = false,
  isDimmed = false,
  isInHand = false,
  isDisabled = false,
  cardBackImageUrl,
}: GameCardProps) {
  // Slot vacío (casillero sin carta)
  if (!card) {
    return (
      <div className={cn(
        "w-full h-full rounded-lg bg-black/20 border-2 border-dashed border-slate-700 aspect-square transition-colors",
        isSelectable && !isDimmed && "border-amber-400/50 bg-amber-400/10 cursor-pointer"
      )} />
    );
  }

  const animationClass = isRivalMove ? 'animate-rival-play' : isExploding ? 'animate-explode' : '';

  const renderCardContent = () => {
    // Carta Boca Abajo
    if (!card.isFaceUp) {
      if (cardBackImageUrl) {
        return <Image src={cardBackImageUrl} alt="Reverso de la carta" fill sizes="10vw" className="object-cover" />;
      }
      return (
        <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-1 border border-black">
          <BombIcon className={cn("drop-shadow-[0_2px_0_#020617]", isMobile ? "w-5 h-5" : "w-7 h-7")} />
          <span className={cn("font-display tracking-[0.2em] uppercase text-slate-900 drop-shadow-[0_1px_0_#f9fafb]", isMobile ? "text-[7px]" : "text-[10px]")}>
              Board Bombers
          </span>
        </div>
      );
    }

    // Carta Boca Arriba
    return (
      <>
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt={`Imagen de la carta ${card.uid}`} fill sizes="(max-width: 768px) 10vw, 5vw" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-500" />
        )}
        
        <div className={cn(
          "absolute top-1 left-1 px-2 py-0.5 rounded-full bg-black/60 text-white border border-white/50 backdrop-blur-sm",
          isMobile && "px-1 py-0 text-sm"
        )}>
          <p className={cn("font-display tracking-[0.1em] uppercase", isMobile ? "text-base" : "text-lg")}>
            {card.type === 'Bomba' ? <BombIcon className="w-3 h-3" /> : card.value}
          </p>
        </div>
      </>
    );
  };

  return (
    <motion.div
      layout
      layoutId={`card-${card.uid}`}
      variants={cardVariants}
      initial="idle"
      animate={
        isDisabled || isDimmed
          ? "disabled"
          : isSelected
          ? "selected"
          : "idle"
      }
      whileHover={!isMobile && !isDisabled && !isSelected ? "hover" : undefined}
      whileTap={!isDisabled ? "pressed" : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        'w-full h-full relative aspect-square',
        isSelectable && !isDimmed && 'cursor-pointer',
        animationClass,
      )}
      onClick={onClick}
    >
      <div className={cn(
          "relative w-full aspect-square overflow-hidden border border-black",
          isInHand && !isMobile ? "rounded-xl shadow-[0_3px_0_#0a0a0a]" : "rounded-2xl shadow-[0_4px_0_#0a0a0a]"
      )}>
        {renderCardContent()}
      </div>
    </motion.div>
  );
}