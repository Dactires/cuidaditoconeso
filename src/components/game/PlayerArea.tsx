'use client';

import { Player } from '@/lib/types';
import GameBoard from './GameBoard';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-4">
        <h2 className={cn('font-headline text-xl', isCurrentPlayer ? 'text-primary' : 'text-muted-foreground')}>
          Player {player.id + 1} {isRival && '(Rival)'} {isCurrentPlayer && '(You)'}
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={isCurrentPlayer ? 'default' : 'secondary'} className="text-lg">
            Score: {score}
          </Badge>
          {isCurrentPlayer && turnPhase !== 'START_TURN' && <Badge variant="destructive">Your Turn</Badge>}
        </div>
      </div>
      <GameBoard 
        board={player.board} 
        onCardClick={onCardClick}
        isCardSelectable={isCardSelectable}
        isRival={isRival}
      />
    </div>
  );
}
