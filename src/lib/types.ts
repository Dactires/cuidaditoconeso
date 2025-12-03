import { CardAbility } from "./card-definitions";

export interface Card {
  uid: string;
  type: 'Personaje' | 'Bomba';
  color: string | null;
  value: number | null;
  isFaceUp: boolean;
  imageUrl?: string;
  ability?: CardAbility;
}

export interface Player {
  id: number;
  hand: Card[];
  board: (Card | null)[][];
  score: number;
  deck: Card[];
  discardPile: Card[];
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  gameOver: boolean;
  winner: Player | null;
  finalScores: { id: number; score: number }[];
  isForcedToPlay: boolean;
  gameMessage: string | null;
  turnPhase: 'START_TURN' | 'REVEAL_CARD' | 'ACTION' | 'GAME_OVER';
  finalTurnCounter: number;
  lastRevealedCard: { playerId: number; r: number; c: number; card: Card } | null;
  explodingCard: { r: number; c: number; playerId: number; card: Card } | null;
  lastRivalMove: { r: number; c: number; playerId: number } | null;
  lastDrawnCardId: string | null;
  lastRevealedBomb: { playerId: number; r: number; c: number; cardUid: string; } | null;
  showDrawAnimation: boolean;
  refillingSlots: { playerId: number; r: number; c: number; card: Card }[];
}
