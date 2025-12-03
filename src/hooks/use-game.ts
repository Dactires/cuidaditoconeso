'use client';

import { useReducer } from 'react';
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
  | { type: 'SET_MESSAGE'; payload: string | null };

const gameReducer = (state: GameState, action: GameAction): GameState => {
  return produce(state, draft => {
    switch (action.type) {
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
  const [gameState, dispatch] = useReducer(gameReducer, Game.setupGame(numPlayers));

  return { gameState, dispatch };
}
