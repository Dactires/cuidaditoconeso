
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
}: GameBoardProps) {
  const boardRef = React.useRef<HTMLDivElement>(null);
  const [previousBoard, setPreviousBoard] = useState<(Card | null)[][]>(board);
  const [refillingCards, setRefillingCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newRefilling = new Set<string>();
    
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const prevCard = previousBoard[r]?.[c];
        const newCard = board[r]?.[c];
        
        // A new card appeared in a previously empty/exploding slot
        if (newCard && !prevCard) {
            newRefilling.add(newCard.uid);
        }
      }
    }

    if (newRefilling.size > 0) {
      setRefillingCards(newRefilling);
      // Clean up the refilling status after the animation duration
      const timer = setTimeout(() => {
        setRefillingCards(new Set());
      }, 1000); // Animation duration + buffer
      return () => clearTimeout(timer);
    }

    // Update previous board state for the next render
    // Use a deep copy to avoid reference issues
    if (JSON.stringify(board) !== JSON.stringify(previousBoard)) {
        setPreviousBoard(JSON.parse(JSON.stringify(board)));
    }
  }, [board, previousBoard]);


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
            const isRefilling = card ? refillingCards.has(card.uid) : false;
            const isNewlyPlacedBomb = !!(lastRivalMove && lastRivalMove.r === r && lastRivalMove.c === c);

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
                  isRefilling={isRefilling}
                  refillIndex={r * 3 + c} // Pass index for animation delay
                  isNewlyPlacedBomb={isNewlyPlacedBomb}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
