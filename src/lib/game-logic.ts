
import { GameState, Player, Card } from './types';
import {
  CARDS_PER_VALUE_COLOR,
  BOMB_COUNT,
  INITIAL_HAND_SIZE,
  BOARD_SIZE,
  MAX_HAND_SIZE,
  CHARACTER_VALUES,
  COLORS,
} from './constants';
import { produce } from 'immer';
import type { GameCardDef, CardAbility } from './card-definitions';

// --- HELPER FUNCTIONS ---

function shuffle<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
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
const generateCardId = () => `card-${cardUid++}`;

function createDeck(cardDefinitions: GameCardDef[]): Card[] {
    cardUid = 0; // Reset UID counter
    const deck: Card[] = [];

    const characterDefs = cardDefinitions.filter(def => def.kind === 'character');
    
    for (const def of characterDefs) {
        for (const value of CHARACTER_VALUES) {
            for (let i = 0; i < CARDS_PER_VALUE_COLOR; i++) {
                deck.push({
                    uid: generateCardId(),
                    type: 'Personaje',
                    color: def.color,
                    value: value,
                    isFaceUp: false,
                    imageUrl: def.imageUrl, // Se usa la misma imagen para todas las variantes
                    ability: def.ability,
                });
            }
        }
    }
  
    // --- Create bomb cards ---
    const bombDef = cardDefinitions.find(def => def.id === 'bomb');
    if (bombDef) {
        for (let i = 0; i < BOMB_COUNT; i++) {
          deck.push({ 
              uid: generateCardId(), 
              type: 'Bomba', 
              color: null, 
              value: null, 
              isFaceUp: false, 
              imageUrl: bombDef.imageUrl,
              ability: bombDef.ability,
          });
        }
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

function ensureDeckHasCards(draft: GameState, count: number): boolean {
    while (draft.deck.length < count) {
        if (draft.discardPile.length === 0) {
            return false;
        }
        draft.deck.push(...shuffle(draft.discardPile.map(c => ({...c, isFaceUp: false}))));
        draft.discardPile = [];
        draft.gameMessage = "¡Mazo vacío! Barajando el descarte..."
    }
    return true;
}

const shuffleBoard = (board: (Card | null)[][]): (Card | null)[][] => {
    const flatBoard = board.flat();
    const shuffledFlatBoard = shuffle(flatBoard);
    const newBoard: (Card | null)[][] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        newBoard.push(shuffledFlatBoard.slice(i * BOARD_SIZE, (i + 1) * BOARD_SIZE));
    }
    return newBoard;
};

// --- ABILITY HANDLING ---
const triggerAbilities = (draft: GameState, playedCard: Card, trigger: "ON_PLAY_OWN_BOARD") => {
    if (!playedCard.ability?.json) return;

    let ability;
    try {
        ability = JSON.parse(playedCard.ability.json);
    } catch {
        // Invalid JSON, do nothing
        return;
    }

    if (ability.trigger === trigger) {
        if (ability.action === "SHUFFLE_ALL_CARDS" && ability.target === "RIVAL_BOARD") {
            const rivalPlayerIndex = (draft.currentPlayerIndex + 1) % draft.players.length;
            const rivalPlayer = draft.players[rivalPlayerIndex];
            rivalPlayer.board = shuffleBoard(rivalPlayer.board);
            draft.gameMessage = `¡${playedCard.ability.name}! El tablero del rival ha sido barajado.`;
        }
    }
};


// --- CORE GAME LOGIC ---

export function setupGame(numPlayers: number, cardDefinitions: GameCardDef[]): GameState {
  const deck = createDeck(cardDefinitions);

  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i,
    hand: [],
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    score: 0,
  }));

  // Deal initial hands
  if (ensureDeckHasCards({ deck, discardPile: [], players } as GameState, INITIAL_HAND_SIZE * numPlayers)) {
    for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
      for (const player of players) {
        const card = deck.pop();
        if(card) {
          player.hand.push({ ...card, isFaceUp: true });
        }
      }
    }
  }


  // Fill boards
  if (ensureDeckHasCards({ deck, discardPile: [], players } as GameState, BOARD_SIZE * BOARD_SIZE * numPlayers)) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        for (const player of players) {
          const card = deck.pop();
          if (card) {
              player.board[r][c] = { ...card, isFaceUp: false };
          }
        }
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
    gameMessage: `Turno del Jugador 1 para empezar.`,
    turnPhase: 'START_TURN',
    finalTurnCounter: -1,
    lastRevealedCard: null,
    explodingCard: null,
    lastRivalMove: null,
    lastDrawnCardId: null,
    lastRevealedBomb: null,
    showDrawAnimation: false,
    refillingSlots: [],
  };
}

