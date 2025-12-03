'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import GameCard from './GameCard';
import { CARD_DEFINITIONS } from '@/lib/card-definitions';
import { Progress } from '@/components/ui/progress';

const TIPS = [
  "Coloca bombas en las esquinas para maximizar su área de efecto.",
  "No reveles tus cartas más valiosas al principio de la partida.",
  "Usa las habilidades de tus personajes para controlar el tablero del rival.",
  "A veces, pasar el turno es la mejor jugada si no tienes una buena carta que jugar.",
  "Recuerda que solo las cartas boca arriba suman puntos al final.",
  "Una bomba puede dar la vuelta a una partida si se usa en el momento adecuado.",
  "Intenta adivinar dónde están las cartas más débiles del rival para colocar tus bombas."
];

const cardSamples = CARD_DEFINITIONS.filter(c => c.kind === 'character' || c.kind === 'bomb').slice(0, 5);

const FloatingCard = ({ card, index, cardBackImageUrl }: { card: any, index: number, cardBackImageUrl?: string }) => {
  const cardForDisplay = {
    ...card,
    uid: `loading-${card.id}-${index}`,
    type: card.kind === 'bomb' ? 'Bomba' : 'Personaje',
    value: card.kind === 'character' ? Math.floor(Math.random() * 5) + 1 : null,
    isFaceUp: Math.random() > 0.5,
  };

  const duration = 15 + index * 2;

  return (
    <motion.div
      className="absolute"
      initial={{ 
        top: `${Math.random() * 80}%`,
        left: `${Math.random() * 80}%`,
        scale: 0.7,
        opacity: 0.6
      }}
      animate={{
        x: [0, 40, -30, 20, 0],
        y: [0, -25, 30, -10, 0],
        rotate: [0, 5, -8, 3, 0],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <GameCard card={cardForDisplay} onClick={() => {}} cardBackImageUrl={cardBackImageUrl} isMobile={false} />
    </motion.div>
  );
};


export default function GameLoadingScreen({ cardBackImageUrl }: { cardBackImageUrl?: string }) {
  const [progress, setProgress] = useState(10);
  const [currentTip, setCurrentTip] = useState('');

  useEffect(() => {
    setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5) + 2;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4 comic-arena">
       <div className="absolute inset-0 overflow-hidden opacity-30">
          {cardSamples.map((card, index) => (
             <div key={index} className="w-28 h-40">
                <FloatingCard card={card} index={index} cardBackImageUrl={cardBackImageUrl} />
             </div>
          ))}
       </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="comic-title text-3xl md:text-5xl text-white mb-4">
          Preparando Batalla
        </h1>
        <Loader className="w-8 h-8 text-accent animate-spin mb-8" />
        
        <div className="w-full max-w-md space-y-4">
            <Progress value={progress} className="h-4 border-2 border-black shadow-[0_3px_0_#020617]" />
            <div className="min-h-[40px]">
                <motion.p 
                    key={currentTip}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-sm text-slate-200"
                >
                    <span className="font-display text-accent text-xs tracking-widest">CONSEJO: </span>
                    {currentTip}
                </motion.p>
            </div>
        </div>

      </div>
    </div>
  );
}
