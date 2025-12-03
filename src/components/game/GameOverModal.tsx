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
      <AlertDialogContent className="bg-gray-800 text-white border-yellow-500">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex flex-col items-center gap-2 text-2xl text-yellow-400">
            <Trophy className="w-12 h-12 text-yellow-400" />
            Game Over!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg text-white/90">
            {winner ? `Player ${winner.id + 1} wins with a score of ${scores.find(s => s.id === winner.id)?.score}!` : 'The game ended in a draw!'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <h3 className="font-bold text-center mb-2 text-yellow-400">Final Scores:</h3>
          <ul className="space-y-1 text-center">
            {scores.sort((a,b) => b.score - a.score).map(({ id, score }) => (
              <li key={id} className="text-white/80">
                Player {id + 1}: <span className="font-bold text-white">{score} points</span>
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full bg-yellow-500 text-black hover:bg-yellow-600">Play Again</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
