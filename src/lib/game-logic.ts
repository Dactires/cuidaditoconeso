import { GameState, Player, Card } from './types';
import {
  COLORS,
  CHARACTER_VALUES,
  CARDS_PER_VALUE_COLOR,
  BOMB_COUNT,
  INITIAL_HAND_SIZE,
  BOARD_SIZE,
  MAX_HAND_SIZE,
} from './constants';
import { produce } from 'immer';

// --- HELPER FUNCTIONS ---

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

let cardUid = 0;
const generateCardId = () => `card-${Date.now()}-${cardUid++}`;


function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of COLORS) {
    for (const value of CHARACTER_VALUES) {
      for (let i = 0; i < CARDS_PER_VALUE_COLOR; i++) {
        deck.push({
          uid: generateCardId(),
          type: 'Personaje',
          color,
          value,
          isFaceUp: false,
        });
      }
    }
  }
  for (let i = 0; i < BOMB_COUNT; i++) {
    deck.push({ uid: generateCardId(), type: 'Bomba', color: null, value: null, isFaceUp: false });
  }
  return shuffle(deck);
}

function getBoardScore(board: (Card | null)[][]): number {
  return board.flat().reduce((score, card) => {
    if (card && card.isFaceUp && card.type === 'Personaje' && card.value) {
      return score + card.value;
    }
    return score;
  }, 0);
}


// --- CORE GAME LOGIC ---

export function setupGame(numPlayers: number): GameState {
  const deck = createDeck();
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i,
    hand: [],
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    score: 0,
  }));

  // Deal initial hands
  for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
    for (const player of players) {
      player.hand.push(deck.pop()!);
    }
  }

  // Fill boards
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (const player of players) {
        player.board[r][c] = deck.pop()!;
      }
    }
  }

  return {
    players,
    deck,
    discardPile: [],
    currentPlayerIndex: 0,
    gameOver: false,
    winner: null,
    finalScores: [],
    isForcedToPlay: false,
    gameMessage: `Player 1's turn to start.`,
    turnPhase: 'START_TURN',
    finalTurnCounter: -1,
    lastRevealedCard: null,
  };
}

function nextTurn(state: GameState): GameState {
  if (state.finalTurnCounter > 0) {
    state.finalTurnCounter--;
    if (state.finalTurnCounter === 0) {
      state.turnPhase = 'GAME_OVER';
      state.gameOver = true;
      // Calculate final scores
      state.players.forEach(p => p.score = getBoardScore(p.board));
      state.finalScores = state.players.map(p => ({id: p.id, score: p.score }));
      const winner = state.players.reduce((max, p) => p.score > max.score ? p : max, state.players[0]);
      state.winner = winner;
      state.gameMessage = `Game over! Player ${winner.id + 1} wins!`;
      return state;
    }
  }
  
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.turnPhase = 'START_TURN';
  state.isForcedToPlay = false;
  state.gameMessage = `Player ${state.currentPlayerIndex + 1}'s turn.`;

  if (state.deck.length === 0 && state.finalTurnCounter === -1) {
    state.finalTurnCounter = state.players.length;
    state.gameMessage = `The deck is empty! Final round begins. Player ${state.currentPlayerIndex + 1}'s turn.`;
  }

  return state;
}

export const drawCard = produce((draft: GameState, playerId: number) => {
  if (draft.turnPhase !== 'START_TURN' || draft.currentPlayerIndex !== playerId) return;
  const player = draft.players[playerId];
  if (draft.deck.length > 0) {
    const newCard = draft.deck.pop()!;
    player.hand.push(newCard);
    draft.gameMessage = `Player ${playerId + 1} drew a card. Reveal a card on your board.`;
  } else {
    draft.gameMessage = `Deck is empty! Reveal a card on your board.`;
  }
  draft.isForcedToPlay = player.hand.length >= MAX_HAND_SIZE;
  draft.turnPhase = 'REVEAL_CARD';
});


