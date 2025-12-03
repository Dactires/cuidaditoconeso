export interface Card {
  uid: string;
  type: 'Personaje' | 'Bomba';
  color: string | null;
  value: number | null;
  isFaceUp: boolean;
}

export interface Player {
  id: number;
  hand: Card[];
  board: (Card | null)[][];
  score: number;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  gameOver: boolean;
  winner: Player | null;
  finalScores: { id: number; score: number }[];
  isForcedToPlay: boolean;
  gameMessage: string | null;
  turnPhase: 'START_TURN' | 'REVEAL_CARD' | 'ACTION' | 'GAME_OVER';
  finalTurnCounter: number;
  lastRevealedCard: Card | null;
  explodingCard: { r: number; c: number; playerId: number } | null;
  lastRivalMove: { r: number; c: number; playerId: number } | null;
}
