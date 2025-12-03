
'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import { BombIcon } from '@/components/icons/BombIcon';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Clock } from 'lucide-react';
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
}: GameCardProps) {

  const [showTimer, setShowTimer] = React.useState(false);
  const cardIsBomb = card?.type === 'Bomba';

  React.useEffect(() => {
    let timerTimeout: NodeJS.Timeout | null = null;
    let clearTimerTimeout: NodeJS.Timeout | null = null;
    
    if (card?.isFaceUp && cardIsBomb) {
      // Short delay to show the bomb image first
      timerTimeout = setTimeout(() => {
        setShowTimer(true);
        // Duration of the timer itself
        clearTimerTimeout = setTimeout(() => {
          setShowTimer(false);
        }, 650);
      }, 250); 
    } else {
      setShowTimer(false);
    }

    return () => {
      if (timerTimeout) clearTimeout(timerTimeout);
      if (clearTimerTimeout) clearTimeout(clearTimerTimeout);
    };
  }, [card?.isFaceUp, cardIsBomb]);


  if (!card) {
    return (
      <div className={cn(
        "w-full h-full rounded-lg bg-black/20 border-2 border-dashed border-slate-700 aspect-square transition-colors",
        isSelectable && !isDimmed && "border-amber-400/50 bg-amber-400/10 cursor-pointer"
      )} />
    );
  }

  const animationClass = isRivalMove ? 'animate-rival-play' : isExploding ? 'animate-explode' : '';
  const glowClass = card.isFaceUp && card.type === 'Personaje' ? getGlowColor(card.color) : '';

  const renderCardFace = (isFront: boolean) => {
    // BACK OF THE CARD
    if (!isFront) {
      if (cardBackImageUrl) {
        return <Image src={cardBackImageUrl} alt="Reverso de la carta" fill sizes="10vw" className="object-cover" />;
      }
      return (
        <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-1 border-2 border-black">
          <BombIcon className={cn("drop-shadow-[0_2px_0_#020617]", isMobile ? "w-5 h-5" : "w-7 h-7")} />
        </div>
      );
    }

    // FRONT OF THE CARD

    // If it's a bomb and the timer is active, show the timer overlay
    if (cardIsBomb && showTimer) {
        return (
             <>
                {card.imageUrl && (
                    <Image src={card.imageUrl} alt="Imagen de una bomba" fill sizes="(max-width: 768px) 10vw, 5vw" className="object-cover brightness-50" />
                )}
                <motion.div
                    key="timer"
                    className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                >
                    <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                    >
                    <Clock className="w-1/2 h-1/2 text-amber-300 animate-ping" />
                    </motion.div>
                </motion.div>
             </>
        )
    }

    // Otherwise, show the normal card front (bomb or character)
    return (
      <>
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt={`Imagen de la carta ${card.uid}`} fill sizes="(max-width: 768px) 10vw, 5vw" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-500" />
        )}
        
        {card.type === 'Personaje' && (
          <div className={cn(
            "absolute top-1 left-1 px-2 py-0.5 rounded-full bg-black/60 text-white border-2 border-white/50 backdrop-blur-sm",
            isMobile && "px-1 py-0 text-sm"
          )}>
            <p className={cn("font-display tracking-[0.1em] uppercase", isMobile ? "text-base" : "text-6xl md:text-7xl")}>
              {card.value}
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <motion.div
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
      className={cn(
        'w-full h-full relative aspect-square card-flipper',
        isSelectable && !isDimmed && 'cursor-pointer',
        animationClass,
      )}
      onClick={onClick}
    >
        <motion.div 
            className="w-full h-full absolute card-face"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
            animate={{ rotateY: card.isFaceUp ? 180 : 0 }}
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
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            animate={{ rotateY: card.isFaceUp ? 0 : -180 }}
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
