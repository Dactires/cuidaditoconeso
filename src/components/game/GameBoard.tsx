'use client';

import { Card as CardType, Player } from '@/lib/types';
import GameCard from './GameCard';

interface GameBoardProps {
  board: (CardType | null)[][];
  onCardClick: (r: number, c: number) => void;
  isCardSelectable: (r: number, c: number) => boolean;
  isRival?: boolean;
}

export default function GameBoard({ board, onCardClick, isCardSelectable, isRival = false }: GameBoardProps) {
  return (
    <div className={`grid grid-cols-3 gap-1 md:gap-2 p-1 md:p-2 rounded-lg bg-secondary/50 border-2 border-dashed border-secondary h-full ${isRival ? 'rotate-180' : ''}`}>
      {board.map((row, r) =>
        row.map((card, c) => (
          <div key={`${r}-${c}`} className={`relative ${isRival ? 'rotate-180' : ''}`}>
            <GameCard
              card={card}
              onClick={() => onCardClick(r, c)}
              isSelectable={isCardSelectable(r,c)}
            />
          </div>
        ))
      )}
    </div>
  );
}
