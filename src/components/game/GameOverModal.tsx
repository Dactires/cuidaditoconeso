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
import { motion } from 'framer-motion';

interface GameOverModalProps {
  isOpen: boolean;
  winner: Player | null;
  scores: { id: number; score: number }[];
  onClose: () => void;
}

export default function GameOverModal({ isOpen, winner, scores, onClose }: GameOverModalProps) {
  if (!isOpen) return null;

  const getWinnerText = () => {
    if (winner) {
      const winnerScore = scores.find(s => s.id === winner.id)?.score;
      const winnerName = winner.id === 0 ? "Jugador 1 (Tú)" : `Rival (IA)`;
      return `¡${winnerName} gana con ${winnerScore} puntos!`;
    }
    const tieScore = scores[0]?.score;
    return `¡El juego terminó en un empate a ${tieScore} puntos!`;
  }

  const sortedScores = [...scores].sort((a,b) => b.score - a.score);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="font-body border-accent/50 bg-slate-900 text-white">
          <motion.div initial={{scale: 0.7, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{duration: 0.4, ease: "backOut"}}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex flex-col items-center gap-4 text-3xl text-accent font-display tracking-wider">
                <Trophy className="w-16 h-16 text-accent drop-shadow-[0_0_10px_hsl(var(--accent))]" />
                ¡Fin del Juego!
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-lg text-slate-300 pt-2">
                {getWinnerText()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-6">
              <h3 className="font-bold text-center mb-3 text-accent font-display">Puntajes Finales:</h3>
              <ul className="space-y-2 text-center">
                {sortedScores.map(({ id, score }, index) => (
                  <motion.li 
                    key={id} 
                    className="text-slate-300 text-lg"
                    initial={{opacity: 0, x: -20}}
                    animate={{opacity: 1, x: 0}}
                    transition={{delay: 0.5 + index * 0.1}}
                  >
                    {id === 0 ? "Jugador 1 (Tú)" : "Rival (IA)"}: <span className="font-bold text-white">{score} puntos</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose} className="w-full bg-accent text-accent-foreground font-display tracking-wider text-lg hover:bg-accent/90">Jugar de Nuevo</AlertDialogAction>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
    </AlertDialog>
  );
}
