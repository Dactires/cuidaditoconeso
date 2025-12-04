
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
  const [destroyedCards, setDestroyedCards] = useState<Map<string, Card>>(new Map());

  const [rivalMoveFocus, setRivalMoveFocus] = useState<Pos | null>(null);

  useEffect(() => {
    if (lastRivalMove) {
      setRivalMoveFocus(lastRivalMove);
      const timer = setTimeout(() => {
        setRivalMoveFocus(null);
      }, 1500); // Duration of the focus effect
      return () => clearTimeout(timer);
    }
  }, [lastRivalMove]);

  useEffect(() => {
    const newlyDestroyed = new Map<string, Card>();

    // Detect destroyed cards
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
            const prevCard = previousBoard[r]?.[c];
            const currentCard = board[r]?.[c];
            if (prevCard && !currentCard) {
                // A card that was here is now gone. Mark it for destruction animation.
                newlyDestroyed.set(`${r}-${c}`, prevCard);
            }
        }
    }

    if (newlyDestroyed.size > 0) {
        setDestroyedCards(newlyDestroyed);
        const timer = setTimeout(() => {
            setDestroyedCards(new Map());
        }, 500); // Animation duration
        return () => clearTimeout(timer);
    }
    
    // Update previous board state for the next render only if no cards were destroyed
    // This gives the destroyed cards a chance to animate out
    if (newlyDestroyed.size === 0) {
      setPreviousBoard(board);
    }

  }, [board]);


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
            
            // Check if this slot contains the exploding bomb from the game state
            const isBombExplosionCenter =
              !!explodingCardInfo && explodingCardInfo.playerId === playerId && explodingCardInfo.r === r && explodingCardInfo.c === c;

            // Check if this slot just had a card destroyed by an ability
            const destroyedCard = destroyedCards.get(`${r}-${c}`);
            
            const isExplodingSlot = isBombExplosionCenter || !!destroyedCard;
            
            const cardToRender = isBombExplosionCenter ? explodingCardInfo.card : (destroyedCard || card);
            
            const isRivalMoveFocus = rivalMoveFocus?.r === r && rivalMoveFocus?.c === c;

            return (
              <div
                key={key}
                className={cn(
                  'comic-card-slot',
                   isMobile && '!w-full !h-auto',
                  'focus:outline-none relative',
                  selectable && 'cursor-pointer',
                  !selectable && 'cursor-default'
                )}
              >
                {isRivalMoveFocus && (
                    <div className="absolute inset-0 rounded-2xl animate-rival-focus-pulse z-10 pointer-events-none" />
                )}
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
    </div>
  );
}
