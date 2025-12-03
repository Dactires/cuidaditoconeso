
'use client';

import { useReducer, useEffect, useState } from 'react';
import * as Game from '@/lib/game-logic';
import type { GameState, Card, Player } from '@/lib/types';
import { produce } from 'immer';
import { GameCardDef } from '@/lib/card-definitions';
import { MAX_HAND_SIZE } from '@/lib/constants';

export type GameAction =
  | { type: 'START_TURN'; payload: { player_id: number } }
  | { type: 'REVEAL_CARD'; payload: { player_id: number; r: number; c: number } }
  | { type: 'PLAY_CARD_OWN'; payload: { player_id: number; card_in_hand: Card; target_r: number; target_c: number } }
  | { type: 'PLAY_CARD_RIVAL'; payload: { player_id: number; card_in_hand: Card; target_r: number; target_c: number } }
  | { type: 'SWAP_CARD'; payload: { player_id: number; board_r: number; board_c: number; card_in_hand: Card } }
  | { type: 'PASS_TURN'; payload: { player_id: number } }
  | { type: 'RESET_GAME' }
  | { type: 'INITIALIZE_GAME'; payload: { numPlayers: number, cardDefs: GameCardDef[] } }
  | { type: 'SET_MESSAGE'; payload: string | null }
  | { type: 'CLEAR_EXPLOSION' }
  | { type: 'CLEAR_RIVAL_MOVE' }
  | { type: 'CLEAR_DRAWN_CARD' }
  | { type: 'TRIGGER_EXPLOSION'; payload: { playerId: number; r: number; c: number } };

const getInitialState = (numPlayers: number): GameState => ({
  players: [],
  deck: [],
  discardPile: [],
  currentPlayerIndex: 0,
  gameOver: false,
  winner: null,
  finalScores: [],
  isForcedToPlay: false,
  gameMessage: 'Cargando partida...',
  turnPhase: 'START_TURN',
  finalTurnCounter: -1,
  lastRevealedCard: null,
  explodingCard: null,
  lastRivalMove: null,
  lastDrawnCardId: null,
  lastRevealedBomb: null,
  showDrawAnimation: false,
});

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return Game.setupGame(action.payload.numPlayers, action.payload.cardDefs);
    case 'START_TURN':
      return Game.drawCard(state, action.payload.player_id);
    case 'REVEAL_CARD':
        return Game.revealCard(state, action.payload.player_id, action.payload.r, action.payload.c);
    case 'TRIGGER_EXPLOSION':
      return Game.triggerExplosion(state, action.payload.playerId, action.payload.r, action.payload.c);
    case 'PLAY_CARD_OWN':
      return Game.playCardOwnBoard(state, action.payload.player_id, action.payload.card_in_hand, action.payload.target_r, action.payload.target_c);
    case 'PLAY_CARD_RIVAL':
      return Game.playCardRivalBoard(state, action.payload.player_id, action.payload.card_in_hand, action.payload.target_r, action.payload.target_c);
    case 'SWAP_CARD':
      return Game.swapCard(state, action.payload.player_id, action.payload.board_r, action.payload.board_c, action.payload.card_in_hand);
    case 'PASS_TURN':
      return Game.passTurn(state, action.payload.player_id);
    case 'SET_MESSAGE':
      return produce(state, draft => {
        draft.gameMessage = action.payload;
      });
    case 'RESET_GAME':
        // This needs to be handled in the component to re-fetch definitions
      return state; 
    case 'CLEAR_EXPLOSION':
      if (!state.explodingCard) return state;
      const { playerId, r, c } = state.explodingCard;
      return Game.resolveExplosion(state, playerId, r, c);
    case 'CLEAR_RIVAL_MOVE':
      return Game.clearRivalMove(state);
    case 'CLEAR_DRAWN_CARD':
      return Game.clearDrawnCard(state);
    default:
      return state;
  }
};

export function useGame(numPlayers: number, cardDefs: GameCardDef[] | null) {
    const [gameState, dispatch] = useReducer(gameReducer, getInitialState(numPlayers));
    const [initialized, setInitialized] = useState(false);
  
    useEffect(() => {
      if (!initialized && cardDefs) {
        dispatch({ type: 'INITIALIZE_GAME', payload: { numPlayers, cardDefs } });
        setInitialized(true);
      }
    }, [initialized, numPlayers, cardDefs]);
  
    const resetGame = () => {
        if (cardDefs) {
            dispatch({ type: 'INITIALIZE_GAME', payload: { numPlayers, cardDefs } });
        }
    }

    // This effect ensures isForcedToPlay is updated correctly
    useEffect(() => {
        const player = gameState.players[gameState.currentPlayerIndex];
        if (player && player.hand.length > MAX_HAND_SIZE) {
            if (!gameState.isForcedToPlay) {
                const newState = produce(gameState, draft => {
                    draft.isForcedToPlay = true;
                });
                // This seems wrong, we shouldn't dispatch from a reducer-like calculation.
                // The logic should be in the reducer itself.
                // Let's move this to the drawCard action in game-logic.
            }
        }
    }, [gameState.players, gameState.currentPlayerIndex, gameState.isForcedToPlay]);

    return { gameState, dispatch, initialized, resetGame };
  }
  
    
