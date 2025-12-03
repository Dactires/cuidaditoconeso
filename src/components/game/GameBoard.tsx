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
    <div className="comic-panel comic-grid">
      {board.map((row, r) =>
        row.map((card, c) => (
          <div key={`${r}-${c}`} className="comic-card-slot relative">
            <GameCard
              card={card}
              onClick={() => onCardClick(r, c)}
              isSelectable={isCardSelectable(r, c)}
              isExploding={explodingCard?.r === r && explodingCard?.c === c}
            />
          </div>
        ))
      )}
    </div>
  );
}
