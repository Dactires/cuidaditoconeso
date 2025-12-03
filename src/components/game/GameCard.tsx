'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/lib/types';
import { BombIcon } from '@/components/icons/BombIcon';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameCardProps {
  card: Card | null;
  onClick: () => void;
  isSelected?: boolean;
  isSelectable?: boolean;
}

const colorMap: { [key: string]: string } = {
  Rojo: 'bg-red-500',
  Azul: 'bg-blue-500',
  Verde: 'bg-green-500',
  Amarillo: 'bg-yellow-400 text-black',
};

export default function GameCard({ card, onClick, isSelected = false, isSelectable = false }: GameCardProps) {
  const cardBack = (
    <div className="absolute w-full h-full bg-primary rounded-lg backface-hidden flex items-center justify-center">
      <div className="w-3/4 h-3/4 rounded-md border-2 border-primary-foreground/50 border-dashed" />
    </div>
  );

  const cardFront = (
    <div className="absolute w-full h-full backface-hidden [transform:rotateY(180deg)]">
      {card ? (
        <UICard
          className={cn(
            'w-full h-full flex flex-col items-center justify-center',
            card.type === 'Personaje' && card.color ? colorMap[card.color] : 'bg-destructive text-destructive-foreground'
          )}
        >
          <CardHeader className="p-0">
            <CardTitle className="text-4xl md:text-5xl font-bold">
              {card.type === 'Bomba' ? <BombIcon className="w-12 h-12" /> : card.value}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-xs font-semibold uppercase">{card.type}</p>
          </CardContent>
        </UICard>
      ) : (
        <div className="w-full h-full rounded-lg bg-muted/50 border border-dashed" />
      )}
    </div>
  );

  return (
    <div className="aspect-[2.5/3.5] [perspective:1000px]" onClick={onClick}>
      <div
        className={cn(
          'relative w-full h-full cursor-pointer rounded-lg shadow-md transition-transform duration-700 [transform-style:preserve-3d]',
          card?.isFaceUp && '[transform:rotateY(180deg)]',
          isSelected && 'ring-4 ring-accent ring-offset-2 scale-105',
          isSelectable && 'animate-pulse ring-2 ring-accent',
          !card && 'cursor-not-allowed'
        )}
      >
        {cardBack}
        {cardFront}
      </div>
    </div>
  );
}
