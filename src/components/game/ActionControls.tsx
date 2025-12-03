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
    <div className="flex flex-wrap items-center justify-center gap-2 p-2 rounded-lg">
      {turnPhase === 'START_TURN' && (
        <Button
          size="lg"
          onClick={() => onAction('START_TURN')}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
        >
          Start Turn (Draw Card)
        </Button>
      )}

      {turnPhase === 'REVEAL_CARD' && (
        <p className="text-center font-semibold text-amber-300">
          Reveal a card on your board.
        </p>
      )}

      {turnPhase === 'ACTION' && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="bg-transparent text-white hover:bg-white/10"
            disabled={isForcedToPlay}
            onClick={() => onAction('PASS_TURN')}
          >
            Pass Turn
          </Button>
          {isForcedToPlay && (
            <p className="text-xs text-red-400 font-semibold text-center w-full">You have too many cards and must play or swap.</p>
          )}
        </>
      )}
      {turnPhase === 'GAME_OVER' && (
         <p className="text-center font-bold text-2xl text-amber-400">Game Over!</p>
      )}
    </div>
  );
}
