'use client';

import React, { useState, useEffect } from 'react';
import { useGame, GameAction } from '@/hooks/use-game';
import type { Card as CardType, Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

import GameBoard from '@/components/game/GameBoard';
import GameCard from '@/components/game/GameCard';
import GameOverModal from '@/components/game/GameOverModal';
import { User, Bot, LogOut, Settings } from 'lucide-react';
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

const turnChipVariants = {
  hidden: { scale: 0.4, opacity: 0, y: -20 },
  visible: {
    scale: [1, 1.05, 1],
    opacity: 1,
    y: -40,
    transition: {
      duration: 0.5,
      times: [0, 0.5, 1],
      type: "spring",
      stiffness: 260,
      damping: 16,
    },
  },
  exit: {
      scale: 0.5,
      opacity: 0,
      y: -10,
      transition: { duration: 0.2, ease: 'easeIn' }
  }
};


export default function GamePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { gameState, dispatch, initialized } = useGame(2);
  const { playFlip, playBomb, playDeal } = useGameSounds();
  const { toast } = useToast();
  const [selectedHandCard, setSelectedHandCard] = useState<Selection>(null);
  const [targetBoardPos, setTargetBoardPos] = useState<BoardSelection>(null);
  const isMobile = useIsMobile();
  const [rivalJustPlayed, setRivalJustPlayed] = useState(false);

  const { players, currentPlayerIndex, turnPhase, gameOver, winner, finalScores, gameMessage, deck, discardPile, explodingCard, lastRevealedCard, lastRivalMove, lastDrawnCardId } = gameState;
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
          playDeal();
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
        // No cards to reveal, must be an end-game scenario
        performAiAction({ type: 'PASS_TURN', payload: { player_id: aiPlayerId } });
      }
    } else if (turnPhase === 'ACTION') {
      // Prioritize playing bomb on player's board
      const bombCard = rivalPlayer.hand.find(c => c.type === 'Bomba');
      if (bombCard) {
        const playerBoardSpots: {r: number, c: number}[] = [];
        humanPlayer.board.forEach((row, r) => {
          row.forEach((card, c) => {
            if (!card || !card.isFaceUp) {
              playerBoardSpots.push({ r, c });
            }
          });
        });
        if (playerBoardSpots.length > 0) {
          const targetSpot = playerBoardSpots[Math.floor(Math.random() * playerBoardSpots.length)];
          performAiAction({ type: 'PLAY_CARD_RIVAL', payload: { player_id: aiPlayerId, card_in_hand: bombCard, target_r: targetSpot.r, target_c: targetSpot.c } });
          setRivalJustPlayed(true);
          setTimeout(() => setRivalJustPlayed(false), 400);
          return;
        }
      }

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
       if (initialized && !gameState.isForcedToPlay) {
         performAiAction({ type: 'PASS_TURN', payload: { player_id: aiPlayerId } });
       }
    }
  
  }, [currentPlayerIndex, turnPhase, rivalPlayer, humanPlayer, dispatch, gameOver, initialized, gameState.isForcedToPlay, playDeal]);

  // Human player auto-draw
  useEffect(() => {
    if (gameOver || !initialized || currentPlayerIndex !== humanPlayerId || turnPhase !== 'START_TURN') return;

    playDeal();
    const timer = setTimeout(() => {
      dispatch({ type: 'START_TURN', payload: { player_id: humanPlayerId } });
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPlayerIndex, turnPhase, dispatch, gameOver, initialized, humanPlayerId, playDeal]);

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
      if (actionType === 'PLAY_CARD_RIVAL') {
        setRivalJustPlayed(true);
        setTimeout(() => setRivalJustPlayed(false), 400);
      }
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

  // Clear rival move animation state
  useEffect(() => {
    if (lastRivalMove) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_RIVAL_MOVE' });
      }, 1200); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
  }, [lastRivalMove, dispatch]);

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
  const isHumanTurn = currentPlayerIndex === humanPlayerId;

  const handleBoardClick = (playerId: number, r: number, c: number) => {
    if (gameOver || !isHumanTurn) return;

    if (selectedHandCard) {
       setTargetBoardPos({ playerId, r, c });
       return;
    }

    if (turnPhase === 'REVEAL_CARD' && playerId === humanPlayer.id) {
      playFlip();
      dispatch({ type: 'REVEAL_CARD', payload: { player_id: playerId, r, c } });
    }
  };

  const handleHandCardClick = (card: CardType, index: number) => {
    if (gameOver || turnPhase !== 'ACTION' || !isHumanTurn) return;

    setSelectedHandCard(
      selectedHandCard?.card.uid === card.uid ? null : { card, index },
    );
  };
  
  const isBoardCardSelectable = (playerId: number, r: number, c: number) => {
    if (gameOver || !isHumanTurn) return false;
    const player = players.find(p => p.id === playerId);
    if (!player) return false;
    const card = player.board[r][c];

    if (turnPhase === 'REVEAL_CARD') {
      return playerId === humanPlayer.id && !!card && !card.isFaceUp;
    }
    
    if (turnPhase === 'ACTION') {
      if (selectedHandCard) {
        // A hand card is selected, check if board spot is a valid target
        return !card || !card.isFaceUp;
      }
      return false; // No interaction with board if no hand card is selected
    }

    return false;
  };

  const isHandCardSelectable = (card: CardType) => {
    return !gameOver && turnPhase === 'ACTION' && isHumanTurn;
  };
  
  const handlePassTurn = () => {
    if (gameOver || !isHumanTurn || gameState.isForcedToPlay) return;
    dispatch({ type: 'PASS_TURN', payload: { player_id: humanPlayerId } });
  }

  const renderDesktopView = () => (
    <div className={cn("comic-arena", explodingCard && "screen-flash")}>
      <LayoutGroup id="boardbombers-layout">
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

        <AnimatePresence>
          {turnPhase === 'START_TURN' && currentPlayerIndex === humanPlayerId && (
            <motion.div
              key={currentPlayerIndex}
              variants={turnChipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              <span className="comic-turn-chip !px-6 !py-2 !text-lg">
                Tu Turno
              </span>
            </motion.div>
          )}
        </AnimatePresence>
  
        <div className="comic-arena-inner">
          <div className={cn(
            "flex flex-col gap-4 h-full transition-opacity duration-300",
            !isHumanTurn || turnPhase !== 'ACTION' ? 'opacity-60' : 'opacity-100'
          )}>
            <div className="bg-[#0d4b63] rounded-[24px] border-[3px] border-slate-900 shadow-[0_10px_0_#020617] relative p-4">
              <div className="flex items-center gap-3">
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
            </div>
  
            <div className="bg-[#0d4b63] rounded-[24px] border-[3px] border-slate-900 shadow-[0_10px_0_#020617] relative p-4 flex flex-col gap-3">
              <span className="comic-section-title">Tu mano</span>
              <div className="grid grid-cols-2 gap-3">
                {humanPlayer.hand.map((card, index) => (
                  <div key={card.uid} className="comic-card-slot">
                    <GameCard
                      card={card}
                      onClick={() => handleHandCardClick(card, index)}
                      isSelected={selectedHandCard?.card.uid === card.uid}
                      isDisabled={!isHandCardSelectable(card)}
                      isInHand
                      isMobile={false}
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
  
              <div className="mt-2 flex items-center justify-center gap-2">
                {turnPhase === 'ACTION' && !gameState.isForcedToPlay && (
                    <button onClick={handlePassTurn} className="comic-btn comic-btn-secondary !text-xs !py-1 !px-3">
                      Pasar Turno
                    </button>
                )}
                {turnPhase === 'ACTION' && gameState.isForcedToPlay && currentPlayerIndex === humanPlayerId && (
                  <p className="mt-1 text-[11px] text-amber-300 text-center">
                    Debes jugar o intercambiar una carta.
                  </p>
                )}
              </div>
            </div>
          </div>
  
          <div className="flex flex-col items-center justify-start gap-3 pt-1">
             <div
              className={cn(
                "comic-board-panel transition-shadow duration-200",
                !isHumanTurn && "ring-4 ring-red-500/70 shadow-[0_0_40px_rgba(239,68,68,0.6)]"
              )}
            >
              <GameBoard
                board={rivalPlayer.board}
                onCardClick={(r, c) => handleBoardClick(rivalPlayer.id, r, c)}
                isCardSelectable={(r, c) => isBoardCardSelectable(rivalPlayer.id, r, c)}
                explodingCardInfo={
                  explodingCard && explodingCard.playerId === rivalPlayer.id
                    ? { r: explodingCard.r, c: explodingCard.c }
                    : undefined
                }
                isDimmed={isHumanTurn && turnPhase === 'ACTION' && !selectedHandCard}
                lastRivalMove={lastRivalMove && lastRivalMove.playerId === rivalPlayer.id ? { r: lastRivalMove.r, c: lastRivalMove.c } : undefined}
              />
            </div>
            
            <div className="h-2" />

            <div
              className={cn(
                "comic-board-panel transition-shadow duration-200",
                rivalJustPlayed && "board-hit",
                isHumanTurn && "ring-4 ring-sky-400/70 shadow-[0_0_40px_rgba(56,189,248,0.6)]"
              )}
            >
              <GameBoard
                board={humanPlayer.board}
                onCardClick={(r, c) => handleBoardClick(humanPlayer.id, r, c)}
                isCardSelectable={(r, c) => isBoardCardSelectable(humanPlayer.id, r, c)}
                explodingCardInfo={
                  explodingCard && explodingCard.playerId === humanPlayer.id
                    ? { r: explodingCard.r, c: explodingCard.c }
                    : undefined
                }
                isDimmed={!isHumanTurn || (isHumanTurn && turnPhase === 'ACTION' && !selectedHandCard)}
                lastRivalMove={lastRivalMove && lastRivalMove.playerId === humanPlayer.id ? { r: lastRivalMove.r, c: lastRivalMove.c } : undefined}
              />
            </div>
          </div>
  
          <div className="flex flex-col gap-4 h-full">
            <div className="bg-[#0d4b63] rounded-[24px] border-[3px] border-slate-900 shadow-[0_10px_0_#020617] relative p-4 flex items-center gap-3">
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
  
            <div className="bg-[#0d4b63] rounded-[24px] border-[3px] border-slate-900 shadow-[0_10px_0_#020617] relative p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex flex-col items-center gap-2">
                  <span className="comic-section-title">Mazo</span>
                  <motion.div className="relative comic-card-slot">
                    {deck.length > 0 && <GameCard card={{ ...deck[deck.length - 1], isFaceUp: false, uid: 'deck-back' }} onClick={() => {}} />}
                     <AnimatePresence>
                        {lastDrawnCardId && (
                          <motion.div
                            key={lastDrawnCardId}
                            className="absolute inset-0"
                            initial={{ scale: 0.6, y: 0, opacity: 1 }}
                            animate={{ scale: 1.05, y: -80, opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.8, y: -120 }}
                            transition={{ duration: 0.45, ease: [0.18, 0.89, 0.32, 1.28] }}
                          >
                            <GameCard card={{ type: 'Bomba', isFaceUp: false, color: null, value: null, uid: 'deck-back-drawn' }} onClick={()=>{}} isInHand />
                          </motion.div>
                        )}
                      </AnimatePresence>
                  </motion.div>
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
      </LayoutGroup>
    </div>
  );

  const renderMobileView = () => (
    <div className={cn("h-full w-full flex flex-col p-2 gap-2 relative", explodingCard && "screen-flash")}>
      <LayoutGroup id="boardbombers-layout-mobile">
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
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 rounded-full bg-slate-800/80 border-[2px] border-black text-[11px] text-slate-200/90 font-mono">
                Mano: {rivalPlayer.hand.length}
              </span>
            </div>
        </div>
        <div
          className={cn(
            "comic-board-panel transition-shadow duration-200",
            !isHumanTurn && "ring-2 ring-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
          )}
        >
          <GameBoard
              board={rivalPlayer.board}
              onCardClick={(r, c) => handleBoardClick(rivalPlayer.id, r, c)}
              isCardSelectable={(r, c) => isBoardCardSelectable(rivalPlayer.id, r, c)}
              explodingCardInfo={explodingCard && explodingCard.playerId === rivalPlayer.id ? { r: explodingCard.r, c: explodingCard.c } : undefined}
              isMobile
              isDimmed={isHumanTurn && turnPhase === 'ACTION' && !selectedHandCard}
              lastRivalMove={lastRivalMove && lastRivalMove.playerId === rivalPlayer.id ? { r: lastRivalMove.r, c: lastRivalMove.c } : undefined}
          />
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center relative">
          <AnimatePresence>
            {turnPhase === 'START_TURN' && (
              <motion.div
                key={currentPlayerIndex}
                variants={turnChipVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-1/2 -translate-y-1/2 z-50 pointer-events-none"
              >
                <span className="comic-turn-chip">
                  {currentPlayerIndex === humanPlayerId ? 'Tu Turno' : 'Turno Rival'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* Player Area */}
      <div className='flex flex-col items-center gap-2'>
        <div
          className={cn(
            "comic-board-panel transition-shadow duration-200",
            rivalJustPlayed && "board-hit",
            isHumanTurn && "ring-2 ring-sky-400/70 shadow-[0_0_20px_rgba(56,189,248,0.5)]"
          )}
        >
          <GameBoard
              board={humanPlayer.board}
              onCardClick={(r, c) => handleBoardClick(humanPlayer.id, r, c)}
              isCardSelectable={(r, c) => isBoardCardSelectable(humanPlayer.id, r, c)}
              explodingCardInfo={explodingCard && explodingCard.playerId === humanPlayer.id ? { r: explodingCard.r, c: explodingCard.c } : undefined}
              isMobile
              isDimmed={!isHumanTurn || (turnPhase === 'ACTION' && !selectedHandCard)}
              lastRivalMove={lastRivalMove && lastRivalMove.playerId === humanPlayer.id ? { r: lastRivalMove.r, c: lastRivalMove.c } : undefined}
          />
        </div>
         <div className="flex items-center justify-between w-full px-2 h-8">
            <div className="flex flex-col">
              <span className="font-display tracking-widest text-[10px] uppercase text-slate-200/80">
                {user.displayName || 'Jugador'}
              </span>
              <span className="text-[11px] text-slate-200/70">
                Puntaje: <span className="font-semibold text-white">{humanPlayerScore}</span>
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              {turnPhase === 'ACTION' && isHumanTurn && !gameState.isForcedToPlay && (
                <button
                  onClick={handlePassTurn}
                  className="comic-btn comic-btn-secondary !text-[11px] !py-1 !px-3"
                >
                  Pasar
                </button>
              )}
              {turnPhase === 'ACTION' && isHumanTurn && gameState.isForcedToPlay && (
                <p className="text-[11px] text-amber-300 text-right">
                  Debes jugar una carta.
                </p>
              )}
            </div>
          </div>
      </div>
      
      {/* Player Hand */}
      <div className={cn(
        "w-full flex justify-center items-end gap-1 px-1 h-28 shrink-0",
      )}>
        {humanPlayer.hand.map((card, index) => (
          <motion.div
            key={card.uid}
            className="w-1/4 max-w-[80px]"
            onClick={() => handleHandCardClick(card, index)}
          >
              <GameCard
                card={card}
                onClick={() => {}}
                isSelected={selectedHandCard?.card.uid === card.uid}
                isDisabled={!isHandCardSelectable(card)}
                isInHand
                isMobile
              />
          </motion.div>
        ))}
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
      </LayoutGroup>
    </div>
  );

  return (
    <div className="min-h-screen flex items-start justify-center p-2 font-body overflow-y-auto">
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