const checkEndGame = (draft: GameState) => {
  let gameShouldEnd = false;
  for (const player of draft.players) {
    if (player.board.flat().every(card => card === null || card.isFaceUp)) {
      gameShouldEnd = true;
      break;
    }
  }

  if (gameShouldEnd && draft.finalTurnCounter === -1) {
    draft.finalTurnCounter = draft.players.length; // Set final turn countdown
    draft.gameMessage = `¡Un jugador completó su tablero! Comienza la ronda final.`;
  }

  if (draft.finalTurnCounter > 0) {
    // This part seems to be handled in nextTurn now.
  }

  if (draft.finalTurnCounter === 0 && !draft.gameOver) {
      draft.gameOver = true;
      draft.turnPhase = 'GAME_OVER';

      // Calculate final scores
      draft.players.forEach(p => {
        p.score = getBoardScore(p.board);
      });
      draft.finalScores = draft.players.map(p => ({ id: p.id, score: p.score }));

      // Determine winner
      const scores = draft.players.map(p => p.score);
      const maxScore = Math.max(...scores);
      const winners = draft.players.filter(p => p.score === maxScore);

      if (winners.length > 1) {
          draft.winner = null; // It's a tie
          draft.gameMessage = `¡Fin del juego! ¡Empate con ${maxScore} puntos!`;
      } else {
          draft.winner = winners[0];
          draft.gameMessage = `¡Fin del juego! ¡El Jugador ${winners[0].id + 1} gana!`;
      }
  }
}

function nextTurn(state: GameState): GameState {
  if (state.gameOver) return state;

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.turnPhase = 'START_TURN';
  state.isForcedToPlay = false;
  state.gameMessage = `Turno del Jugador ${state.currentPlayerIndex + 1}.`;

  if (state.finalTurnCounter > 0) {
    state.finalTurnCounter--;
  }
  
  if (state.deck.length === 0 && state.finalTurnCounter === -1) {
    if (ensureDeckHasCards(state, 1)) {
        // Deck was refilled, continue normally
    } else {
        // Deck is empty and cannot be refilled, start final turns
        state.finalTurnCounter = state.players.length;
        state.gameMessage = `¡El mazo se agotó! Comienza la ronda final.`;
    }
  }
  
  checkEndGame(state);

  return state;
}

export const drawCard = produce((draft: GameState, playerId: number) => {
  if (draft.turnPhase !== 'START_TURN' || draft.currentPlayerIndex !== playerId) return;
  const player = draft.players[playerId];

  if (ensureDeckHasCards(draft, 1)) {
    const newCard = draft.deck.pop()!;
    const handCard = { ...newCard, isFaceUp: true };
    player.hand.push(handCard);
    draft.lastDrawnCardId = handCard.uid;
    draft.showDrawAnimation = true;

    draft.gameMessage = `Jugador ${playerId + 1} robó una carta. Revela una carta de tu tablero.`;
  } else {
    draft.gameMessage = `El mazo está vacío y no se puede rellenar. Revela una carta.`;
    checkEndGame(draft); // Check if game should end now
  }
  draft.isForcedToPlay = player.hand.length > MAX_HAND_SIZE;
  draft.turnPhase = 'REVEAL_CARD';
});

