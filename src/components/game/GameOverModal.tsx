'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Player } from '@/lib/types';
import { Trophy } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  winner: Player | null;
  scores: { id: number; score: number }[];
  onClose: () => void;
}

export default function GameOverModal({ isOpen, winner, scores, onClose }: GameOverModalProps) {
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex flex-col items-center gap-2 text-2xl">
            <Trophy className="w-12 h-12 text-yellow-500" />
            Game Over!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg">
            {winner ? `Player ${winner.id + 1} wins with ${scores.find(s => s.id === winner.id)?.score} points!` : 'The game ended in a draw!'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <h3 className="font-bold text-center mb-2">Final Scores:</h3>
          <ul className="space-y-1 text-center">
            {scores.sort((a,b) => b.score - a.score).map(({ id, score }) => (
              <li key={id} className="text-muted-foreground">
                Player {id + 1}: <span className="font-bold text-foreground">{score} points</span>
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full">Play Again</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
