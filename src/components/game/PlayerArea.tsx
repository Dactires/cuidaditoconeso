'use client';

import { Player } from '@/lib/types';
import GameBoard from './GameBoard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer?: boolean;
  isRival?: boolean;
  onCardClick: (r: number, c: number) => void;
  isCardSelectable: (r: number, c: number) => boolean;
}

function calculateScore(board: (Player['board'][0][0])[][]) {
  return board.flat().reduce((acc, card) => {
    if (card && card.isFaceUp && card.type === 'Personaje' && card.value) {
      return acc + card.value;
    }
    return acc;
  }, 0);
}

export default function PlayerArea({ player, isCurrentPlayer = false, isRival = false, onCardClick, isCardSelectable }: PlayerAreaProps) {
  const score = calculateScore(player.board);

  // This variable is not used in the original code, but I'll keep the logic here in case it's needed later.
  // The turn phase information is managed in the parent GamePage component.
  const turnPhase = 'ACTION'; // Example value, as it's not passed down.

  return (
    <div className="flex flex-col h-full space-y-2">
      <div className="flex justify-between items-center px-2 lg:px-4 flex-shrink-0">
        <h2 className={cn('font-headline text-lg lg:text-xl', isCurrentPlayer ? 'text-primary' : 'text-muted-foreground')}>
          Player {player.id + 1} {isRival && '(Rival)'} {isCurrentPlayer && '(You)'}
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={isCurrentPlayer ? 'default' : 'secondary'} className="text-base lg:text-lg">
            Score: {score}
          </Badge>
          {isCurrentPlayer && turnPhase !== 'START_TURN' && <Badge variant="destructive">Your Turn</Badge>}
        </div>
      </div>
      <div className="flex-grow min-h-0">
        <GameBoard 
          board={player.board} 
          onCardClick={onCardClick}
          isCardSelectable={isCardSelectable}
          isRival={isRival}
        />
      </div>
    </div>
  );
}
