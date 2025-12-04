
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGame, GameAction } from '@/hooks/use-game';
import type { Card as CardType, Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';

import GameBoard from '@/components/game/GameBoard';
import GameCard from '@/components/game/GameCard';
import GameOverModal from '@/components/game/GameOverModal';
import GameLoadingScreen from '@/components/game/GameLoadingScreen';
import MatchupScreen from '@/components/game/MatchupScreen';
import { User, Bot, LogOut, Settings, Swords, Shield, Trash2, ArrowRightLeft } from 'lucide-react';
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
import { CARD_DEFINITIONS, GameCardDef } from '@/lib/card-definitions';
import { collection, getDocs } from 'firebase/firestore';
import { MAX_HAND_SIZE } from '@/lib/constants';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { SfxProvider, useSfxPlayer } from '@/hooks/use-sfx-player';


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
    y: 0,
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
      y: 10,
      transition: { duration: 0.2, ease: 'easeIn' }
  }
};

const gameEventVariants = {
    hidden: { scale: 0.8, opacity: 0, x: -50 },
    visible: {
      scale: 1,
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 15,
      },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      x: 50,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
};


const useCardDefinitionsWithImages = () => {
    const firestore = useFirestore();
    const [cardDefs, setCardDefs] = useState<GameCardDef[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCardData = async () => {
            if (!firestore) return;
            setLoading(true);
            const dataCollectionRef = collection(firestore, 'card-images');
            const dataSnapshot = await getDocs(dataCollectionRef);
            const firestoreData = new Map<string, Partial<GameCardDef>>();
            dataSnapshot.forEach(doc => {
                firestoreData.set(doc.id, doc.data() as Partial<GameCardDef>);
            });

            const enrichedDefs = CARD_DEFINITIONS.map(def => {
                const data = firestoreData.get(def.id);
                return {
                    ...def,
                    ...(data || {}),
                    ability: { 
                      name: data?.ability?.name || def.ability?.name || '',
                      description: data?.ability?.description || def.ability?.description || '',
                      json: data?.ability?.json || def.ability?.json || '{}',
                      soundUrl: data?.ability?.soundUrl || def.ability?.soundUrl || '',
                    }
                };
            });
            
            setCardDefs(enrichedDefs);
            setLoading(false);
        };

        fetchCardData();
    }, [firestore]);
    
    const cardBackImageUrl = useMemo(() => {
        if (!cardDefs) return undefined;
        return cardDefs.find(def => def.id === 'card-back')?.imageUrl;
    }, [cardDefs]);


    return { cardDefs, cardBackImageUrl, loading };
}


