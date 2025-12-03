'use client';

import React, { useState, useEffect } from 'react';
import { useGame, GameAction } from '@/hooks/use-game';
import type { Card as CardType, Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

import GameBoard from '@/components/game/GameBoard';
import GameCard from '@/components/game/GameCard';
import GameOverModal from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/button';
import { User, Bot, Swords, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from '@/hooks/use-mobile';


type Selection = {
  card: CardType;
  index: number;
} | null;

type BoardSelection = {
  playerId: number;
  r: number;
  c: number;
} | null;

function getBoardScore(board: (CardType | null)[][]): number {
  return board.flat().reduce((score, card) => {
    if (card && card.isFaceUp && card.type === 'Personaje' && card.value) {
      return score + card.value;
    }
    return score;
  }, 0);
}

export default function GamePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { gameState, dispatch, initialized } = useGame(2);
  const { playFlip, playBomb, playDeal } = useGameSounds();
  const { toast } = useToast();
  const [selectedHandCard, setSelectedHandCard] = useState<Selection>(null);
  const [targetBoardPos, setTargetBoardPos] = useState<BoardSelection>(null);
  const isMobile = useIsMobile();

  const [showDrawAnimation, setShowDrawAnimation] = useState<number | null>(null);

  const { players, currentPlayerIndex, turnPhase, gameOver, winner, finalScores, gameMessage, deck, discardPile, explodingCard, lastRevealedCard } = gameState;
  const humanPlayerId = 0;
  const aiPlayerId = 1;
  const currentPlayer = players?.[currentPlayerIndex];
  const humanPlayer = players?.[humanPlayerId];
  const rivalPlayer = players?.[aiPlayerId];
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Sound effects trigger
  useEffect(() => {
    if (lastRevealedCard) {
      if (lastRevealedCard.type === 'Bomba') {
        playBomb();
      } else {
        playFlip();
      }
    }
  }, [lastRevealedCard, playBomb, playFlip]);

  // AI Logic Trigger
  useEffect(() => {
    if (gameOver || !initialized || currentPlayerIndex !== aiPlayerId) return;
  
    const performAiAction = (action: GameAction, delay = 1500) => {
      setTimeout(() => {
        if (action.type === 'START_TURN') {
          setShowDrawAnimation(aiPlayerId);
        }
        dispatch(action);
      }, delay); 
    };
  
    if (turnPhase === 'START_TURN') {
      performAiAction({ type: 'START_TURN', payload: { player_id: aiPlayerId } }, 500);
    } else if (turnPhase === 'REVEAL_CARD') {
      const availableCards: {r: number, c: number}[] = [];
      rivalPlayer.board.forEach((row, r) => {
        row.forEach((card, c) => {
          if (card && !card.isFaceUp) {
            availableCards.push({r, c});
          }
        });
      });
      if (availableCards.length > 0) {
        const {r, c} = availableCards[Math.floor(Math.random() * availableCards.length)];
        performAiAction({ type: 'REVEAL_CARD', payload: { player_id: aiPlayerId, r, c } });
      } else {
        performAiAction({ type: 'PASS_TURN', payload: { player_id: aiPlayerId } });
      }
    } else if (turnPhase === 'ACTION') {
      if (rivalPlayer.hand.length >= 4) {
        const cardToPlay = rivalPlayer.hand.find(c => c.type === 'Personaje');
        if (cardToPlay) {
            const availableSpots: {r: number, c: number}[] = [];
            rivalPlayer.board.forEach((row, r) => {
                row.forEach((card, c) => {
                    if (!card || !card.isFaceUp) {
                        availableSpots.push({ r, c });
                    }
                });
            });
            if (availableSpots.length > 0) {
                const {r, c} = availableSpots[0];
                performAiAction({ type: 'PLAY_CARD_OWN', payload: { player_id: aiPlayerId, card_in_hand: cardToPlay, target_r: r, target_c: c } });
                return;
            }
        }
      }
      performAiAction({ type: 'PASS_TURN', payload: { player_id: aiPlayerId } });
    }
  
  }, [currentPlayerIndex, turnPhase, rivalPlayer, dispatch, gameOver, initialized]);

  // Human player auto-draw
  useEffect(() => {
    if (gameOver || !initialized || currentPlayerIndex !== humanPlayerId || turnPhase !== 'START_TURN') return;

    setShowDrawAnimation(humanPlayerId);
    const timer = setTimeout(() => {
      dispatch({ type: 'START_TURN', payload: { player_id: humanPlayerId } });
      playDeal();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPlayerIndex, turnPhase, dispatch, gameOver, initialized, humanPlayerId, playDeal]);

  useEffect(() => {
    if (showDrawAnimation !== null) {
      const timer = setTimeout(() => setShowDrawAnimation(null), 1500); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [showDrawAnimation]);

  // Handle card playing logic
  useEffect(() => {
    if (targetBoardPos && selectedHandCard && currentPlayer) {
      const actionType =
        targetBoardPos.playerId === currentPlayer.id
          ? 'PLAY_CARD_OWN'
          : 'PLAY_CARD_RIVAL';
      dispatch({
        type: actionType,
        payload: {
          player_id: currentPlayer.id,
          card_in_hand: selectedHandCard.card,
          target_r: targetBoardPos.r,
          target_c: targetBoardPos.c,
        },
      });
      setSelectedHandCard(null);
      setTargetBoardPos(null);
    }
  }, [targetBoardPos, selectedHandCard, dispatch, currentPlayer]);

  // Clear explosion animation state
  useEffect(() => {
    if (explodingCard) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_EXPLOSION' });
      }, 1000); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
  }, [explodingCard, dispatch]);

  if (isUserLoading || !user || !initialized || !humanPlayer || !rivalPlayer || !currentPlayer || isMobile === undefined) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <p className="text-foreground text-2xl font-display animate-pulse">
          Cargando Juego...
        </p>
      </div>
    );
  }

  const humanPlayerScore = getBoardScore(humanPlayer.board);
  const rivalPlayerScore = getBoardScore(rivalPlayer.board);

  const handleBoardClick = (playerId: number, r: number, c: number) => {
    if (gameOver || currentPlayerIndex !== humanPlayerId) return;

    if (turnPhase === 'REVEAL_CARD' && playerId === humanPlayer.id) {
      dispatch({ type: 'REVEAL_CARD', payload: { player_id: playerId, r, c } });
    } else if (turnPhase === 'ACTION' && selectedHandCard) {
      setTargetBoardPos({ playerId, r, c });
    } else if (turnPhase === 'ACTION' && !selectedHandCard && playerId === humanPlayer.id) {
      const card = humanPlayer.board[r][c];
      if (card && card.isFaceUp) {
        dispatch({
          type: 'SET_MESSAGE',
          payload: 'Ahora selecciona una carta de Personaje de tu mano para intercambiar.',
        });
        setTargetBoardPos({ playerId, r, c });
      }
    }
  };

  const handleHandCardClick = (card: CardType, index: number) => {
    if (gameOver || turnPhase !== 'ACTION' || currentPlayerIndex !== humanPlayerId) return;

    if (targetBoardPos) {
      if (targetBoardPos.playerId === humanPlayer.id && card.type === 'Personaje') {
        dispatch({
          type: 'SWAP_CARD',
          payload: {
            player_id: humanPlayer.id,
            board_r: targetBoardPos.r,
            board_c: targetBoardPos.c,
            card_in_hand: card,
          },
        });
        setTargetBoardPos(null);
      }
    } else {
      setSelectedHandCard(
        selectedHandCard?.card.uid === card.uid ? null : { card, index },
      );
    }
  };

  const handlePassTurn = () => {
    if (gameOver || currentPlayerIndex !== humanPlayerId || turnPhase !== 'ACTION') return;
    dispatch({ type: 'PASS_TURN', payload: { player_id: humanPlayer.id } });
    setSelectedHandCard(null);
    setTargetBoardPos(null);
  };

  const isBoardCardSelectable = (playerId: number, r: number, c: number) => {
    if (gameOver || currentPlayerIndex !== humanPlayerId) return false;
    const card = players.find(p => p.id === playerId)?.board[r][c];

    if (turnPhase === 'REVEAL_CARD') {
      return playerId === humanPlayer.id && !!card && !card.isFaceUp;
    }
    if (turnPhase === 'ACTION') {
      if (selectedHandCard) {
        return (
          (selectedHandCard.card.type === 'Personaje' &&
            playerId === humanPlayer.id &&
            !!card &&
            !card.isFaceUp) ||
          (playerId === rivalPlayer.id && !!card && !card.isFaceUp)
        );
      }
      return playerId === humanPlayer.id && !!card && card.isFaceUp;
    }
    return false;
  };

  const isHandCardSelectable = (card: CardType) => {
    if (gameOver || turnPhase !== 'ACTION' || currentPlayerIndex !== humanPlayerId) return false;
    return targetBoardPos ? card.type === 'Personaje' : true;
  };

  const renderDesktopView = () => (
    <div className="comic-arena">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="absolute bottom-4 right-4 z-20 comic-btn bg-red-600 !text-white hover:bg-red-700 shadow-[0_4px_0_#991b1b] hover:shadow-[0_4px_0_#7f1d1d] active:shadow-[0_2px_0_#7f1d1d] active:translate-y-0.5"
            >
              <LogOut className="h-4 w-4" />
              Abandonar partida
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div className="comic-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="comic-title text-amber-300">¿Estás seguro que deseas rendirte?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  Si abandonas la partida ahora, contará como una derrota en tus estadísticas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel asChild>
                  <button className="comic-btn comic-btn-secondary">Cancelar</button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <button 
                    onClick={() => router.push('/lobby')} 
                    className="comic-btn bg-red-600 !text-white hover:bg-red-700 shadow-[0_4px_0_#991b1b] hover:shadow-[0_4px_0_#7f1d1d] active:shadow-[0_2px_0_#7f1d1d] active:translate-y-0.5"
                  >
                    Rendirse
                  </button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <span className="comic-turn-chip">
            {currentPlayerIndex === humanPlayerId ? 'Tu turno' : 'Turno del rival'}
          </span>
        </div>
  
        <div className="comic-arena-inner">
          <div className="flex flex-col gap-4 h-full">
            <div className="comic-panel px-4 py-3 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-sky-500 border-[3px] border-black flex items-center justify-center">
                <User className="h-6 w-6 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span className="font-display tracking-[0.25em] text-[11px] uppercase text-slate-200/80">
                  Jugador 1 (Tú)
                </span>
                <span className="text-xs text-slate-200/70">
                  Puntaje: <span className="font-semibold text-white">{humanPlayerScore}</span>
                </span>
              </div>
            </div>
  
            <div className="comic-panel px-4 py-3 flex flex-col gap-3">
              <span className="comic-section-title">Tu mano</span>
              <div className="grid grid-cols-2 gap-3">
                {humanPlayer.hand.map((card, index) => (
                  <div key={card.uid} className="comic-card-slot">
                    <GameCard
                      card={card}
                      onClick={() => handleHandCardClick(card, index)}
                      isSelected={selectedHandCard?.card.uid === card.uid}
                      isSelectable={isHandCardSelectable(card)}
                    />
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - humanPlayer.hand.length) }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="comic-card-slot rounded-xl border-2 border-dashed border-slate-700/70 bg-slate-900/40"
                  />
                ))}
              </div>
  
              <div className="mt-2">
                {turnPhase === 'ACTION' && currentPlayerIndex === humanPlayerId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full font-display tracking-[0.25em] uppercase text-xs"
                    disabled={gameState.isForcedToPlay}
                    onClick={handlePassTurn}
                  >
                    Pasar turno
                  </Button>
                )}
                {turnPhase === 'ACTION' && gameState.isForcedToPlay && currentPlayerIndex === humanPlayerId && (
                  <p className="mt-1 text-[11px] text-amber-300 text-center">
                    Debes jugar o intercambiar una carta.
                  </p>
                )}
              </div>
            </div>
          </div>
  
          <div className="flex flex-col items-center justify-center gap-8">
            <GameBoard
              board={rivalPlayer.board}
              onCardClick={(r, c) => handleBoardClick(rivalPlayer.id, r, c)}
              isCardSelectable={(r, c) => isBoardCardSelectable(rivalPlayer.id, r, c)}
              explodingCard={
                explodingCard && explodingCard.playerId === rivalPlayer.id
                  ? { r: explodingCard.r, c: explodingCard.c }
                  : undefined
              }
            />

            <div className="h-2" />

            <GameBoard
              board={humanPlayer.board}
              onCardClick={(r, c) => handleBoardClick(humanPlayer.id, r, c)}
              isCardSelectable={(r, c) => isBoardCardSelectable(humanPlayer.id, r, c)}
              explodingCard={
                explodingCard && explodingCard.playerId === humanPlayer.id
                  ? { r: explodingCard.r, c: explodingCard.c }
                  : undefined
              }
            />
          </div>
  
          <div className="flex flex-col gap-4 h-full">
            <div className="comic-panel px-4 py-3 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-red-500 border-[3px] border-black flex items-center justify-center">
                <Bot className="h-6 w-6 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span className="font-display tracking-[0.25em] text-[11px] uppercase text-slate-200/80">
                  Rival (IA)
                </span>
                <span className="text-xs text-slate-200/70">
                  Puntaje: <span className="font-semibold text-white">{rivalPlayerScore}</span>
                </span>
              </div>
            </div>
  
            <div className="comic-panel px-4 py-3 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex flex-col items-center gap-2">
                  <span className="comic-section-title">Mazo</span>
                  <div className="comic-card-slot">
                    <GameCard
                      card={deck.length > 0 ? { ...deck[deck.length - 1], isFaceUp: false } : null}
                      onClick={() => {}}
                    />
                  </div>
                  <span className="text-[11px] text-slate-200/70 font-mono">
                    {deck.length} cartas
                  </span>
                </div>
  
                <div className="flex flex-col items-center gap-2">
                  <span className="comic-section-title">Descarte</span>
                  <div className="comic-card-slot">
                    {discardPile.length > 0 ? (
                      <GameCard
                        card={{ ...discardPile[discardPile.length - 1], isFaceUp: true }}
                        onClick={() => {}}
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-700/70 bg-slate-900/40 flex items-center justify-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                          Vacío
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-200/70 font-mono">
                    {discardPile.length} cartas
                  </span>
                </div>
              </div>
  
              <div className="mt-2 text-[11px] text-slate-200/80 leading-snug min-h-[3rem]">
                {gameMessage}
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  const renderMobileView = () => (
    <div className="h-full w-full flex flex-col p-2 gap-4 relative">
      {/* Rival Area */}
      <div className='flex flex-col items-center gap-2'>
        <div className="flex items-center justify-between w-full px-2">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-500 border-2 border-black flex items-center justify-center">
                    <Bot className="h-5 w-5 text-slate-900" />
                </div>
                <div className="flex flex-col">
                    <span className="font-display tracking-widest text-[10px] uppercase text-slate-200/80">Rival (IA)</span>
                    <span className="text-xs text-slate-200/70">Puntaje: <span className="font-semibold text-white">{rivalPlayerScore}</span></span>
                </div>
            </div>
            <div className='flex gap-1'>
            {rivalPlayer.hand.map((card, index) => (
              <div key={index} className='w-8 h-11'>
                <GameCard card={{...card, isFaceUp: false}} onClick={() => {}} />
              </div>
            ))}
            </div>
        </div>
        <GameBoard
            board={rivalPlayer.board}
            onCardClick={(r, c) => handleBoardClick(rivalPlayer.id, r, c)}
            isCardSelectable={(r, c) => isBoardCardSelectable(rivalPlayer.id, r, c)}
            explodingCard={explodingCard && explodingCard.playerId === rivalPlayer.id ? { r: explodingCard.r, c: explodingCard.c } : undefined}
            isMobile
        />
      </div>

      <div className="flex-grow flex items-center justify-center relative" />

      {/* Player Area */}
      <div className='flex flex-col items-center gap-2'>
        <GameBoard
            board={humanPlayer.board}
            onCardClick={(r, c) => handleBoardClick(humanPlayer.id, r, c)}
            isCardSelectable={(r, c) => isBoardCardSelectable(humanPlayer.id, r, c)}
            explodingCard={explodingCard && explodingCard.playerId === humanPlayer.id ? { r: explodingCard.r, c: explodingCard.c } : undefined}
            isMobile
        />
        <div className="flex items-center justify-between w-full px-2">
             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-sky-500 border-2 border-black flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-900" />
                </div>
                <div className="flex flex-col">
                    <span className="font-display tracking-widest text-[10px] uppercase text-slate-200/80">{user.displayName || 'Jugador'}</span>
                    <span className="text-xs text-slate-200/70">Puntaje: <span className="font-semibold text-white">{humanPlayerScore}</span></span>
                </div>
            </div>
            {turnPhase === 'ACTION' && currentPlayerIndex === humanPlayerId && (
                <Button
                    size="sm"
                    className="comic-btn comic-btn-secondary !py-1 !px-3 !text-xs"
                    disabled={gameState.isForcedToPlay}
                    onClick={handlePassTurn}
                >
                    Pasar
                </Button>
            )}
        </div>
      </div>
      
      {/* Player Hand */}
      <div className="w-full h-32 flex justify-center items-center pb-2">
        <div className="relative w-full max-w-sm h-full flex justify-center items-end card-hand-fan">
            {humanPlayer.hand.map((card, index) => {
                const totalCards = humanPlayer.hand.length;
                const fanAngle = Math.min(totalCards * 20, 90);
                const rotation = (index / (totalCards - 1)) * fanAngle - fanAngle / 2;

                return (
                    <motion.div
                      key={card.uid}
                      className={cn(
                        'absolute origin-bottom fan-card',
                        selectedHandCard?.card.uid === card.uid && 'selected-fan-card'
                      )}
                      animate={{ 
                        rotate: rotation,
                        y: selectedHandCard?.card.uid === card.uid ? -40 : 0
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      onClick={() => handleHandCardClick(card, index)}
                    >
                      <div className="w-24 aspect-[2.5/3.5]">
                        <GameCard
                            card={card}
                            onClick={() => {}}
                            isSelected={selectedHandCard?.card.uid === card.uid}
                            isSelectable={isHandCardSelectable(card)}
                        />
                      </div>
                    </motion.div>
                );
            })}
        </div>
      </div>

      <div className="absolute top-2 right-2 z-20">
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="comic-btn bg-slate-800/80 !text-white hover:bg-slate-700 !p-0 h-9 w-9 !rounded-full">
              <Settings className="h-5 w-5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div className="comic-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="comic-title text-amber-300">Ajustes</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  ¿Estás seguro que deseas abandonar la partida? Esta acción contará como una derrota.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel asChild>
                  <button className="comic-btn comic-btn-secondary">Cancelar</button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <button onClick={() => router.push('/lobby')} className="comic-btn bg-red-600 !text-white hover:bg-red-700">
                    Rendirse
                  </button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>

       <AnimatePresence>
        {showDrawAnimation !== null && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: {duration: 0.2} }}
            exit={{ opacity: 0, transition: {delay: 0.8, duration: 0.3} }}
          >
            {/* Turn indicator */}
            {showDrawAnimation === humanPlayerId && (
                 <motion.div
                    className="absolute z-10"
                    initial={{ scale: 0.5, opacity: 0}}
                    animate={{ scale: 1, opacity: 1, transition: { delay: 0.1, duration: 0.3, ease: 'backOut'} }}
                    exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.2, ease: 'easeIn'} }}
                 >
                    <span className="comic-turn-chip !px-6 !py-2 !text-lg">
                        Tu Turno
                    </span>
                 </motion.div>
            )}
           
            {/* Deck */}
            <motion.div
                className="w-32 h-44 absolute"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1, transition: {delay: 0.3} }}
                exit={{ opacity: 0, scale: 0.7 }}
            >
              <GameCard card={{type: 'Bomba', isFaceUp: false, color: null, value: null, uid: 'deck-back'}} onClick={()=>{}} />
            </motion.div>
            
            {/* Drawn Card */}
            <motion.div
              className="absolute w-24 h-32"
              initial={{ y: 0, scale: 0.8 }}
              animate={ showDrawAnimation === humanPlayerId ?
                { y: '200%', x: 0, scale: 0.8, transition: { delay: 0.5, duration: 0.8, ease: 'easeInOut' } } :
                { y: '-200%', x: '50%', scale: 0.5, transition: { delay: 0.5, duration: 0.8, ease: 'easeInOut' } }
              }
            >
              <GameCard card={deck[deck.length-1] || null} onClick={()=>{}} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-2 font-body overflow-hidden">
      <GameOverModal
        isOpen={gameOver}
        winner={winner}
        scores={finalScores}
        onRestart={() => dispatch({ type: 'RESET_GAME' })}
        onExit={() => router.push('/lobby')}
      />

      {isMobile ? renderMobileView() : renderDesktopView()}
    </div>
  );
}
