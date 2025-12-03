'use client';

import { useReducer, useEffect, useState } from 'react';
import * as Game from '@/lib/game-logic';
import type { GameState, Card, Player } from '@/lib/types';
import { produce } from 'immer';

export type GameAction =
  | { type: 'START_TURN'; payload: { player_id: number } }
  | { type: 'REVEAL_CARD'; payload: { player_id: number; r: number; c: number } }
  | { type: 'PLAY_CARD_OWN'; payload: { player_id: number; card_in_hand: Card; target_r: number; target_c: number } }
  | { type: 'PLAY_CARD_RIVAL'; payload: { player_id: number; card_in_hand: Card; target_r: number; target_c: number } }
  | { type: 'SWAP_CARD'; payload: { player_id: number; board_r: number; board_c: number; card_in_hand: Card } }
  | { type: 'PASS_TURN'; payload: { player_id: number } }
  | { type: 'RESET_GAME' }
  | { type: 'INITIALIZE_GAME'; payload: { numPlayers: number } }
  | { type: 'SET_MESSAGE'; payload: string | null };

const getInitialState = (numPlayers: number): GameState => ({
  players: Array.from({ length: numPlayers }, (_, i) => ({
    id: i,
    hand: [],
    board: Array(3).fill(null).map(() => Array(3).fill(null)),
    score: 0,
  })),
  deck: [],
  discardPile: [],
  currentPlayerIndex: 0,
  gameOver: false,
  winner: null,
  finalScores: [],
  isForcedToPlay: false,
  gameMessage: 'Loading game...',
  turnPhase: 'START_TURN',
  finalTurnCounter: -1,
  lastRevealedCard: null,
});

const gameReducer = (state: GameState, action: GameAction): GameState => {
  return produce(state, draft => {
    switch (action.type) {
      case 'INITIALIZE_GAME':
        return Game.setupGame(action.payload.numPlayers);
      case 'START_TURN':
        return Game.drawCard(draft, action.payload.player_id);
      case 'REVEAL_CARD':
        return Game.revealCard(draft, action.payload.player_id, action.payload.r, action.payload.c);
      case 'PLAY_CARD_OWN':
        return Game.playCardOwnBoard(draft, action.payload.player_id, action.payload.card_in_hand, action.payload.target_r, action.payload.target_c);
      case 'PLAY_CARD_RIVAL':
        return Game.playCardRivalBoard(draft, action.payload.player_id, action.payload.card_in_hand, action.payload.target_r, action.payload.target_c);
      case 'SWAP_CARD':
        return Game.swapCard(draft, action.payload.player_id, action.payload.board_r, action.payload.board_c, action.payload.card_in_hand);
      case 'PASS_TURN':
        return Game.passTurn(draft, action.payload.player_id);
      case 'SET_MESSAGE':
        draft.gameMessage = action.payload;
        return draft;
      case 'RESET_GAME':
        return Game.setupGame(draft.players.length);
      default:
        return draft;
    }
  });
};

export function useGame(numPlayers: number) {
    const [gameState, dispatch] = useReducer(gameReducer, getInitialState(numPlayers));
    const [initialized, setInitialized] = useState(false);
  
    useEffect(() => {
      // Initialize game only on the client side to avoid hydration issues
      if (typeof window !== 'undefined' && !initialized) {
        dispatch({ type: 'INITIALIZE_GAME', payload: { numPlayers } });
        setInitialized(true);
      }
    }, [initialized, numPlayers]);
  
    return { gameState, dispatch, initialized };
  }
  
    