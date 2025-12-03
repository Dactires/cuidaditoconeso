
'use client';

import { useReducer, useEffect, useState } from 'react';
import * as Game from '@/lib/game-logic';
import type { GameState, Card, Player } from '@/lib/types';
import { produce } from 'immer';
import { GameCardDef } from '@/lib/card-definitions';
import { INITIAL_HAND_SIZE, MAX_HAND_SIZE } from '@/lib/constants';

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
  | { type: 'TRIGGER_EXPLOSION'; payload: { playerId: number; r: number; c: number } }
  | { type: 'HIDE_TEMP_REVEAL'; payload: { playerId: number; r: number; c: number; cardUid: string } }
  | { type: 'SET_SFX_URL'; payload: string | null };

const getInitialState = (numPlayers: number): GameState => ({
  players: [],
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
  showDrawAnimation: false,
  refillingSlots: [],
  sfxUrl: null,
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
      return state; 
    case 'CLEAR_EXPLOSION':
      if (!state.explodingCard) return state;
      const { playerId, r, c } = state.explodingCard;
      return Game.resolveExplosion(state, playerId, r, c);
    case 'CLEAR_RIVAL_MOVE':
      return Game.clearRivalMove(state);
    case 'CLEAR_DRAWN_CARD':
      return Game.clearDrawnCard(state);
    case 'HIDE_TEMP_REVEAL':
        return Game.hideTempReveal(state, action.payload);
    case 'SET_SFX_URL':
        return Game.setSfxUrl(state, action.payload);
    default:
      return state;
  }
};

export function useGame(numPlayers: number, cardDefs: GameCardDef[] | null) {
    const [gameState, dispatch] = useReducer(gameReducer, getInitialState(numPlayers));
    const [initialized, setInitialized] = useState(false);
  
    useEffect(() => {
      if (cardDefs && !initialized) {
        dispatch({ type: 'INITIALIZE_GAME', payload: { numPlayers, cardDefs } });
        setInitialized(true);
      }
    }, [numPlayers, cardDefs, initialized]);
  
    const resetGame = () => {
        if (cardDefs) {
            setInitialized(false);
            const timer = setTimeout(() => {
                dispatch({ type: 'INITIALIZE_GAME', payload: { numPlayers, cardDefs } });
                setInitialized(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }

    // Effect for handling temporary reveals (Blue card ability)
    useEffect(() => {
        if (gameState.tempReveal) {
            const { playerId, r, c, cardUid, hideAt } = gameState.tempReveal;
            const delay = hideAt - Date.now();
            
            const timer = setTimeout(() => {
                dispatch({ type: 'HIDE_TEMP_REVEAL', payload: { playerId, r, c, cardUid } });
            }, Math.max(0, delay));

            return () => clearTimeout(timer);
        }
    }, [gameState.tempReveal]);


    return { gameState, dispatch, initialized, resetGame };
  }
