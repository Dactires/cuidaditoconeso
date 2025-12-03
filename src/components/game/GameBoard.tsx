
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import GameCard from './GameCard';
import { motion } from 'framer-motion';


type Pos = { r: number; c: number };

interface GameBoardProps {
  board: (Card | null)[][];
  playerId: number;
  onCardClick?: (r: number, c: number) => void;
  isCardSelectable?: (r: number, c: number) => boolean;
  explodingCardInfo?: { r: number; c: number; playerId: number; card: Card } | null;
  isMobile?: boolean;
  isDimmed?: boolean;
  lastRivalMove?: Pos;
  cardBackImageUrl?: string;
  refillingSlots?: { playerId: number; r: number; c: number; card: Card }[];
  onRefillAnimationComplete?: (playerId: number, r: number, c: number, card: Card) => void;
}

/**
 * Tablero 3x3 estilo cómic.
 */
export default function GameBoard({
  board,
  playerId,
  onCardClick,
  isCardSelectable,
  explodingCardInfo,
  isMobile,
  isDimmed,
  lastRivalMove,
  cardBackImageUrl,
  refillingSlots,
  onRefillAnimationComplete,
}: GameBoardProps) {
  const boardRef = React.useRef<HTMLDivElement>(null);
  
  const getSlotPosition = (r: number, c: number): { x: number; y: number } => {
    if (!boardRef.current) return { x: 0, y: 0 };
    const boardRect = boardRef.current.getBoundingClientRect();
    const slotWidth = boardRect.width / 3;
    const slotHeight = boardRect.height / 3;
    
    return {
        x: c * slotWidth + slotWidth / 2 - boardRect.width / 2,
        y: r * slotHeight + slotHeight / 2 - boardRect.height / 2,
    };
  };


  return (
    <div
      className={cn(
        "w-full flex items-center justify-center relative",
        isMobile ? "p-2" : "p-3"
      )}
    >
      <div
        ref={boardRef}
        className={cn(
          "grid grid-cols-3 place-items-center",
          isMobile ? "gap-2" : "gap-3",
          isMobile
            ? "w-full max-w-[min(340px,92vw)]"
            : "w-full max-w-[min(320px,82vw)]"
        )}
      >
        {board.map((row, r) =>
          row.map((card, c) => {
            const key = `${r}-${c}-${card?.uid ?? 'empty'}`;
            const selectable = isCardSelectable?.(r, c) ?? false;
            const isExplodingSlot =
              !!explodingCardInfo && explodingCardInfo.playerId === playerId && explodingCardInfo.r === r && explodingCardInfo.c === c;

            // If a card is exploding in this slot, we render the exploding card temporarily,
            // even if the board data for this slot is already null.
            const cardToRender = isExplodingSlot ? explodingCardInfo.card : card;

            return (
              <div
                key={key}
                className={cn(
                  'comic-card-slot',
                   isMobile && '!w-full !h-auto',
                  'focus:outline-none',
                  selectable && 'cursor-pointer',
                  !selectable && 'cursor-default'
                )}
              >
                <GameCard
                  card={cardToRender}
                  onClick={() => selectable && onCardClick?.(r, c)}
                  isSelectable={selectable}
                  isExploding={isExplodingSlot}
                  isMobile={isMobile}
                  isDisabled={isDimmed}
                  cardBackImageUrl={cardBackImageUrl}
                />
              </div>
            );
          })
        )}
      </div>

       {/* Refilling Card Animations */}
      <div className="absolute inset-0 pointer-events-none">
        {refillingSlots?.map((slot, index) => {
            if (slot.playerId !== playerId) return null;
            const targetPos = getSlotPosition(slot.r, slot.c);

            return (
                <motion.div
                    key={slot.card.uid}
                    className="absolute top-1/2 left-1/2"
                    initial={{ x: '150%', y: '-100%', scale: isMobile ? 0.7 : 1 }}
                    animate={{ x: targetPos.x, y: targetPos.y, scale: 1 }}
                    transition={{
                        delay: index * 0.1,
                        duration: 0.5,
                        ease: [0.25, 1, 0.5, 1]
                    }}
                    onAnimationComplete={() => onRefillAnimationComplete?.(slot.playerId, slot.r, slot.c, slot.card)}
                >
                    <div className={cn('comic-card-slot', isMobile ? 'w-20' : 'w-24')}>
                        <GameCard card={{ ...slot.card, isFaceUp: false }} onClick={() => {}} cardBackImageUrl={cardBackImageUrl} />
                    </div>
                </motion.div>
            )
        })}
      </div>
    </div>
  );
}
