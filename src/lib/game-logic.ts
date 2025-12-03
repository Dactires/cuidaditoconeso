
import { GameState, Player, Card } from './types';
import {
  CARDS_PER_VALUE_COLOR,
  BOMB_COUNT,
  INITIAL_HAND_SIZE,
  BOARD_SIZE,
  MAX_HAND_SIZE,
} from './constants';
import { produce } from 'immer';
import type { GameCardDef } from './card-definitions';

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

// Updated to create a deck for a single player with specific levels
function createPlayerDeck(cardDefinitions: GameCardDef[], characterLevels: Record<string, number>): Card[] {
    const deck: Card[] = [];
    const characterDefs = cardDefinitions.filter(def => def.kind === 'character');

    for (const def of characterDefs) {
        const level = characterLevels[def.color] || 1; // Default to level 1 if not specified
        // All character cards of a color will have the same level for now.
        for (let i = 0; i < (CARDS_PER_VALUE_COLOR * 5); i++) {
             deck.push({
                uid: generateCardId(),
                type: 'Personaje',
                color: def.color,
                value: level,
                isFaceUp: false,
                imageUrl: def.imageUrl,
                ability: def.ability,
            });
        }
    }

    // Create bomb cards
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

// Now operates on a single player's deck and discard pile
function ensurePlayerDeckHasCards(player: Player, count: number): boolean {
    while (player.deck.length < count) {
        if (player.discardPile.length === 0) {
            return false; // Cannot refill
        }
        const refilledCards = shuffle(player.discardPile.map(c => ({...c, isFaceUp: false})));
        player.deck.push(...refilledCards);
        player.discardPile = [];
        // The game message can be set in the calling function if needed
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
type AbilityJson = {
  trigger: string;
  target: "OWN_BOARD" | "RIVAL_BOARD";
  action: string;
  params?: Record<string, any>;
};

const findCardPosition = (board: (Card | null)[][], uid: string): { r: number; c: number } | null => {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c]?.uid === uid) {
        return { r, c };
      }
    }
  }
  return null;
};

const getRandomHiddenOwnCardPos = (board: (Card | null)[][]) => {
  const hidden: { r: number; c: number }[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const card = board[r][c];
      if (card && !card.isFaceUp) hidden.push({ r, c });
    }
  }
  if (!hidden.length) return null;
  return hidden[Math.floor(Math.random() * hidden.length)];
};

const getRandomBoardPos = (board: (Card | null)[][]) => {
  const all: { r: number; c: number }[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      all.push({ r, c });
    }
  }
  return all[Math.floor(Math.random() * all.length)];
};

