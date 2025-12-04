
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
  const [previousBoard, setPreviousBoard] = useState<(Card | null)[][] | null>(null);
  const [destroyedCards, setDestroyedCards] = useState<Map<string, Card>>(new Map());
  const [refillingCards, setRefillingCards] = useState<Map<string, Card>>(new Map());

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
    if (!previousBoard) {
        setPreviousBoard(board);
        return;
    }

    const newlyDestroyed = new Map<string, Card>();
    const newlyRefilled = new Map<string, Card>();

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const prevCard = previousBoard[r]?.[c];
        const currentCard = board[r]?.[c];

        if (prevCard && !currentCard) {
          // A card was here, now it's gone -> DESTRUCTION
          newlyDestroyed.set(`${r}-${c}`, prevCard);
        } else if (!prevCard && currentCard) {
          // A slot was empty, now has a card -> REFILL
          newlyRefilled.set(`${r}-${c}`, currentCard);
        }
      }
    }

    if (newlyDestroyed.size > 0) {
      setDestroyedCards(newlyDestroyed);
      // Give animation time to play before cleaning up
      const timer = setTimeout(() => {
        setDestroyedCards(new Map());
      }, 500);
      return () => clearTimeout(timer);
    }
    
    if (newlyRefilled.size > 0) {
        setRefillingCards(newlyRefilled);
        const timer = setTimeout(() => {
            setRefillingCards(new Map());
        }, 800); // Animation duration
        return () => clearTimeout(timer);
    }

    setPreviousBoard(board);

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
          isMobile ? "gap-1.5" : "gap-3",
          isMobile
            ? "w-full"
            : "w-full max-w-[min(320px,82vw)]"
        )}
      >
        {board.map((row, r) =>
          row.map((card, c) => {
            const key = `${r}-${c}`;
            const selectable = isCardSelectable?.(r, c) ?? false;
            
            const isBombExplosionCenter =
              !!explodingCardInfo && explodingCardInfo.playerId === playerId && explodingCardInfo.r === r && explodingCardInfo.c === c;

            const destroyedCard = destroyedCards.get(key);
            const isRefilling = refillingCards.has(key);
            const cardForRefill = refillingCards.get(key);
            
            const isExplodingSlot = isBombExplosionCenter || !!destroyedCard;
            
            // Render the live card, unless a destruction or refill is happening on this slot
            let cardToRender = card;
            if(isExplodingSlot) cardToRender = destroyedCard || (isBombExplosionCenter ? explodingCardInfo.card : null);
            if(isRefilling) cardToRender = cardForRefill || null;
            
            const isRivalMoveFocus = rivalMoveFocus?.r === r && rivalMoveFocus?.c === c;

            return (
              <div
                key={`${key}-${cardToRender?.uid ?? 'empty'}`}
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
                  isRefilling={isRefilling}
                  refillIndex={(r * 3 + c)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
