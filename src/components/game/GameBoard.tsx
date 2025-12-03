'use client';

import { Card as CardType } from '@/lib/types';
import GameCard from './GameCard';

interface GameBoardProps {
  board: (CardType | null)[][];
  onCardClick: (r: number, c: number) => void;
  isCardSelectable?: (r: number, c: number) => boolean;
  explodingCard?: { r: number; c: number };
}

export default function GameBoard({
  board,
  onCardClick,
  isCardSelectable = () => false,
  explodingCard,
}: GameBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-black/30 shadow-inner">
      {board.map((row, r) =>
        row.map((card, c) => (
          <div
            key={`${r}-${c}`}
            className="relative w-24 aspect-square md:w-28"
          >
            <GameCard
              card={card}
              onClick={() => onCardClick(r, c)}
              isSelectable={isCardSelectable(r, c)}
              isExploding={
                explodingCard?.r === r && explodingCard?.c === c
              }
            />
          </div>
        )),
      )}
    </div>
  );
}