const triggerAbilities = (
  draft: GameState,
  playedCard: Card,
  trigger: "ON_PLAY_OWN_BOARD"
) => {
  if (!playedCard.ability?.json) return;

  let ability: AbilityJson;
  try {
    ability = JSON.parse(playedCard.ability.json);
  } catch {
    return;
  }

  if (ability.trigger !== trigger) return;

  const currentPlayer = draft.players[draft.currentPlayerIndex];
  const rivalPlayer = draft.players[(draft.currentPlayerIndex + 1) % draft.players.length];

  switch (ability.action) {
    case "SHUFFLE_ALL_CARDS": {
      if (ability.target === "RIVAL_BOARD") {
        rivalPlayer.board = shuffleBoard(rivalPlayer.board);
        draft.gameMessage = `¡${playedCard.ability.name}! El tablero del rival ha sido barajado.`;
      }
      break;
    }

    case "DISCARD_NEIGHBOR": {
      const pos = findCardPosition(currentPlayer.board, playedCard.uid);
      if (!pos) break;
      const dir = ability.params?.direction || "RIGHT";
      const targetC = dir === "RIGHT" ? pos.c + 1 : pos.c - 1;
      const targetR = pos.r;

      if (
        targetR >= 0 && targetR < BOARD_SIZE &&
        targetC >= 0 && targetC < BOARD_SIZE
      ) {
        const neighbor = currentPlayer.board[targetR][targetC];
        if (neighbor) {
          currentPlayer.discardPile.push({ ...neighbor, isFaceUp: true });
          currentPlayer.board[targetR][targetC] = null;
          
          // Refill the slot
          if (ensurePlayerDeckHasCards(currentPlayer, 1)) {
              const newCard = currentPlayer.deck.pop()!;
              draft.refillingSlots.push({ playerId: currentPlayer.id, r: targetR, c: targetC, card: newCard });
          }
        }
      }
      draft.gameMessage = `¡${playedCard.ability.name}! Descartaste una carta y se repone tu tablero.`;
      break;
    }

    case "PLANT_BOMB_RANDOM": {
      // Buscar bomba en deck o descarte del jugador actual
      let bombIdx = currentPlayer.deck.findIndex(c => c.type === "Bomba");
      let bombSource: "deck" | "discard" | null = null;

      if (bombIdx !== -1) {
        bombSource = "deck";
      } else {
        bombIdx = currentPlayer.discardPile.findIndex(c => c.type === "Bomba");
        if (bombIdx !== -1) bombSource = "discard";
      }

      if (!bombSource) {
        // no hay bombas disponibles, habilidad no hace nada
        break;
      }

      const bombCard =
        bombSource === "deck"
          ? currentPlayer.deck.splice(bombIdx, 1)[0]
          : currentPlayer.discardPile.splice(bombIdx, 1)[0];

      bombCard.isFaceUp = false;

      const pos = getRandomBoardPos(rivalPlayer.board);
      const existing = rivalPlayer.board[pos.r][pos.c];
      if (existing) {
        rivalPlayer.discardPile.push({ ...existing, isFaceUp: true });
      }
      rivalPlayer.board[pos.r][pos.c] = { ...bombCard, uid: generateCardId() };

      draft.gameMessage = `¡${playedCard.ability.name}! Plantaste una bomba oculta en el tablero rival.`;
      break;
    }

    case "REVEAL_RANDOM_BRIEFLY": {
      const pos = getRandomHiddenOwnCardPos(currentPlayer.board);
      if (!pos) break;

      const card = currentPlayer.board[pos.r][pos.c];
      if (!card) break;

      card.isFaceUp = true;

      // marcamos una revelación temporal
      draft.tempReveal = {
        playerId: currentPlayer.id,
        r: pos.r,
        c: pos.c,
        cardUid: card.uid,
        hideAt: Date.now() + (ability.params?.durationMs ?? 1000),
      };

      draft.gameMessage = `¡${playedCard.ability.name}! Espiás una carta de tu tablero.`;
      break;
    }

    default:
      // acciones futuras que quieras agregar
      break;
  }
};

// --- CORE GAME LOGIC ---

export function setupGame(numPlayers: number, cardDefinitions: GameCardDef[]): GameState {
  cardUid = 0; // Reset UID counter for a new game

  // For now, all players have level 1 characters
  const player1Levels = { 'Rojo': 1, 'Azul': 1, 'Verde': 1, 'Amarillo': 1 };
  const player2Levels = { 'Rojo': 1, 'Azul': 1, 'Verde': 1, 'Amarillo': 1 };
  const playerLevels = [player1Levels, player2Levels];

  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i,
    hand: [],
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    score: 0,
    deck: createPlayerDeck(cardDefinitions, playerLevels[i]),
    discardPile: [],
  }));

  // Deal initial hands and boards from individual decks
  for (const player of players) {
      // Deal hand
      for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
        if (ensurePlayerDeckHasCards(player, 1)) {
           const card = player.deck.pop();
            if (card) {
              player.hand.push({ ...card, isFaceUp: true });
            }
        }
      }
      // Fill board
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
           if (ensurePlayerDeckHasCards(player, 1)) {
              const card = player.deck.pop();
              if (card) {
                  player.board[r][c] = { ...card, isFaceUp: false };
              }
           }
        }
      }
  }


  return {
    players,
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
    tempReveal: null,
  };
}

