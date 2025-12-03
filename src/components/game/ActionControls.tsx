'use client';

import { Button } from '@/components/ui/button';
import type { GameState } from '@/lib/types';
import type { GameAction } from '@/hooks/use-game';

interface ActionControlsProps {
  turnPhase: GameState['turnPhase'];
  isForcedToPlay: boolean;
  onAction: (action: GameAction['type']) => void;
}

export default function ActionControls({
  turnPhase,
  isForcedToPlay,
  onAction,
}: ActionControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-muted rounded-lg">
      {turnPhase === 'START_TURN' && (
        <Button
          size="lg"
          onClick={() => onAction('START_TURN')}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Start Turn (Draw Card)
        </Button>
      )}

      {turnPhase === 'REVEAL_CARD' && (
        <p className="text-center font-medium text-primary">
          Reveal a card on your board.
        </p>
      )}

      {turnPhase === 'ACTION' && (
        <>
          <p className="w-full text-center text-sm text-muted-foreground mb-2">
            Choose your action: Place a card, Swap, or Pass.
          </p>
          <Button
            variant="outline"
            disabled={isForcedToPlay}
            onClick={() => onAction('PASS_TURN')}
          >
            Pass Turn
          </Button>
          {isForcedToPlay && (
            <p className="text-xs text-destructive text-center w-full">You have too many cards and must play or swap.</p>
          )}
        </>
      )}
      {turnPhase === 'GAME_OVER' && (
         <p className="text-center font-medium text-primary">Game Over!</p>
      )}
    </div>
  );
}
