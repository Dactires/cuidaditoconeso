'use client';

import React, { useState, useEffect } from 'react';
import { useGame, GameAction } from '@/hooks/use-game';
import type { Card as CardType, Player } from '@/lib/types';
import { getScoreChangeExplanation } from '@/app/actions/game';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameSounds } from '@/hooks/use-game-sounds';

import GameBoard from '@/components/game/GameBoard';
import GameCard from '@/components/game/GameCard';
import GameOverModal from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/button';
import { User, Bot, Layers, Archive, Info, Swords } from 'lucide-react';


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
  const { gameState, dispatch, initialized } = useGame(2);
  const { playFlip, playBomb, playDeal } = useGameSounds();
  const { toast } = useToast();
  const [selectedHandCard, setSelectedHandCard] = useState<Selection>(null);
  const [targetBoardPos, setTargetBoardPos] = useState<BoardSelection>(null);

  const { players, currentPlayerIndex, turnPhase, gameOver, winner, finalScores, gameMessage, deck, discardPile, explodingCard, lastRevealedCard } = gameState;
  const humanPlayerId = 0;
  const aiPlayerId = 1;
  const currentPlayer = players?.[currentPlayerIndex];
  const humanPlayer = players?.[humanPlayerId];
  const rivalPlayer = players?.[aiPlayerId];
  
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

    const timer = setTimeout(() => {
      dispatch({ type: 'START_TURN', payload: { player_id: humanPlayerId } });
      playDeal();
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
      setSelectedHandCard(null);
      setTargetBoardPos(null);
    }
  }, [targetBoardPos, selectedHandCard, dispatch, currentPlayer]);

  // AI score analysis toast
  useEffect(() => {
    if (lastRevealedCard?.type === 'Personaje' && lastRevealedCard.isFaceUp && currentPlayer) {
      const boardState = players[currentPlayerIndex].board.map(row => 
        row.map(card => card ? {
          type: card.type,
          color: card.color,
          value: card.value,
          is_face_up: card.isFaceUp
        } : null)
      );

      getScoreChangeExplanation({ playerId: currentPlayerIndex, board: boardState })
        .then(result => {
          if (result) {
            toast({
              title: `Análisis de IA: Puntuación ${result.scoreChange > 0 ? '+' : ''}${result.scoreChange}`,
              description: result.explanation,
              duration: 7000,
            });
          }
        })
        .catch(console.error);
    }
  }, [lastRevealedCard, toast, currentPlayerIndex, players, currentPlayer]);

  // Clear explosion animation state
  useEffect(() => {
    if (explodingCard) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_EXPLOSION' });
      }, 1000); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
  }, [explodingCard, dispatch]);

  if (!initialized || !humanPlayer || !rivalPlayer || !currentPlayer) {
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-body overflow-hidden">
      <GameOverModal
        isOpen={gameOver}
        winner={winner}
        scores={finalScores}
        onClose={() => dispatch({ type: 'RESET_GAME' })}
      />

      {/* Indicador de turno arriba */}
      <AnimatePresence>
        <motion.div
          key={currentPlayerIndex}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="absolute top-4 z-20"
        >
          <div className="px-6 py-2 rounded-full bg-slate-900/70 border border-slate-700 backdrop-blur-sm shadow-lg">
            <p
              className="text-center font-display text-lg tracking-wider"
              style={{
                color:
                  currentPlayerIndex === humanPlayerId
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--destructive))',
              }}
            >
              {currentPlayerIndex === humanPlayerId ? 'Tu Turno' : 'Turno del Rival'}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* LAYOUT PRINCIPAL: 3 COLUMNAS */}
      <div className="w-full max-w-6xl flex-1 flex flex-row items-center justify-center gap-8 pt-16 pb-8">

        {/* COLUMNA IZQUIERDA: JUGADOR + MANO */}
        <div className="flex flex-col items-center gap-6 w-56">
          <PlayerInfo player={humanPlayer} score={humanPlayerScore} isAI={false} />

          {/* Mano del jugador */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-slate-400 font-display tracking-wider uppercase">
              Tu mano
            </p>
            <div className="grid grid-cols-2 gap-3">
              {humanPlayer.hand.map((card, index) => (
                <div key={card.uid} className="w-20">
                  <GameCard
                    card={card}
                    onClick={() => handleHandCardClick(card, index)}
                    isSelected={selectedHandCard?.card.uid === card.uid}
                    isSelectable={isHandCardSelectable(card)}
                  />
                </div>
              ))}
              {Array.from({ length: 4 - humanPlayer.hand.length }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="w-20 h-[105px] rounded-lg bg-black/20 border-2 border-dashed border-slate-700"
                />
              ))}
            </div>
          </div>

          {/* Pasar turno */}
          {turnPhase === 'ACTION' && currentPlayerIndex === humanPlayerId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                size="sm"
                variant="outline"
                className="font-display tracking-wider"
                disabled={gameState.isForcedToPlay}
                onClick={handlePassTurn}
              >
                Pasar Turno
              </Button>
            </motion.div>
          )}
          {turnPhase === 'ACTION' &&
            gameState.isForcedToPlay &&
            currentPlayerIndex === humanPlayerId && (
              <p className="text-xs text-red-400 font-semibold text-center w-full">
                Debes jugar o intercambiar una carta.
              </p>
            )}
        </div>

        {/* COLUMNA CENTRAL: TABLEROS */}
        <div className="flex flex-col items-center gap-6 flex-none">
          {/* Tablero rival */}
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
          <Swords className="h-10 w-10 text-slate-600" />
          {/* Tu tablero */}
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

        {/* COLUMNA DERECHA: RIVAL + MAZO/DESCARTE + MENSAJE */}
        <div className="flex flex-col items-center gap-6 w-56">
          <PlayerInfo player={rivalPlayer} score={rivalPlayerScore} isAI={true} />

          {/* Mazo y descarte */}
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-center">
              <div className="w-20">
                <GameCard
                  card={
                    deck.length > 0
                      ? { ...deck[deck.length - 1], isFaceUp: false }
                      : null
                  }
                  onClick={() => {}}
                />
              </div>
              <div className="text-slate-400 text-sm mt-2 flex items-center gap-1.5 font-display">
                <Layers className="w-4 h-4" /> Mazo: {deck.length}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20">
                {discardPile.length > 0 ? (
                  <GameCard
                    card={{
                      ...discardPile[discardPile.length - 1],
                      isFaceUp: true,
                    }}
                    onClick={() => {}}
                  />
                ) : (
                  <div className="w-20 h-[105px] rounded-lg bg-black/20 border-2 border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500">
                    Vacío
                  </div>
                )}
              </div>
              <div className="text-slate-400 text-sm mt-2 flex items-center gap-1.5 font-display">
                <Archive className="w-4 h-4" />
                Descarte: {discardPile.length}
              </div>
            </div>
          </div>

          {/* Mensaje de juego */}
          <div className="mt-2 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={gameMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-slate-300 text-sm text-center min-h-[1.5rem]"
              >
                {gameMessage}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

const PlayerInfo = ({player, score, isAI}: {player: Player, score: number, isAI: boolean}) => {
    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${isAI ? 'bg-red-800 border-red-500' : 'bg-blue-800 border-blue-500'}`}>
                {isAI ? <Bot className="h-6 w-6 text-red-300" /> : <User className="h-6 w-6 text-blue-300" />}
            </div>
            <div className="flex flex-col items-start">
                <span className="text-white font-display tracking-wider text-lg">{isAI ? "Rival (IA)" : "Jugador 1 (Tú)"}</span>
                <span className="text-slate-400 text-base font-semibold">Puntaje: {score}</span>
            </div>
        </div>
    )
}
