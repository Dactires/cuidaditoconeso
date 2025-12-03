'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import { BombIcon } from '@/components/icons/BombIcon';
import { Card as UICard, CardContent, CardTitle } from '@/components/ui/card';
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
}

const colorMap: { [key: string]: { bg: string; glow: string; text: string } } = {
  Rojo: { bg: 'bg-red-800', glow: 'shadow-[0_0_15px_3px_rgba(249,115,115,0.4)]', text: 'text-red-200' },
  Azul: { bg: 'bg-blue-800', glow: 'shadow-[0_0_15px_3px_rgba(96,165,250,0.4)]', text: 'text-blue-200' },
  Verde: { bg: 'bg-green-800', glow: 'shadow-[0_0_15px_3px_rgba(74,222,128,0.4)]', text: 'text-green-200' },
  Amarillo: { bg: 'bg-yellow-800', glow: 'shadow-[0_0_15px_3px_rgba(253,224,71,0.4)]', text: 'text-yellow-200' },
};

const bombColor = { bg: 'bg-orange-800', glow: 'shadow-[0_0_20px_5px_rgba(249,115,22,0.6)]', text: 'text-orange-200' };

const cardVariants = {
  idle: {
    scale: 1,
    y: 0,
    boxShadow: "0px 6px 0px rgba(0,0,0,0.75)",
    filter: "drop-shadow(0 0 0 rgba(56,189,248,0))",
    rotate: 0,
  },
  hover: {
    scale: 1.06,
    y: -10,
    boxShadow: "0px 12px 0px rgba(0,0,0,0.85)",
    transition: { type: "spring", stiffness: 350, damping: 18 },
  },
  pressed: {
    scale: 0.97,
    y: 0,
    boxShadow: "0px 3px 0px rgba(0,0,0,0.85)",
    transition: { type: "spring", stiffness: 450, damping: 20 },
  },
  selected: {
    scale: 1.08,
    y: -18,
    boxShadow: "0px 14px 0px rgba(0,0,0,0.9)",
    filter: "drop-shadow(0 0 12px rgba(56,189,248,0.9))",
    transition: { type: "spring", stiffness: 320, damping: 18 },
  },
  disabled: {
    scale: 0.98,
    opacity: 0.45,
    filter: "grayscale(0.3)",
    boxShadow: "0px 2px 0px rgba(0,0,0,0.6)",
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
}: GameCardProps) {

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-40, 40], [8, -8]);
  const rotateY = useTransform(x, [-40, 40], [-8, 8]);

  // Slot vacío (por ejemplo casillero sin carta)
  if (!card) {
    return (
      <div className={cn(
        "w-full h-full rounded-lg bg-black/20 border-2 border-dashed border-slate-700 aspect-square transition-colors",
        isSelectable && !isDimmed && "border-amber-400/50 bg-amber-400/10 cursor-pointer"
      )} />
    );
  }

  const cardStyling =
    card.type === 'Personaje' && card.color ? colorMap[card.color] : bombColor;

  const animationClass = isRivalMove ? 'animate-rival-play' : isExploding ? 'animate-explode' : '';

  return (
    <motion.div
      layout
      layoutId={`card-${card.uid}`}
      variants={cardVariants}
      initial="idle"
      animate={
        isDisabled
          ? "disabled"
          : isSelected
          ? "selected"
          : "idle"
      }
      whileHover={!isMobile && !isDisabled && !isSelected ? "hover" : undefined}
      whileTap={!isDisabled ? "pressed" : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={!isMobile ? { rotateX, rotateY } : {}}
      onMouseMove={!isMobile ? (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      } : undefined}
      onMouseLeave={!isMobile ? () => {
        x.set(0);
        y.set(0);
      } : undefined}
      className={cn(
        'w-full h-full relative aspect-square',
        isSelectable && !isDimmed && 'cursor-pointer',
        animationClass,
      )}
      onClick={onClick}
    >
      {!card.isFaceUp ? (
        <div className="w-full h-full rounded-2xl bg-[#0f172a] p-1 border-[3px] border-black shadow-[0_6px_0px_rgba(0,0,0,0.75)]">
            <div className="relative w-full h-full rounded-xl bg-sky-400 border-[3px] border-black overflow-hidden">
                <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_1px_1px,#38bdf8_1px,transparent_0)] bg-[length:8px_8px]" />
                <div className="relative h-full w-full flex flex-col items-center justify-center gap-1">
                    <BombIcon className={cn("drop-shadow-[0_3px_0_#020617]", isMobile ? "w-6 h-6" : "w-8 h-8")} />
                    <span className={cn("font-display tracking-[0.25em] uppercase text-slate-900 drop-shadow-[0_2px_0_#f9fafb]", isMobile ? "text-[8px]" : "text-xs")}>
                        Board Bombers
                    </span>
                </div>
            </div>
        </div>
      ) : (
        <UICard
          className={cn(
            'w-full h-full flex flex-col items-center justify-center relative aspect-square overflow-hidden',
            'rounded-2xl border-[3px] border-black bg-sky-400',
            card.imageUrl ? '' : cardStyling?.bg
          )}
        >
          {card.imageUrl ? (
            <Image src={card.imageUrl} alt={`Imagen de la carta`} fill sizes="(max-width: 768px) 10vw, 5vw" className="object-cover" />
          ) : null}

          <div className={cn("absolute -top-2 -left-2 px-2 py-1 rounded-full bg-black text-white border-[2px] border-white", isMobile && "px-1 py-0.5 -top-1 -left-1")}>
            <p className={cn("font-display tracking-[0.2em] uppercase", isMobile ? "text-[8px]" : "text-xs")}>
              {card?.type === 'Bomba' ? 'Bomba' : card?.value}
            </p>
          </div>

          {!card.imageUrl && (
            <CardTitle className={cn("font-display font-black drop-shadow-[0_4px_0_#020617]", isMobile ? "text-5xl" : "text-6xl md:text-7xl")}>
              {card?.type === 'Bomba'
                ? <BombIcon className={cn(isMobile ? "w-12 h-12" : "w-16 h-16")} />
                : card?.value}
            </CardTitle>
          )}

          <CardContent className={cn("px-2 py-0.5 absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 rounded-full border-[2px] border-white", isMobile && "px-1.5 py-0 -bottom-1")}>
            <p className={cn("font-display tracking-[0.25em] uppercase text-amber-300", isMobile ? "text-[7px]" : "text-[10px]")}>
              {card?.type}
            </p>
          </CardContent>
        </UICard>
      )}
    </motion.div>
  );
}