const checkEndGame = (draft: GameState) => {
    // 1) NUEVA REGLA: tablero lleno de personajes boca arriba
    let gameShouldEnd = false;

    for (const player of draft.players) {
        const board = player.board.flat();
        if (board.every(card => card !== null && card.isFaceUp)) {
            gameShouldEnd = true;
            break;
        }
    }

    if (gameShouldEnd && draft.finalTurnCounter === -1) {
        draft.finalTurnCounter = draft.players.length;
        draft.gameMessage = `¡Un jugador completó su tablero! Comienza la ronda final.`;
    }

    // 2) Lógica de ronda final
    if (draft.finalTurnCounter === 0 && !draft.gameOver) {
        draft.gameOver = true;
        draft.turnPhase = 'GAME_OVER';

        draft.players.forEach(p => {
            p.score = getBoardScore(p.board);
        });
        draft.finalScores = draft.players.map(p => ({ id: p.id, score: p.score }));

        const scores = draft.players.map(p => p.score);
        const maxScore = Math.max(...scores);
        const winners = draft.players.filter(p => p.score === maxScore);

        if (winners.length > 1) {
            draft.winner = null;
            draft.gameMessage = `¡Fin del juego! ¡Empate con ${maxScore} puntos!`;
        } else {
            draft.winner = winners[0];
            const winnerName = winners[0].id === 0 ? "Jugador 1" : `Rival (IA)`;
            draft.gameMessage = `¡Fin del juego! ¡${winnerName} gana con ${maxScore} puntos!`;
        }
    }
};

function nextTurn(state: GameState): GameState {
  if (state.gameOver) return state;

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.turnPhase = 'START_TURN';
  state.isForcedToPlay = false;
  state.gameMessage = `Turno del Jugador ${state.currentPlayerIndex + 1}.`;

  if (state.finalTurnCounter > 0) {
    state.finalTurnCounter--;
  }
  
  checkEndGame(state);
  
  // checkEndGame might set gameOver, so we check again
  if (state.gameOver) return state;

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.deck.length === 0 && state.finalTurnCounter === -1) {
    if (ensurePlayerDeckHasCards(currentPlayer, 1)) {
        state.gameMessage = `El mazo del Jugador ${currentPlayer.id + 1} estaba vacío y fue barajado. ¡Tu turno!`;
    } else {
        if (state.finalTurnCounter === -1) {
          state.finalTurnCounter = state.players.length;
          state.gameMessage = `¡El mazo del Jugador ${currentPlayer.id + 1} se agotó! Comienza la ronda final.`;
        }
    }
  }

  return state;
}

