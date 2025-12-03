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
  Rojo: 'bg-red-600',
  Azul: 'bg-blue-600',
  Verde: 'bg-green-600',
  Amarillo: 'bg-yellow-500 text-black',
};

export default function GameCard({ card, onClick, isSelected = false, isSelectable = false }: GameCardProps) {
  const cardBack = (
    <div className="absolute w-full h-full bg-blue-800 rounded-lg backface-hidden flex items-center justify-center p-1 border-2 border-blue-400">
      <div className="w-full h-full rounded-md border-2 border-blue-400/50 border-dashed flex items-center justify-center">
        <span className="text-blue-200 font-bold text-sm -rotate-45">BOMBERS</span>
      </div>
    </div>
  );

  const cardFront = (
    <div className="absolute w-full h-full backface-hidden [transform:rotateY(180deg)]">
      {card ? (
        <UICard
          className={cn(
            'w-full h-full flex flex-col items-center justify-center border-2 border-white/50 text-white',
            card.type === 'Personaje' && card.color ? colorMap[card.color] : 'bg-gray-800'
          )}
        >
          <CardHeader className="p-0 absolute top-1 right-1">
             <p className="text-xs font-bold">{card.type === 'Bomba' ? 'BOMB' : card.color}</p>
          </CardHeader>
           <CardTitle className="text-4xl md:text-5xl font-bold">
              {card.type === 'Bomba' ? <BombIcon className="w-10 h-10" /> : card.value}
            </CardTitle>
          <CardContent className="p-1 absolute bottom-0">
            <p className="text-xs font-semibold uppercase">{card.type}</p>
          </CardContent>
        </UICard>
      ) : (
        <div className="w-full h-full rounded-lg bg-black/20 border border-dashed border-white/20" />
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 [perspective:1000px] aspect-square" onClick={onClick}>
      <div
        className={cn(
          'relative w-full h-full cursor-pointer rounded-lg shadow-lg transition-transform duration-700 [transform-style:preserve-3d]',
          card?.isFaceUp && '[transform:rotateY(180deg)]',
          isSelected && 'ring-4 ring-yellow-400 ring-offset-2 scale-110 z-10',
          isSelectable && 'animate-pulse ring-2 ring-yellow-400',
          !card && 'cursor-default'
        )}
      >
        {cardBack}
        {cardFront}
      </div>
    </div>
  );
}
