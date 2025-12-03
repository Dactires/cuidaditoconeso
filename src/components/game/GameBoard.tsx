'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import GameCard from './GameCard';

type Pos = { r: number; c: number };

interface GameBoardProps {
  board: (Card | null)[][];
  onCardClick?: (r: number, c: number) => void;
  isCardSelectable?: (r: number, c: number) => boolean;
  explodingCardInfo?: Pos;
  isMobile?: boolean;
  isDimmed?: boolean;
  lastRivalMove?: Pos;
}

/**
 * Tablero 3x3 estilo cómic.
 */
export default function GameBoard({
  board,
  onCardClick,
  isCardSelectable,
  explodingCardInfo,
  isMobile,
  isDimmed,
  lastRivalMove,
}: GameBoardProps) {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-center",
        isMobile ? "p-2" : "p-3"
      )}
    >
      <div className={cn("comic-grid max-w-[360px] w-full", isMobile && '!p-0 !gap-1.5')}>
        {board.map((row, r) =>
          row.map((card, c) => {
            const key = `${r}-${c}-${card?.uid ?? 'empty'}`;
            const selectable = isCardSelectable?.(r, c) ?? false;
            const isExploding =
              !!explodingCardInfo && explodingCardInfo.r === r && explodingCardInfo.c === c;
            const isRivalMove =
              !!lastRivalMove && lastRivalMove.r === r && lastRivalMove.c === c;

            return (
              <div
                key={key}
                className={cn(
                  'comic-card-slot',
                   isMobile && '!w-full !h-auto',
                  'focus:outline-none',
                  selectable && 'cursor-pointer',
                  !selectable && 'cursor-default',
                  isExploding && 'shockwave'
                )}
                
              >
                <GameCard
                  card={card}
                  onClick={() => selectable && onCardClick?.(r, c)}
                  isSelectable={selectable}
                  isExploding={isExploding}
                  isRivalMove={isRivalMove}
                  isMobile={isMobile}
                  isDisabled={isDimmed}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