export const drawCard = produce((draft: GameState, playerId: number) => {
  if (draft.turnPhase !== 'START_TURN' || draft.currentPlayerIndex !== playerId) return;
  const player = draft.players[playerId];

  if (ensurePlayerDeckHasCards(player, 1)) {
    const newCard = player.deck.pop()!;
    const handCard = { ...newCard, isFaceUp: true };
    player.hand.push(handCard);
    draft.lastDrawnCardId = handCard.uid;
    draft.showDrawAnimation = true;
    draft.gameMessage = `Jugador ${playerId + 1} robó una carta. Revela una carta de tu tablero.`;
  } else {
    draft.gameMessage = `¡No quedan cartas en el mazo! Revela una carta.`;
    if (draft.finalTurnCounter === -1) {
      draft.finalTurnCounter = draft.players.length;
    }
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
    draft.lastRevealedCard = { playerId, r, c, card: { ...card } };
    draft.explodingCard = null;

    if (card.type === 'Bomba') {
        draft.lastRevealedBomb = { playerId, r, c, cardUid: card.uid };
        draft.gameMessage = `¡BOOM! El Jugador ${playerId + 1} reveló una bomba.`;
    } else {
        player.score = getBoardScore(player.board);
        draft.gameMessage = `Jugador ${playerId + 1} reveló un ${card.value}. Elige tu acción.`;
        draft.turnPhase = 'ACTION';
    }

    checkEndGame(draft);
});

export const triggerExplosion = produce((draft: GameState, playerId: number, r: number, c: number) => {
    const player = draft.players[playerId];
    const explodingCard = player.board[r][c];
    if (!explodingCard || explodingCard.type !== 'Bomba') return;
    draft.explodingCard = { playerId, r, c, card: { ...explodingCard } };
    draft.lastRevealedBomb = null;
});

export const resolveExplosion = produce((draft: GameState, playerId: number, r: number, c: number) => {
  const player = draft.players[playerId];
  const centerCard = player.board[r][c];

  if (!centerCard || centerCard.type !== 'Bomba') {
      draft.explodingCard = null;
      return;
  };

  player.discardPile.push({ ...centerCard, isFaceUp: true });
  player.board[r][c] = null;

  const coordsToCheck = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
  const positionsToRefill: { r: number; c: number }[] = [{ r, c }];

  for (const [ar, ac] of coordsToCheck) {
    if (ar >= 0 && ar < BOARD_SIZE && ac >= 0 && ac < BOARD_SIZE) {
      const adjCard = player.board[ar][ac];
      if (adjCard && adjCard.isFaceUp) {
        player.discardPile.push({ ...adjCard, isFaceUp: true });
        player.board[ar][ac] = null;
        positionsToRefill.push({ r: ar, c: ac });
      }
    }
  }
  
  ensurePlayerDeckHasCards(player, positionsToRefill.length);
  draft.refillingSlots = [];
  positionsToRefill.forEach(pos => {
    if (player.deck.length > 0) {
      const newCard = player.deck.pop()!;
      draft.refillingSlots.push({ playerId: playerId, r: pos.r, c: pos.c, card: newCard });
    }
  });

  player.score = getBoardScore(player.board);
  draft.explodingCard = null;
  draft.turnPhase = 'ACTION';
  draft.gameMessage = `La bomba explotó. Elige tu próxima acción.`;
  checkEndGame(draft);
});

export const finishRefillAnimation = produce((draft: GameState, payload: { playerId: number; r: number; c: number; card: Card }) => {
    const { playerId, r, c, card } = payload;
    const player = draft.players[playerId];
    
    player.board[r][c] = { ...card, isFaceUp: false };

    const slotIndex = draft.refillingSlots.findIndex(slot => slot.card.uid === card.uid);
    if (slotIndex > -1) {
        draft.refillingSlots.splice(slotIndex, 1);
    }

    if (draft.refillingSlots.length === 0) {
        checkEndGame(draft);
    }
});


export const playCardOwnBoard = produce((draft: GameState, playerId: number, cardInHand: Card, r: number, c: number) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    const targetCard = player.board[r][c];

    if (cardInHand.type !== 'Personaje' || !player.hand.some(c => c.uid === cardInHand.uid) || (targetCard && targetCard.isFaceUp)) return;
    
    if(targetCard) player.discardPile.push({...targetCard, isFaceUp: true});
    
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
    
    if (!player.hand.some(c => c.uid === cardInHand.uid) || (targetCard && targetCard.isFaceUp)) return;

    if(targetCard) rival.discardPile.push({...targetCard, isFaceUp: true});

    const handCardIndex = player.hand.findIndex(c => c.uid === cardInHand.uid);
    const [playedCard] = player.hand.splice(handCardIndex, 1);
    
    const newBoardCard = { ...playedCard, isFaceUp: false };
    rival.board[r][c] = newBoardCard;

    draft.lastRivalMove = { playerId: rival.id, r, c };
    
    return nextTurn(draft);
});

export const swapCard = produce((draft: GameState, playerId: number, r: number, c: number, cardInHand: Card) => {
    if (draft.turnPhase !== 'ACTION' || draft.currentPlayerIndex !== playerId) return;
    const player = draft.players[playerId];
    const boardCard = player.board[r][c];

    if (cardInHand.type !== 'Personaje' || !boardCard || !boardCard.isFaceUp || boardCard.type !== 'Personaje' || !player.hand.some(c => c.uid === cardInHand.uid)) return;
    
    const handCardIndex = player.hand.findIndex(c => c.uid === cardInHand.uid);
    const [playedCard] = player.hand.splice(handCardIndex, 1);

    player.hand.push({ ...boardCard, isFaceUp: true });
    
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
  return resolveExplosion(draft, playerId, r, c);
});

export const clearRivalMove = produce((draft: GameState) => {
  draft.lastRivalMove = null;
});

export const clearDrawnCard = produce((draft: GameState) => {
  draft.lastDrawnCardId = null;
  draft.showDrawAnimation = false;
});

export const hideTempReveal = produce((
  draft: GameState,
  payload: { playerId: number; r: number; c: number; cardUid: string }
) => {
  const { playerId, r, c, cardUid } = payload;
  const player = draft.players[playerId];
  const card = player.board[r][c];

  if (card && card.uid === cardUid) {
    card.isFaceUp = false;
  }
  draft.tempReveal = null;
});