const applyExplosion = (draft: GameState, player: Player, r: number, c: number) => {
    const coordsToReplace = new Set<string>([`${r},${c}`]);
    const coordsToCheck = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];

    for (const [ar, ac] of coordsToCheck) {
        if (ar >= 0 && ar < BOARD_SIZE && ac >= 0 && ac < BOARD_SIZE) {
            const adjCard = player.board[ar][ac];
            if (adjCard && adjCard.isFaceUp) {
                coordsToReplace.add(`${ar},${ac}`);
            }
        }
    }

    coordsToReplace.forEach(coord => {
        const [row, col] = coord.split(',').map(Number);
        const oldCard = player.board[row][col];
        if (oldCard) draft.discardPile.push(oldCard);
        if (draft.deck.length > 0) {
            const newCard = draft.deck.pop()!;
            newCard.isFaceUp = false;
            player.board[row][col] = newCard;
        } else {
            player.board[row][col] = null;
        }
    });
};

export const revealCard = produce((draft: GameState, playerId: number, r: number, c: number) => {
    if (draft.turnPhase !== 'REVEAL_CARD' || draft.currentPlayerIndex !== playerId) return;

    const player = draft.players[playerId];
    const card = player.board[r][c];

    if (!card || card.isFaceUp) return;

    card.isFaceUp = true;
    draft.lastRevealedCard = card;

    if (card.type === 'Bomba') {
        applyExplosion(draft, player, r, c);
        draft.gameMessage = `BOOM! Player ${playerId + 1} revealed a bomb. Choose your next action.`;
    } else {
        const newScore = getBoardScore(player.board);
        const scoreChange = newScore - player.score;
        player.score = newScore;
        draft.gameMessage = `Player ${playerId + 1} revealed a ${card.value}. Choose your action.`;
    }

    draft.turnPhase = 'ACTION';
});

export const playCardOwnBoard = produce((draft: GameState, playerId: number, cardInHand: Card, r: number, c: number) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    const targetCard = player.board[r][c];

    if (cardInHand.type !== 'Personaje' || !player.hand.some(c => c.uid === cardInHand.uid) || (targetCard && targetCard.isFaceUp)) return;
    
    if(targetCard) draft.discardPile.push(targetCard);
    
    const handCardIndex = player.hand.findIndex(c => c.uid === cardInHand.uid);
    const [playedCard] = player.hand.splice(handCardIndex, 1);
    
    playedCard.isFaceUp = true;
    player.board[r][c] = playedCard;
    player.score = getBoardScore(player.board);

    return nextTurn(draft);
});

export const playCardRivalBoard = produce((draft: GameState, playerId: number, cardInHand: Card, r: number, c: number) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    const rival = draft.players[(playerId + 1) % draft.players.length];
    const targetCard = rival.board[r][c];
    
    if (!player.hand.some(c => c.uid === cardInHand.uid) || (targetCard && targetCard.isFaceUp)) return;

    if(targetCard) draft.discardPile.push(targetCard);

    const handCardIndex = player.hand.findIndex(c => c.uid === cardInHand.uid);
    const [playedCard] = player.hand.splice(handCardIndex, 1);
    
    playedCard.isFaceUp = false;
    rival.board[r][c] = playedCard;
    
    return nextTurn(draft);
});

export const swapCard = produce((draft: GameState, playerId: number, r: number, c: number, cardInHand: Card) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    const boardCard = player.board[r][c];

    if (cardInHand.type !== 'Personaje' || !boardCard || !boardCard.isFaceUp || !player.hand.some(c => c.uid === cardInHand.uid)) return;
    
    const handCardIndex = player.hand.findIndex(c => c.uid === cardInHand.uid);
    const [playedCard] = player.hand.splice(handCardIndex, 1);

    player.hand.push(boardCard);
    
    playedCard.isFaceUp = true;
    player.board[r][c] = playedCard;
    player.score = getBoardScore(player.board);
    
    return nextTurn(draft);
});

export const passTurn = produce((draft: GameState, playerId: number) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    if (player.hand.length >= MAX_HAND_SIZE) {
        draft.gameMessage = "You have too many cards! You must play or swap.";
        return;
    }
    return nextTurn(draft);
});
