
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import GameCard from './GameCard';
import type { Card, Player } from '@/lib/types';
import type { GameCardDef } from '@/lib/card-definitions';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface MatchupScreenProps {
  player: { name: string; deck: Card[] };
  rival: { name: string; deck: Card[] };
  cardDefs: GameCardDef[];
  onAnimationComplete: () => void;
}

const getCharacterCardsFromDeck = (deck: Card[], cardDefs: GameCardDef[]): Card[] => {
    const characterColors = new Set<string>();
    const characterCards: Card[] = [];
    
    for (const card of deck) {
        if (card.type === 'Personaje' && card.color && !characterColors.has(card.color)) {
            characterColors.add(card.color);
            characterCards.push(card);
            if(characterCards.length === 4) break;
        }
    }
    return characterCards;
}


export default function MatchupScreen({
  player,
  rival,
  cardDefs,
  onAnimationComplete,
}: MatchupScreenProps) {
    const playerCharacterCards = useMemo(() => getCharacterCardsFromDeck(player.deck, cardDefs), [player.deck, cardDefs]);
    const rivalCharacterCards = useMemo(() => getCharacterCardsFromDeck(rival.deck, cardDefs), [rival.deck, cardDefs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 4500); // Duración total de la animación antes de empezar el juego
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const cardBackImageUrl = useMemo(() => {
      return cardDefs.find(def => def.id === 'card-back')?.imageUrl;
  }, [cardDefs]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5, delay: 0.5 }
    }
  };

  const itemVariants = (from: 'left' | 'right') => ({
    hidden: { x: from === 'left' ? '-100%' : '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 50,
        damping: 12,
        duration: 0.8,
      },
    },
  });

  const vsVariants = {
    hidden: { scale: 0, rotate: -90 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        delay: 0.8,
        type: 'spring',
        stiffness: 260,
        damping: 10,
      },
    },
  };

  const deckVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 1.2
        }
    }
  };
  
  const cardVariant = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.4 } }
  }


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4 comic-arena overflow-hidden"
    >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 to-background to-70% opacity-80" />
        <div className="absolute inset-0 background-pan opacity-20" />


      <div className="w-full max-w-4xl grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
        {/* Player */}
        <motion.div variants={itemVariants('left')} className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center text-center">
             <div className="h-16 w-16 mb-2 rounded-full bg-sky-500 border-[3px] border-black flex items-center justify-center shadow-[0_6px_0_#020617]">
                <User className="h-9 w-9 text-slate-900" />
            </div>
            <h2 className="comic-title text-2xl md:text-3xl text-white drop-shadow-[0_3px_0_#020617]">{player.name}</h2>
          </div>
          <motion.div variants={deckVariants} className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {playerCharacterCards.map((card, i) => (
                <motion.div key={card.uid} variants={cardVariant} className="w-20 md:w-24">
                    <GameCard card={{...card, isFaceUp: true}} onClick={() => {}} cardBackImageUrl={cardBackImageUrl} />
                </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* VS */}
        <motion.div variants={vsVariants}>
          <h1 className="font-display text-6xl md:text-8xl text-amber-400" style={{ textShadow: '0 4px 0 #000, 0 8px 10px rgba(0,0,0,0.7)' }}>
            VS
          </h1>
        </motion.div>

        {/* Rival */}
        <motion.div variants={itemVariants('right')} className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 mb-2 rounded-full bg-red-500 border-[3px] border-black flex items-center justify-center shadow-[0_6px_0_#020617]">
                <Bot className="h-9 w-9 text-slate-900" />
            </div>
            <h2 className="comic-title text-2xl md:text-3xl text-white drop-shadow-[0_3px_0_#020617]">{rival.name}</h2>
          </div>
          <motion.div variants={deckVariants} className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {rivalCharacterCards.map((card, i) => (
                 <motion.div key={card.uid} variants={cardVariant} className="w-20 md:w-24">
                    <GameCard card={{...card, isFaceUp: true}} onClick={() => {}} cardBackImageUrl={cardBackImageUrl}/>
                </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

       <motion.div 
            className="absolute bottom-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 0.5 }}
        >
            <p className="comic-title text-xl text-white animate-pulse">¡Prepárate para la batalla!</p>
        </motion.div>
    </motion.div>
  );
}
