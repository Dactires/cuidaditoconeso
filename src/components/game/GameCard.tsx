
'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import { BombIcon } from '@/components/icons/BombIcon';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import React from 'react';

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
  explodingCardInfo?: { r: number; c: number; playerId: number; card: Card } | null;
  isRefilling?: boolean;
  refillIndex?: number;
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
  refill: (i: number) => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 20,
      delay: i * 0.05,
    },
  }),
};

const getGlowColor = (color: string | null) => {
  switch (color) {
    case 'Rojo': return 'shadow-[0_0_12px_2px_rgba(239,68,68,0.7)]';
    case 'Azul': return 'shadow-[0_0_12px_2px_rgba(59,130,246,0.7)]';
    case 'Verde': return 'shadow-[0_0_12px_2px_rgba(34,197,94,0.7)]';
    case 'Amarillo': return 'shadow-[0_0_12px_2px_rgba(251,191,36,0.7)]';
    default: return 'shadow-none';
  }
}

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
  explodingCardInfo,
  isRefilling = false,
  refillIndex = 0,
}: GameCardProps) {

  const cardToRender = card;
  const showFace = cardToRender?.isFaceUp ?? false;

  const initialAnimation = isRefilling
    ? {
        x: isMobile ? 80 : 250, // Come from the right (deck side)
        y: isMobile ? -50 : -100,
        scale: 0.5,
        rotate: 30,
        opacity: 0,
      }
    : { scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 };


  if (!cardToRender) {
    return (
      <div className={cn(
        "w-full h-full rounded-lg bg-black/20 border-2 border-dashed border-slate-700 aspect-square transition-colors",
        isSelectable && !isDimmed && "border-amber-400/50 bg-amber-400/10 cursor-pointer"
      )} />
    );
  }

  const finalCard = cardToRender;
  const animationClass = isRivalMove ? 'animate-rival-play' : isExploding ? 'animate-explode' : '';
  const glowClass = finalCard.isFaceUp && finalCard.type === 'Personaje' ? getGlowColor(finalCard.color) : '';

  const renderCardFace = (isFront: boolean) => {
    // BACK OF THE CARD
    if (!isFront) {
      if (cardBackImageUrl) {
        return <Image src={cardBackImageUrl} alt="Reverso de la carta" fill sizes="10vw" className="object-cover" priority />;
      }
      return (
        <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-1 border-2 border-black">
          <BombIcon className={cn("drop-shadow-[0_2px_0_#020617]", isMobile ? "w-5 h-5" : "w-7 h-7")} />
        </div>
      );
    }

    // FRONT OF THE CARD
    return (
      <>
        {finalCard.imageUrl ? (
          <Image src={finalCard.imageUrl} alt={`Imagen de la carta ${finalCard.uid}`} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full bg-slate-500" />
        )}
        
        {finalCard.type === 'Personaje' && (
          <div className={cn(
            "absolute top-1 left-1 px-2 py-0.5 rounded-full bg-black/60 text-white border-2 border-white/50 backdrop-blur-sm",
            isMobile && "px-1 py-0 text-sm"
          )}>
            <p className={cn("font-display tracking-[0.1em] uppercase", isMobile ? "text-base" : "text-xl")}>
              {finalCard.value}
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <motion.div
      layoutId={!isExploding && !isRefilling ? `card-${finalCard.uid}`: undefined}
      variants={cardVariants}
      initial={initialAnimation}
      animate={
        isRefilling
          ? "refill"
          : isDisabled || isDimmed
          ? "disabled"
          : isSelected
          ? "selected"
          : "idle"
      }
      custom={refillIndex} // Pass index for animation delay
      whileHover={!isMobile && !isDisabled && !isSelected && !isRefilling ? "hover" : undefined}
      whileTap={!isDisabled && !isRefilling ? "pressed" : undefined}
      className={cn(
        'w-full h-full relative aspect-square card-flipper',
        isSelectable && !isDimmed && 'cursor-pointer',
        animationClass,
      )}
      onClick={onClick}
      style={{ transformStyle: "preserve-3d" }}
    >
        <motion.div 
            className="w-full h-full absolute card-face"
            style={{ backfaceVisibility: "hidden" }}
            initial={false}
            animate={{ rotateY: showFace ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            <div className={cn(
                "relative w-full aspect-square overflow-hidden border-2 border-black",
                isInHand && !isMobile ? "rounded-xl shadow-[0_3px_0_#0a0a0a]" : "rounded-2xl shadow-[0_4px_0_#0a0a0a]"
            )}>
                {renderCardFace(false)}
            </div>
        </motion.div>
        <motion.div 
            className={cn(
                "w-full h-full absolute card-face",
                glowClass
            )}
            style={{ backfaceVisibility: "hidden" }}
            initial={false}
            animate={{ rotateY: showFace ? 0 : -180 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            <div className={cn(
                "relative w-full aspect-square overflow-hidden border-2 border-black",
                isInHand && !isMobile ? "rounded-xl shadow-[0_3px_0_#0a0a0a]" : "rounded-2xl shadow-[0_4px_0_#0a0a0a]"
            )}>
                {renderCardFace(true)}
            </div>
        </motion.div>
    </motion.div>
  );
}
