'use client';

import { Card as CardType } from '@/lib/types';
import GameCard from './GameCard';

interface PlayerHandProps {
  hand: CardType[];
  onCardClick: (card: CardType, index: number) => void;
  selectedCardId?: string | null;
  isCardSelectable: (card: CardType) => boolean;
}

export default function PlayerHand({ hand, onCardClick, selectedCardId, isCardSelectable }: PlayerHandProps) {
  return (
    <div className="flex justify-center items-center gap-2 p-2 min-h-[90px] lg:min-h-[120px]">
      {hand.length === 0 ? (
        <p className="text-muted-foreground">Your hand is empty.</p>
      ) : (
        hand.map((card, index) => (
          <div key={card.uid} className="w-1/4 max-w-[70px] lg:max-w-[90px] aspect-[2.5/3.5] relative">
            <GameCard
              card={card}
              onClick={() => onCardClick(card, index)}
              isSelected={selectedCardId === card.uid}
              isSelectable={isCardSelectable(card)}
            />
          </div>
        ))
      )}
    </div>
  );
}