export const revealCard = produce((draft: GameState, playerId: number, r: number, c: number) => {
    if (draft.turnPhase !== 'REVEAL_CARD' || draft.currentPlayerIndex !== playerId) return;

    const player = draft.players[playerId];
    const card = player.board[r][c];

    if (!card || card.isFaceUp) return;

    card.isFaceUp = true;
    draft.lastRevealedCard = { playerId, r, c, card: { ...card } }; // Make a copy
    draft.explodingCard = null; // Ensure no explosion is active yet

    if (card.type === 'Bomba') {
        draft.lastRevealedBomb = { playerId, r, c, cardUid: card.uid };
        draft.gameMessage = `¡BOOM! El Jugador ${playerId + 1} reveló una bomba.`;
        // No change in turn phase here, wait for animation trigger
    } else {
        const newScore = getBoardScore(player.board);
        player.score = newScore;
        draft.gameMessage = `Jugador ${playerId + 1} reveló un ${card.value}. Elige tu acción.`;
        draft.turnPhase = 'ACTION';
    }

    checkEndGame(draft);
});

export const triggerExplosion = produce((draft: GameState, playerId: number, r: number, c: number) => {
    const player = draft.players[playerId];
    const explodingCard = player.board[r][c];

    if (!explodingCard || explodingCard.type !== 'Bomba') return;
    
    // Mark the card for animation
    draft.explodingCard = { playerId, r, c, card: { ...explodingCard } };
    draft.lastRevealedBomb = null;
    // CRUCIAL: Don't remove the card from the board here. It will be removed in resolveExplosion.
});

export const resolveExplosion = produce((draft: GameState, playerId: number, r: number, c: number) => {
  const player = draft.players[playerId];
  const centerCard = player.board[r][c];

  if (!centerCard || centerCard.type !== 'Bomba') {
      // This can happen if the state changes between animation start and end.
      // We just clean up the exploding card state.
      draft.explodingCard = null;
      return;
  };

  // Move the bomb to the discard pile and clear its slot
  draft.discardPile.push({ ...centerCard, isFaceUp: true });
  player.board[r][c] = null;

  const coordsToCheck = [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ];

  const positionsToRefill: { r: number; c: number }[] = [{ r, c }];

  // Destroy adjacent FACE-UP cards only
  for (const [ar, ac] of coordsToCheck) {
    if (ar >= 0 && ar < BOARD_SIZE && ac >= 0 && ac < BOARD_SIZE) {
      const adjCard = player.board[ar][ac];
      if (adjCard && adjCard.isFaceUp) {
        draft.discardPile.push({ ...adjCard, isFaceUp: true });
        player.board[ar][ac] = null;
        positionsToRefill.push({ r: ar, c: ac });
      }
    }
  }
  
  // Prepare slots for refill animation by staging them
  ensureDeckHasCards(draft, positionsToRefill.length);
  draft.refillingSlots = [];
  positionsToRefill.forEach(pos => {
    if (draft.deck.length > 0) {
      const newCard = draft.deck.pop()!;
      // This card will be animated, it is placed on board in finishRefillAnimation
      draft.refillingSlots.push({ playerId: playerId, r: pos.r, c: pos.c, card: newCard });
    }
  });

  player.score = getBoardScore(player.board);
  draft.explodingCard = null; // Clear the explosion state
  draft.turnPhase = 'ACTION'; // After explosion, player can act
  draft.gameMessage = `La bomba explotó. Elige tu próxima acción.`;
  checkEndGame(draft);
});

export const finishRefillAnimation = produce((draft: GameState, payload: { playerId: number; r: number; c: number; card: Card }) => {
    const { playerId, r, c, card } = payload;
    const player = draft.players[playerId];
    
    // Place the card on the board, ensuring it's face down
    player.board[r][c] = { ...card, isFaceUp: false };

    // Remove it from the refilling list
    const slotIndex = draft.refillingSlots.findIndex(slot => slot.card.uid === card.uid);
    if (slotIndex > -1) {
        draft.refillingSlots.splice(slotIndex, 1);
    }

    // If all animations are done, check for game end state again
    if (draft.refillingSlots.length === 0) {
        checkEndGame(draft);
    }
});


