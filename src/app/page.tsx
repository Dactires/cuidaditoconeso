'use client';

import React, { useState, useEffect } from 'react';
import { useGame, GameAction } from '@/hooks/use-game';
import type { Card as CardType } from '@/lib/types';
import { getScoreChangeExplanation } from '@/app/actions/game';
import { useToast } from '@/hooks/use-toast';

import PlayerArea from '@/components/game/PlayerArea';
import PlayerHand from '@/components/game/PlayerHand';
import ActionControls from '@/components/game/ActionControls';
import GameStatus from '@/components/game/GameStatus';
import GameOverModal from '@/components/game/GameOverModal';
import { BOARD_SIZE } from '@/lib/constants';

type Selection = {
  card: CardType;
  index: number;
} | null;

type BoardSelection = {
  playerId: number;
  r: number;
  c: number;
} | null;

export default function GamePage() {
  const { gameState, dispatch } = useGame(2, false); // Do not initialize game on server
  const { toast } = useToast();
  const [selectedHandCard, setSelectedHandCard] = useState<Selection>(null);
  const [targetBoardPos, setTargetBoardPos] = useState<BoardSelection>(null);
  const [isGameReady, setIsGameReady] = useState(false);

  useEffect(() => {
    dispatch({ type: 'RESET_GAME' });
    setIsGameReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { players, currentPlayerIndex, turnPhase, gameOver, winner, finalScores, gameMessage } = gameState;

  useEffect(() => {
    if (targetBoardPos && selectedHandCard) {
      // Logic for playing card on board
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
  }, [targetBoardPos, selectedHandCard, dispatch, gameState.players, currentPlayerIndex]);
  
  // AI Score Explanation Effect
  useEffect(() => {
    if (gameState.lastRevealedCard?.type === 'Personaje' && gameState.lastRevealedCard.isFaceUp) {
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
            });
          }
        })
        .catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.lastRevealedCard, toast]);

  if (!isGameReady || !players || players.length === 0) {
    return (
        <div className="flex items-center justify-center h-full">
            <p>Loading Game...</p>
        </div>
    );
  }

  const currentPlayer = players[currentPlayerIndex];
  const rivalPlayer = players[(currentPlayerIndex + 1) % players.length];


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
      // Handle swap action selection
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
      // Finalize swap
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
    const card = players[playerId]?.board[r][c];

    if (turnPhase === 'REVEAL_CARD' && playerId === currentPlayer.id && card && !card.isFaceUp) {
      return true;
    }
    if (turnPhase === 'ACTION') {
      if (selectedHandCard) {
        // Placing a card from hand
        if (selectedHandCard.card.type === 'Personaje' && playerId === currentPlayer.id && card && !card.isFaceUp) {
          return true; // Place own
        }
        if (playerId === rivalPlayer.id && card && !card.isFaceUp) {
          return true; // Place rival
        }
      } else {
        // Selecting a card to swap
        if (playerId === currentPlayer.id && card && card.isFaceUp) {
          return true;
        }
      }
    }
    return false;
  };

  const isHandCardSelectable = (card: CardType) => {
    if (gameOver || turnPhase !== 'ACTION') return false;
    if (targetBoardPos) { // Swapping
      return card.type === 'Personaje';
    }
    return true;
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-body p-4 overflow-hidden">
      <GameOverModal
        isOpen={gameOver && !!winner}
        winner={winner}
        scores={finalScores}
        onClose={() => dispatch({ type: 'RESET_GAME' })}
      />
      
      {/* Rival Player Area */}
      <div className="flex-shrink-0">
        <PlayerArea
          player={rivalPlayer}
          isRival={true}
          onCardClick={(r, c) => handleBoardClick(rivalPlayer.id, r, c)}
          isCardSelectable={(r, c) => isBoardCardSelectable(rivalPlayer.id, r, c)}
        />
      </div>

      {/* Game Status */}
      <div className="flex-shrink-0 my-4">
        <GameStatus
          deckSize={gameState.deck.length}
          discardSize={gameState.discardPile.length}
          message={gameMessage}
        />
      </div>
      
      {/* Current Player Area */}
      <div className="flex-shrink-0">
        <PlayerArea
          player={currentPlayer}
          isCurrentPlayer={true}
          onCardClick={(r, c) => handleBoardClick(currentPlayer.id, r, c)}
          isCardSelectable={(r, c) => isBoardCardSelectable(currentPlayer.id, r, c)}
        />
      </div>

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Controls Panel */}
      <div className="flex-shrink-0 mt-4 bg-card/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="w-full md:w-1/2">
                <h3 className="font-headline text-lg mb-2 text-center">Your Hand</h3>
                <PlayerHand
                    hand={currentPlayer.hand}
                    onCardClick={handleHandCardClick}
                    selectedCardId={selectedHandCard?.card.uid}
                    isCardSelectable={isHandCardSelectable}
                />
            </div>
            <div className="w-full md:w-1/2">
                <h3 className="font-headline text-lg mb-2 text-center">Actions</h3>
                <ActionControls
                    turnPhase={turnPhase}
                    onAction={handleAction}
                    isForcedToPlay={gameState.isForcedToPlay}
                />
            </div>
        </div>
      </div>
    </div>
  );
}
