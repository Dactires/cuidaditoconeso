
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
import { Player, GameState } from '@/lib/types';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
  onExit: () => void;
}

export default function GameOverModal({ state, onRestart, onExit }: GameOverModalProps) {
  if (!state.gameOver) return null;

  const { winner, finalScores, gameMessage } = state;

  const getWinnerText = () => {
    if (winner) {
      const winnerName = winner.id === 0 ? "Jugador 1 (Tú)" : `Rival (IA)`;
      return `¡${winnerName} gana!`;
    }
    return `¡El juego terminó en un empate!`;
  }
  
  const sortedScores = [...finalScores].sort((a,b) => b.score - a.score);

  return (
      <motion.div initial={{scale: 0.7, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{duration: 0.4, ease: "backOut"}}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex flex-col items-center gap-4 text-3xl text-accent font-display tracking-wider">
            <Trophy className="w-16 h-16 text-accent drop-shadow-[0_0_10px_hsl(var(--accent))]" />
            <span className="comic-title">¡Fin del Juego!</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg text-slate-300 pt-2 comic-subtitle">
            {gameMessage || getWinnerText()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-6">
          <h3 className="comic-title text-center mb-3 text-accent">Puntajes Finales:</h3>
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
        <AlertDialogFooter className="gap-2 sm:gap-0">
            <button onClick={onExit} className="comic-btn comic-btn-secondary">Volver a la Sala</button>
            <button onClick={onRestart} className="comic-btn comic-btn-primary">Jugar de Nuevo</button>
        </AlertDialogFooter>
      </motion.div>
  );
}