export const playCardOwnBoard = produce((draft: GameState, playerId: number, cardInHand: Card, r: number, c: number) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    const targetCard = player.board[r][c];

    // Can only play character cards on your own board
    if (cardInHand.type !== 'Personaje' || !player.hand.some(c => c.uid === cardInHand.uid) || (targetCard && targetCard.isFaceUp)) return;
    
    if(targetCard) draft.discardPile.push({...targetCard, isFaceUp: true});
    
    const handCardIndex = player.hand.findIndex(c => c.uid === cardInHand.uid);
    const [playedCard] = player.hand.splice(handCardIndex, 1);
    
    const newBoardCard = { ...playedCard, isFaceUp: true };
    player.board[r][c] = newBoardCard;
    player.score = getBoardScore(player.board);
    
    triggerAbilities(draft, newBoardCard, "ON_PLAY_OWN_BOARD");

    checkEndGame(draft);
    if (!draft.gameOver) {
      return nextTurn(draft);
    }
});

export const playCardRivalBoard = produce((draft: GameState, playerId: number, cardInHand: Card, r: number, c: number) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    const rival = draft.players[(playerId + 1) % draft.players.length];
    const targetCard = rival.board[r][c];
    
    // You can play any card on rival's board
    if (!player.hand.some(c => c.uid === cardInHand.uid) || (targetCard && targetCard.isFaceUp)) return;

    if(targetCard) draft.discardPile.push({...targetCard, isFaceUp: true});

    const handCardIndex = player.hand.findIndex(c => c.uid === cardInHand.uid);
    const [playedCard] = player.hand.splice(handCardIndex, 1);
    
    // Card placed on rival's board is always face down
    const newBoardCard = { ...playedCard, isFaceUp: false };
    rival.board[r][c] = newBoardCard;

    draft.lastRivalMove = { playerId: rival.id, r, c };
    
    return nextTurn(draft);
});

export const swapCard = produce((draft: GameState, playerId: number, r: number, c: number, cardInHand: Card) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    const boardCard = player.board[r][c];

    // Can only swap with your own face-up character cards
    if (cardInHand.type !== 'Personaje' || !boardCard || !boardCard.isFaceUp || boardCard.type !== 'Personaje' || !player.hand.some(c => c.uid === cardInHand.uid)) return;
    
    const handCardIndex = player.hand.findIndex(c => c.uid === cardInHand.uid);
    const [playedCard] = player.hand.splice(handCardIndex, 1);

    // The card from the board goes to hand, face up
    player.hand.push({ ...boardCard, isFaceUp: true });
    
    // The card from hand goes to board, face up
    const newBoardCard = { ...playedCard, isFaceUp: true };
    player.board[r][c] = newBoardCard;

    player.score = getBoardScore(player.board);
    
    checkEndGame(draft);
    if (!draft.gameOver) {
      return nextTurn(draft);
    }
});

export const passTurn = produce((draft: GameState, playerId: number) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    if (player.hand.length > MAX_HAND_SIZE) {
        draft.isForcedToPlay = true;
        draft.gameMessage = "¡Tienes demasiadas cartas! Debes jugar o intercambiar una.";
        return;
    }
    return nextTurn(draft);
});

export const clearExplosion = produce((draft: GameState) => {
  if (!draft.explodingCard) return;
  const { playerId, r, c } = draft.explodingCard;
  // This action now triggers the resolution after the animation.
  return resolveExplosion(draft, playerId, r, c);
});

export const clearRivalMove = produce((draft: GameState) => {
  draft.lastRivalMove = null;
});

export const clearDrawnCard = produce((draft: GameState) => {
  draft.lastDrawnCardId = null;
  draft.showDrawAnimation = false;
});

    