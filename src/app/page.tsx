'use client';

import React, { useState, useEffect } from 'react';
import { useGame, GameAction } from '@/hooks/use-game';
import type { Card as CardType, Player } from '@/lib/types';
import { getScoreChangeExplanation } from '@/app/actions/game';
import { useToast } from '@/hooks/use-toast';

import GameBoard from '@/components/game/GameBoard';
import GameCard from '@/components/game/GameCard';
import GameOverModal from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/button';
import { User, Bot, Layers, Archive, Info } from 'lucide-react';


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
  const { toast } = useToast();
  const [selectedHandCard, setSelectedHandCard] = useState<Selection>(null);
  const [targetBoardPos, setTargetBoardPos] = useState<BoardSelection>(null);

  const { players, currentPlayerIndex, turnPhase, gameOver, winner, finalScores, gameMessage, deck, discardPile } = gameState;
  const currentPlayer = players?.[currentPlayerIndex];

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

  useEffect(() => {
    if (gameState.lastRevealedCard?.type === 'Personaje' && gameState.lastRevealedCard.isFaceUp && currentPlayer) {
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
              title: `AI Analysis: Score Change ${result.scoreChange > 0 ? '+' : ''}${result.scoreChange}`,
              description: result.explanation,
              duration: 5000,
            });
          }
        })
        .catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.lastRevealedCard, toast, currentPlayer, players]);

  if (!initialized || !currentPlayer || !players || players.length === 0 || !players[0].hand) {
    return (
        <div className="flex items-center justify-center h-full bg-background">
            <p className="text-foreground text-2xl">Loading Game...</p>
        </div>
    );
  }

  
  const rivalPlayer = players[(currentPlayerIndex + 1) % players.length];
  const currentPlayerScore = getBoardScore(currentPlayer.board);
  const rivalPlayerScore = getBoardScore(rivalPlayer.board);

  const handleBoardClick = (playerId: number, r: number, c: number) => {
    if (gameOver) return;

    if (turnPhase === 'REVEAL_CARD' && playerId === currentPlayer.id) {
      dispatch({ type: 'REVEAL_CARD', payload: { player_id: playerId, r, c } });
    } else if (turnPhase === 'ACTION' && selectedHandCard) {
      setTargetBoardPos({ playerId, r, c });
    } else if (
      turnPhase === 'ACTION' &&
      !selectedHandCard &&
      playerId === currentPlayer.id
    ) {
      const card = currentPlayer.board[r][c];
      if (card && card.isFaceUp) {
        setTargetBoardPos({ playerId, r, c });
        dispatch({
          type: 'SET_MESSAGE',
          payload: 'Now select a Character card from your hand to swap.',
        });
      }
    }
  };

  const handleHandCardClick = (card: CardType, index: number) => {
    if (gameOver || turnPhase !== 'ACTION') return;

    if (targetBoardPos) {
      if (targetBoardPos.playerId === currentPlayer.id) {
        dispatch({
          type: 'SWAP_CARD',
          payload: {
            player_id: currentPlayer.id,
            board_r: targetBoardPos.r,
            board_c: targetBoardPos.c,
            card_in_hand: card,
          },
        });
        setTargetBoardPos(null);
      }
    } else {
      setSelectedHandCard(selectedHandCard?.card.uid === card.uid ? null : { card, index });
    }
  };

  const handleAction = (action: GameAction['type']) => {
    if (gameOver) return;

    if (action === 'START_TURN') {
      dispatch({ type: 'START_TURN', payload: { player_id: currentPlayer.id } });
    } else if (action === 'PASS_TURN') {
      dispatch({ type: 'PASS_TURN', payload: { player_id: currentPlayer.id } });
      setSelectedHandCard(null);
      setTargetBoardPos(null);
    }
  };

  const isBoardCardSelectable = (playerId: number, r: number, c: number) => {
    if (gameOver) return false;
    const card = players.find(p => p.id === playerId)?.board[r][c];
  
    if (turnPhase === 'REVEAL_CARD' && playerId === currentPlayer.id && card && !card.isFaceUp) {
      return true;
    }
    if (turnPhase === 'ACTION') {
      if (selectedHandCard) {
        if (selectedHandCard.card.type === 'Personaje' && playerId === currentPlayer.id && card && !card.isFaceUp) {
          return true;
        }
        if (playerId === rivalPlayer.id && card && !card.isFaceUp) {
          return true;
        }
      } else {
        if (playerId === currentPlayer.id && card && card.isFaceUp) {
          return true;
        }
      }
    }
    return false;
  };

  const isHandCardSelectable = (card: CardType) => {
    if (gameOver || turnPhase !== 'ACTION') return false;
    if (targetBoardPos) { 
      return card.type === 'Personaje';
    }
    return true;
  };
  
  return (
    <div className="min-h-screen w-full bg-[url('/felt-pattern.png')] bg-repeat flex items-center justify-center p-4 font-sans">
      <GameOverModal
        isOpen={gameOver && !!winner}
        winner={winner}
        scores={finalScores}
        onClose={() => dispatch({ type: 'RESET_GAME' })}
      />
      <div className="w-full max-w-7xl grid grid-cols-[200px,1fr,200px] gap-6 items-center">
        
        {/* COLUMNA IZQUIERDA - JUGADOR */}
        <div className="flex flex-col items-center justify-center gap-4 h-full">
          <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center border-4 border-white/80 shadow-lg">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <span className="text-primary-foreground font-bold text-lg">Player 1 (You)</span>
            <span className="text-white/80 text-base font-semibold">Score: {currentPlayerScore}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            {currentPlayer.hand.map((card, index) => (
              <div key={card.uid} className="relative w-full aspect-square">
                 <GameCard 
                    card={card}
                    onClick={() => handleHandCardClick(card, index)}
                    isSelected={selectedHandCard?.card.uid === card.uid}
                    isSelectable={isHandCardSelectable(card)}
                />
              </div>
            ))}
             {Array.from({ length: 4 - currentPlayer.hand.length }).map((_, index) => (
                <div key={`placeholder-${index}`} className="w-full aspect-square rounded-md bg-black/20 border-2 border-dashed border-white/20" />
            ))}
          </div>
        </div>

        {/* COLUMNA CENTRAL - TABLEROS */}
        <div className="flex flex-col items-center gap-4">
            {/* Game Status */}
            {gameMessage && (
                <div className="text-primary-foreground text-center text-lg font-semibold px-4 py-2 bg-black/40 rounded-lg shadow-inner flex items-center gap-2">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span>{gameMessage}</span>
                </div>
            )}
            
          {/* Rival Board */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-primary-foreground font-bold text-base">Player 2 (Rival) - Score: {rivalPlayerScore}</span>
            <GameBoard 
              board={rivalPlayer.board} 
              onCardClick={(r, c) => handleBoardClick(rivalPlayer.id, r, c)}
              isCardSelectable={(r, c) => isBoardCardSelectable(rivalPlayer.id, r, c)}
              isRival
            />
          </div>

          {/* Player Board */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-primary-foreground font-bold text-base">Player 1 (You) - Score: {currentPlayerScore}</span>
            <GameBoard 
              board={currentPlayer.board} 
              onCardClick={(r, c) => handleBoardClick(currentPlayer.id, r, c)}
              isCardSelectable={(r, c) => isCardSelectable(currentPlayer.id, r, c)}
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap justify-center items-center gap-2 text-xs h-10">
            {turnPhase === 'START_TURN' && (
                <Button size="sm" onClick={() => handleAction('START_TURN')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                    Draw Card
                </Button>
            )}
            {turnPhase === 'REVEAL_CARD' && (
                <p className="text-center font-semibold text-accent">Reveal a card on your board.</p>
            )}
            {turnPhase === 'ACTION' && (
                <Button size="sm" variant="outline" className="bg-transparent text-primary-foreground hover:bg-white/10" disabled={gameState.isForcedToPlay} onClick={() => handleAction('PASS_TURN')}>
                    Pass Turn
                </Button>
            )}
             {turnPhase === 'ACTION' && gameState.isForcedToPlay && (
                <p className="text-xs text-red-400 font-semibold text-center w-full">You have too many cards and must play or swap.</p>
            )}
            {turnPhase === 'GAME_OVER' && (
                <p className="text-center font-bold text-2xl text-accent">Game Over!</p>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA - MAZO Y DESCARTE */}
        <div className="flex flex-col items-center justify-center gap-4 h-full">
            <div className="flex flex-col items-center gap-2">
                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center border-4 border-white/80 shadow-lg">
                    <Bot className="h-12 w-12 text-secondary-foreground" />
                </div>
                <span className="text-primary-foreground font-bold text-lg">Player 2 (Rival)</span>
                <span className="text-white/80 text-base font-semibold">Score: {rivalPlayerScore}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="flex gap-4 items-center">
                {/* Mazo */}
                <div className="flex flex-col items-center">
                    <div className="w-24 aspect-square relative">
                        <GameCard card={deck.length > 0 ? { ...deck[deck.length-1], isFaceUp: false } : null} onClick={() => {}} />
                    </div>
                    <div className="text-white/80 text-sm mt-1 flex items-center gap-1"><Layers className="w-4 h-4"/> Deck: {deck.length}</div>
                </div>

                {/* Descarte */}
                <div className="flex flex-col items-center">
                    <div className="w-24 aspect-square relative">
                    {discardPile.length > 0 ? (
                        <GameCard card={{...discardPile[discardPile.length - 1], isFaceUp: true}} onClick={() => {}} />
                    ) : (
                        <div className="w-full h-full rounded-md bg-black/20 border-2 border-dashed border-white/20 flex items-center justify-center text-xs text-white/70">Empty</div>
                    )}
                    </div>
                    <div className="text-white/80 text-sm mt-1 flex items-center gap-1"><Archive className="w-4 h-4" />Discard: {discardPile.length}</div>
                </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

    