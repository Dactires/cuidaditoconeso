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
  explodingCard?: Pos;
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
  explodingCard,
  isMobile,
  isDimmed,
  lastRivalMove,
}: GameBoardProps) {
  return (
    <div className={cn(
        "comic-panel flex items-center justify-center transition-opacity duration-300",
        isMobile ? 'p-2 !shadow-none !border-2 w-full max-w-xs' : 'px-4 py-4',
        isDimmed && 'opacity-50'
      )}>
      <div className={cn("comic-grid", isMobile && '!p-0 !gap-1.5')}>
        {board.map((row, r) =>
          row.map((card, c) => {
            const key = `${r}-${c}-${card?.uid ?? 'empty'}`;
            const selectable = isCardSelectable?.(r, c) ?? false;
            const isExploding =
              !!explodingCard && explodingCard.r === r && explodingCard.c === c;
            const isRivalMove =
              !!lastRivalMove && lastRivalMove.r === r && lastRivalMove.c === c;

            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'comic-card-slot',
                   isMobile && '!w-full !h-auto',
                  'focus:outline-none',
                  selectable && 'cursor-pointer',
                  !selectable && 'cursor-default'
                )}
                onClick={() => selectable && onCardClick?.(r, c)}
                disabled={!selectable || isDimmed}
              >
                <GameCard
                  card={card}
                  onClick={() => {}}
                  isSelected={false} // Selection is handled by parent
                  isSelectable={selectable}
                  isExploding={isExploding}
                  isRivalMove={isRivalMove}
                  isMobile={isMobile}
                  isDimmed={isDimmed}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