function GamePageContent() {
  const { user, isUserLoading: isUserAuthLoading } = useUser();
  const router = useRouter();
  const { cardDefs, cardBackImageUrl, loading: areCardDefsLoading } = useCardDefinitionsWithImages();
  const { gameState, dispatch, initialized, resetGame } = useGame(2, cardDefs);
  const { toast } = useToast();
  const [selectedHandCard, setSelectedHandCard] = useState<Selection>(null);
  const [targetBoardPos, setTargetBoardPos] = useState<BoardSelection>(null);
  const isMobile = useIsMobile();
  const [rivalJustPlayed, setRivalJustPlayed] = useState(false);
  const [gameEvent, setGameEvent] = useState<{ id: number; text: string } | null>(null);

  const [gamePhase, setGamePhase] = useState<'loading' | 'matchup' | 'playing'>('loading');

  const { playBattleMusic, stopAllMusic } = useMusicPlayer();
  
  const { players, currentPlayerIndex, turnPhase, gameOver, winner, finalScores, gameMessage, explodingCard, lastRevealedCard, lastRivalMove, lastDrawnCardId, showDrawAnimation } = gameState;
  
  useEffect(() => {
    if (gameMessage) {
      let eventText: string | null = null;
      if (gameMessage.includes('Plantaste una bomba')) {
        eventText = 'Bomba Plantada';
      } else if (gameMessage.includes('El tablero del rival ha sido barajado')) {
        eventText = 'Tablero Mezclado';
      } else if (gameMessage.includes('reveló una bomba')) {
        eventText = '¡BOMBA!';
      } else if (gameMessage.includes('Descartaste una carta')) {
        eventText = 'Carta Descartada';
      }

      if (eventText) {
        const eventId = Date.now();
        setGameEvent({ id: eventId, text: eventText });
        const timer = setTimeout(() => {
          setGameEvent(prev => (prev?.id === eventId ? null : prev));
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameMessage]);

  useEffect(() => {
    console.log('%c[GAME UI] gameOver cambió', 'color:#22c55e;font-weight:bold;', {
      gameOver,
      winner,
      finalScores,
      turnPhase,
      gamePhase,
    });
  }, [gameOver, winner, finalScores, turnPhase, gamePhase]);

  const humanPlayerId = 0;
  const aiPlayerId = 1;
  const humanPlayer = players?.[humanPlayerId];
  const rivalPlayer = players?.[aiPlayerId];
  const currentPlayer = players?.[currentPlayerIndex];
  
  useEffect(() => {
    if (!isUserAuthLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, isUserAuthLoading, router]);

  useEffect(() => {
    if (gamePhase === 'playing') {
      stopAllMusic();
      playBattleMusic();
    }
    return () => {
        if(gamePhase === 'playing'){
            stopAllMusic();
        }
    };
  }, [gamePhase, playBattleMusic, stopAllMusic]);

  useEffect(() => {
    if (initialized && gamePhase === 'loading') {
      const timer = setTimeout(() => {
        setGamePhase('matchup');
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [initialized, gamePhase]);

  useEffect(() => {
      if (!explodingCard) return;

      const timer = setTimeout(() => {
          dispatch({ type: 'CLEAR_EXPLOSION' });
      }, 1200); 
      return () => clearTimeout(timer);
  }, [explodingCard, dispatch]);

  useEffect(() => {
    if (gameOver || !initialized || currentPlayerIndex !== aiPlayerId || gamePhase !== 'playing') return;
  
    const performAiAction = (action: GameAction, delay = 1500) => {
      setTimeout(() => {
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

      if (rivalPlayer.hand.length >= MAX_HAND_SIZE) {
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
  
  }, [currentPlayerIndex, turnPhase, rivalPlayer, humanPlayer, dispatch, gameOver, initialized, gameState.isForcedToPlay, gamePhase]);

  useEffect(() => {
    if (gameOver || !initialized || currentPlayerIndex !== humanPlayerId || turnPhase !== 'START_TURN' || gamePhase !== 'playing') return;

    const timer = setTimeout(() => {
      dispatch({ type: 'START_TURN', payload: { player_id: humanPlayerId } });
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPlayerIndex, turnPhase, dispatch, gameOver, initialized, humanPlayerId, gamePhase]);
  
  useEffect(() => {
    if (showDrawAnimation && lastDrawnCardId) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_DRAWN_CARD' });
      }, 1000); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [showDrawAnimation, lastDrawnCardId, dispatch]);

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

  useEffect(() => {
    if (lastRivalMove) {
      setRivalJustPlayed(true);
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_RIVAL_MOVE' });
        setRivalJustPlayed(false);
      }, 1200); 
      return () => clearTimeout(timer);
    }
  }, [lastRivalMove, dispatch]);

  if (isUserAuthLoading || areCardDefsLoading || !user || !initialized || !humanPlayer || !rivalPlayer || !currentPlayer || isMobile === undefined) {
    return <GameLoadingScreen cardBackImageUrl={cardBackImageUrl} />;
  }

  if (gamePhase === 'loading') {
    return <GameLoadingScreen cardBackImageUrl={cardBackImageUrl} />;
  }

  if (gamePhase === 'matchup') {
    return (
      <MatchupScreen
        player={{ name: user.displayName || 'Tú', deck: humanPlayer.deck }}
        rival={{ name: 'Rival (IA)', deck: rivalPlayer.deck }}
        cardDefs={cardDefs!}
        onAnimationComplete={() => setGamePhase('playing')}
      />
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
        return !card || !card.isFaceUp;
      }
      return false;
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

  console.log('%c[GAME UI] render GamePageContent', 'color:#38bdf8;', {
    gameOver,
    winner,
    finalScores,
    gamePhase,
    turnPhase,
  });

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
          {turnPhase === 'START_TURN' && (
            <motion.div
              key={currentPlayerIndex}
              variants={turnChipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
            >
              <span className="comic-turn-chip !px-6 !py-2 !text-lg">
                 {currentPlayerIndex === humanPlayerId ? 'Tu Turno' : 'Turno Rival'}
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
              <AnimatePresence>
              <div className="grid grid-cols-2 gap-3">
                {humanPlayer.hand.map((card, index) => (
                  <motion.div 
                    layout 
                    key={card.uid} 
                    className="comic-card-slot"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GameCard
                      card={card}
                      onClick={() => handleHandCardClick(card, index)}
                      isSelected={selectedHandCard?.card.uid === card.uid}
                      isDisabled={!isHandCardSelectable(card)}
                      isInHand
                      isMobile={false}
                      cardBackImageUrl={cardBackImageUrl}
                    />
                  </motion.div>
                ))}
                {Array.from({ length: Math.max(0, MAX_HAND_SIZE - humanPlayer.hand.length) }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="comic-card-slot rounded-xl border-2 border-dashed border-slate-700/70 bg-slate-900/40"
                  />
                ))}
              </div>
              </AnimatePresence>
  
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
                rivalJustPlayed && "board-hit",
                !isHumanTurn && "ring-4 ring-red-500/70 shadow-[0_0_40px_rgba(239,68,68,0.6)]"
              )}
            >
              <GameBoard
                board={rivalPlayer.board}
                playerId={rivalPlayer.id}
                onCardClick={(r, c) => handleBoardClick(rivalPlayer.id, r, c)}
                isCardSelectable={(r, c) => isBoardCardSelectable(rivalPlayer.id, r, c)}
                explodingCardInfo={
                  explodingCard && explodingCard.playerId === rivalPlayer.id
                    ? explodingCard
                    : undefined
                }
                isDimmed={isHumanTurn && turnPhase === 'ACTION' && !selectedHandCard}
                lastRivalMove={lastRivalMove && lastRivalMove.playerId === rivalPlayer.id ? { r: lastRivalMove.r, c: lastRivalMove.c } : undefined}
                cardBackImageUrl={cardBackImageUrl}
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
                playerId={humanPlayer.id}
                onCardClick={(r, c) => handleBoardClick(humanPlayer.id, r, c)}
                isCardSelectable={(r, c) => isBoardCardSelectable(humanPlayer.id, r, c)}
                explodingCardInfo={
                  explodingCard && explodingCard.playerId === humanPlayer.id
                    ? explodingCard
                    : undefined
                }
                isDimmed={!isHumanTurn || (isHumanTurn && turnPhase === 'ACTION' && !selectedHandCard)}
                lastRivalMove={lastRivalMove && lastRivalMove.playerId === humanPlayer.id ? { r: lastRivalMove.r, c: lastRivalMove.c } : undefined}
                cardBackImageUrl={cardBackImageUrl}
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
                   <div className="relative comic-card-slot">
                     <AnimatePresence>
                      {humanPlayer.deck.length > 0 && (
                        <motion.div
                          key={`deck-card-${humanPlayer.deck.length}`}
                          className="absolute inset-0"
                          initial={{ scale: 0.9, y: -5 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                           <GameCard card={{ ...humanPlayer.deck[humanPlayer.deck.length - 1], isFaceUp: false, uid: 'deck-back', id: 'deck-back' }} onClick={() => {}} cardBackImageUrl={cardBackImageUrl} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-[11px] text-slate-200/70 font-mono">
                    {humanPlayer.deck.length} cartas
                  </span>
                </div>
  
                <div className="flex flex-col items-center gap-2">
                  <span className="comic-section-title">Descarte</span>
                  <div className="comic-card-slot">
                    {humanPlayer.discardPile.length > 0 ? (
                      <GameCard
                        card={{ ...humanPlayer.discardPile[humanPlayer.discardPile.length - 1], isFaceUp: true }}
                        onClick={() => {}}
                        cardBackImageUrl={cardBackImageUrl}
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
                    {humanPlayer.discardPile.length} cartas
                  </span>
                </div>
              </div>
  
              <div className="mt-2 text-[11px] text-slate-200/80 leading-snug min-h-[3rem]">
                {gameMessage}
              </div>
            </div>
          </div>
        </div>
        {showDrawAnimation && lastDrawnCardId && (
            <motion.div
                layoutId={`card-${lastDrawnCardId}`}
                className="absolute z-[100]"
                style={{
                  top: '50%',
                  left: 'calc(100% - 260px - 5rem)',
                  width: '6rem', 
                  height: '8.4rem',
                }}
                initial={{
                    y: "-50%",
                    x: 0,
                }}
                animate={{
                    x: "-140%",
                    y: "60%",
                    scale: 0.9,
                    rotate: -10
                }}
                transition={{
                    duration: 0.6,
                    ease: [0.32, 0, 0.67, 0],
                }}
            >
              <GameCard card={{...humanPlayer.hand.find(c => c.uid === lastDrawnCardId)!, isFaceUp: false}} onClick={()=>{}} isInHand cardBackImageUrl={cardBackImageUrl} />
            </motion.div>
        )}
      </LayoutGroup>
    </div>
  );

  const renderMobileView = () => (
    <div className={cn("h-full w-full flex flex-row p-2 pb-2 gap-1 relative", explodingCard && "screen-flash")}>
      <LayoutGroup id="boardbombers-layout-mobile">
        {/* Columna Izquierda: Mazo Rival */}
        <div className="w-14 shrink-0 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase font-display tracking-widest text-slate-400">Mazo</span>
                <div className="relative w-full aspect-square comic-card-slot rounded-xl border-2 border-slate-700/70 bg-slate-900/40">
                    {rivalPlayer.deck.length > 0 && <GameCard card={{...rivalPlayer.deck[0], isFaceUp:false}} onClick={()=>{}} cardBackImageUrl={cardBackImageUrl} isMobile />}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{rivalPlayer.deck.length}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase font-display tracking-widest text-slate-400">Descarte</span>
                <div className="relative w-full aspect-square comic-card-slot rounded-xl border-2 border-slate-700/70 bg-slate-900/40">
                    {rivalPlayer.discardPile.length > 0 && <GameCard card={{...rivalPlayer.discardPile[rivalPlayer.discardPile.length - 1], isFaceUp:true}} onClick={()=>{}} cardBackImageUrl={cardBackImageUrl} isMobile />}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{rivalPlayer.discardPile.length}</span>
            </div>
        </div>
        
        {/* Columna Central: Tableros y Mano */}
        <div className="flex-grow flex flex-col items-center gap-2">
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
                "comic-board-panel transition-shadow duration-200 w-full",
                rivalJustPlayed && "board-hit",
                !isHumanTurn && "ring-2 ring-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              )}
            >
              <GameBoard
                  board={rivalPlayer.board}
                  playerId={rivalPlayer.id}
                  onCardClick={(r, c) => handleBoardClick(rivalPlayer.id, r, c)}
                  isCardSelectable={(r, c) => isBoardCardSelectable(rivalPlayer.id, r, c)}
                  explodingCardInfo={explodingCard && explodingCard.playerId === rivalPlayer.id ? explodingCard : undefined}
                  isMobile
                  isDimmed={isHumanTurn && turnPhase === 'ACTION' && !selectedHandCard}
                  lastRivalMove={lastRivalMove && lastRivalMove.playerId === rivalPlayer.id ? { r: lastRivalMove.r, c: lastRivalMove.c } : undefined}
                  cardBackImageUrl={cardBackImageUrl}
              />
            </div>
            
            {/* Middle Area */}
            <div className="flex-grow flex items-center justify-center relative w-full">
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
                <AnimatePresence>
                    {gameEvent && (
                        <motion.div
                            key={gameEvent.id}
                            variants={gameEventVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                        >
                            <span className="game-event-chip">{gameEvent.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div
              className={cn(
                "comic-board-panel transition-shadow duration-200 w-full",
                isHumanTurn && "ring-2 ring-sky-400/70 shadow-[0_0_20px_rgba(56,189,248,0.5)]"
              )}
            >
              <GameBoard
                  board={humanPlayer.board}
                  playerId={humanPlayer.id}
                  onCardClick={(r, c) => handleBoardClick(humanPlayer.id, r, c)}
                  isCardSelectable={(r, c) => isBoardCardSelectable(humanPlayer.id, r, c)}
                  explodingCardInfo={explodingCard && explodingCard.playerId === humanPlayer.id ? explodingCard : undefined}
                  isMobile
                  isDimmed={!isHumanTurn || (isHumanTurn && turnPhase === 'ACTION' && !selectedHandCard)}
                  cardBackImageUrl={cardBackImageUrl}
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
            
            {/* Player Hand */}
            <div className={cn(
              "w-full flex justify-center items-end gap-1 px-1 shrink-0",
            )}>
              <AnimatePresence>
              {humanPlayer.hand.map((card, index) => (
                <motion.div
                  layout
                  key={card.uid}
                  className="w-1/4 max-w-[80px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={() => handleHandCardClick(card, index)}
                >
                    <GameCard
                      card={card}
                      onClick={() => {}}
                      isSelected={selectedHandCard?.card.uid === card.uid}
                      isDisabled={!isHandCardSelectable(card)}
                      isInHand
                      isMobile
                      cardBackImageUrl={cardBackImageUrl}
                    />
                </motion.div>
              ))}
              </AnimatePresence>
              {Array.from({ length: Math.max(0, MAX_HAND_SIZE - humanPlayer.hand.length) }).map((_, index) => (
                  <div
                      key={`placeholder-hand-${index}`}
                      className="w-1/4 max-w-[80px] aspect-[5/7] rounded-lg border-2 border-dashed border-slate-700/70 bg-slate-900/40"
                  />
              ))}
            </div>
        </div>

        {/* Columna Derecha: Mazo Jugador */}
        <div className="w-14 shrink-0 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase font-display tracking-widest text-slate-400">Mazo</span>
              <div id="player-deck-source" className="relative w-full aspect-square comic-card-slot rounded-xl border-2 border-slate-700/70 bg-slate-900/40">
                <AnimatePresence>
                    {humanPlayer.deck.length > 0 && (
                        <motion.div
                            key={`deck-card-${humanPlayer.deck.length}`}
                            className="absolute inset-0"
                            initial={{ scale: 0.9, y: -5 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <GameCard card={{...humanPlayer.deck[0], isFaceUp:false}} onClick={()=>{}} cardBackImageUrl={cardBackImageUrl} isMobile />
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{humanPlayer.deck.length}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase font-display tracking-widest text-slate-400">Descarte</span>
                <div className="relative w-full aspect-square comic-card-slot rounded-xl border-2 border-slate-700/70 bg-slate-900/40">
                    {humanPlayer.discardPile.length > 0 && <GameCard card={{...humanPlayer.discardPile[humanPlayer.discardPile.length - 1], isFaceUp:true}} onClick={()=>{}} cardBackImageUrl={cardBackImageUrl} isMobile />}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{humanPlayer.discardPile.length}</span>
            </div>
        </div>

        {showDrawAnimation && lastDrawnCardId && (
          <motion.div
              layoutId={`card-${lastDrawnCardId}`}
              className="absolute z-[100]"
              style={{
                  top: '50%',
                  right: 'calc(5px)',
                  width: '60px', 
              }}
              initial={{ y: "-50%", x: 0, scale: 1 }}
              animate={{
                  x: `calc(-50vw + 30px)`,
                  y: `calc(50vh - 50px)`,
                  scale: 1,
              }}
              transition={{
                  duration: 0.6,
                  ease: [0.32, 0, 0.67, 0],
              }}
          >
              <GameCard card={{...humanPlayer.hand.find(c => c.uid === lastDrawnCardId)!, isFaceUp: false}} onClick={()=>{}} isInHand isMobile cardBackImageUrl={cardBackImageUrl} />
          </motion.div>
        )}

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
    <div className="min-h-screen flex items-start justify-center p-2 font-body overflow-y-auto relative">
      {/* Overlay de fin de partida SIN AlertDialog */}
      {gameOver && (
        <GameOverModal
          state={gameState}
          onRestart={resetGame}
          onExit={() => router.push('/lobby')}
        />
      )}

      {isMobile ? renderMobileView() : renderDesktopView()}
    </div>
  );
}

export default function GamePage() {
  return (
    <SfxProvider>
      <GamePageContent />
    </SfxProvider>
  )
}

    