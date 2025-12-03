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
}: GameBoardProps) {
  return (
    <div className="comic-panel comic-grid">
      {board.map((row, r) =>
        row.map((card, c) => {
          const key = `${r}-${c}-${card?.uid ?? 'empty'}`;
          const selectable = isCardSelectable?.(r, c) ?? false;
          const isExploding =
            !!explodingCard && explodingCard.r === r && explodingCard.c === c;

          return (
            <div
              key={key}
              className={cn(
                'comic-card-slot focus:outline-none',
                selectable && 'cursor-pointer',
                !selectable && 'cursor-default'
              )}
              onClick={() => selectable && onCardClick?.(r, c)}
            >
              <GameCard
                card={card}
                onClick={() => {}}
                isSelected={false} // Selection is handled by parent through isSelectable
                isSelectable={selectable}
                isExploding={isExploding}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
