'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import GameCard from './GameCard';

type ExplodingPos = { r: number; c: number };

interface GameBoardProps {
  board: (Card | null)[][];
  onCardClick?: (r: number, c: number) => void;
  isCardSelectable?: (r: number, c: number) => boolean;
  explodingCard?: ExplodingPos;
  isMobile?: boolean;
}

/**
 * Tablero 3x3 estilo cómic.
 * Usa:
 *  - .comic-panel   → marco azul con sombra
 *  - .comic-grid    → grid 3x3 con padding
 *  - .comic-card-slot → tamaño fijo cuadrado para cada carta
 */
export default function GameBoard({
  board,
  onCardClick,
  isCardSelectable,
  explodingCard,
  isMobile
}: GameBoardProps) {
  return (
    <div className={cn("comic-panel flex items-center justify-center p-2", isMobile && '!p-2 !shadow-none !border-2')}>
      <div className={cn("comic-grid", isMobile && '!p-1 !gap-1.5')}>
        {board.map((row, r) =>
          row.map((card, c) => {
            const key = `${r}-${c}-${card?.uid ?? 'empty'}`;
            const selectable = isCardSelectable?.(r, c) ?? false;
            const isExploding =
              !!explodingCard && explodingCard.r === r && explodingCard.c === c;

            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'comic-card-slot',
                  isMobile && '!w-20 !h-auto',
                  'focus:outline-none',
                  selectable && 'cursor-pointer',
                  !selectable && 'cursor-default'
                )}
                onClick={() => selectable && onCardClick?.(r, c)}
                disabled={!selectable}
              >
                <GameCard
                  card={card}
                  onClick={() => {}}
                  isSelected={false} // Selection is handled by parent
                  isSelectable={selectable}
                  isExploding={isExploding}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

    