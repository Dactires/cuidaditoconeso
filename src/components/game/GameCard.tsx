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
  isExploding?: boolean;
}

const colorMap: { [key: string]: string } = {
  Rojo: 'bg-red-600',
  Azul: 'bg-blue-600',
  Verde: 'bg-green-600',
  Amarillo: 'bg-yellow-500 text-black',
};

export default function GameCard({ card, onClick, isSelected = false, isSelectable = false, isExploding = false }: GameCardProps) {
  const isFaceUp = !!card && card.isFaceUp;

  const cardBack = (
    <div className="w-full h-full bg-primary rounded-lg flex items-center justify-center p-1 border-2 border-primary-foreground/50">
      <div className="w-full h-full rounded-md border-2 border-primary-foreground/20 border-dashed flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm -rotate-45 opacity-70">
          BOMBERS
        </span>
      </div>
    </div>
  );

  const cardFront = (
    <UICard
      className={cn(
        'w-full h-full flex flex-col items-center justify-center border-2 border-white/50 text-white rounded-lg',
        card?.type === 'Personaje' && card?.color ? colorMap[card.color] : 'bg-gray-800'
      )}
    >
      <CardHeader className="p-0 absolute top-1 right-1">
        <p className="text-xs font-bold">
          {card?.type === 'Bomba' ? 'BOMBA' : card?.color}
        </p>
      </CardHeader>
      <CardTitle className="text-4xl md:text-5xl font-bold">
        {card?.type === 'Bomba'
          ? <BombIcon className="w-10 h-10" />
          : card?.value}
      </CardTitle>
      <CardContent className="p-1 absolute bottom-0">
        <p className="text-xs font-semibold uppercase">{card?.type}</p>
      </CardContent>
    </UICard>
  );

  return (
    <div
      className={cn(
        'w-full h-full aspect-square cursor-pointer rounded-lg shadow-lg',
        isSelected && 'ring-4 ring-accent ring-offset-2 ring-offset-background scale-110 z-10',
        isSelectable && 'animate-pulse ring-2 ring-accent',
        isExploding && 'animate-explode',
        !card && 'cursor-default'
      )}
      onClick={onClick}
    >
      {!card ? (
        <div className="w-full h-full rounded-lg bg-black/20 border border-dashed border-white/20" />
      ) : isFaceUp ? (
        cardFront
      ) : (
        cardBack
      )}
    </div>
  );
}
