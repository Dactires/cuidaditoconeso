
export type CardKind = "character" | "bomb" | "hero" | "power" | "back";

export type CardAbility = {
  name: string;
  description: string;
  json: string;
};

export type GameCardDef = {
  id: string;
  kind: CardKind;
  label: string;
  shortLabel: string;
  color: string;
  colorClass: string;
  ribbonClass: string;
  textColor?: string;
  value: number;
  description: string;
  imageUrl?: string;
  ability?: CardAbility;
};

const characterDescriptions = {
  rojo: "Al jugar esta carta, descarta la carta a su derecha (si existe) en tu tablero.",
  azul: "Al jugar esta carta, revela una carta al azar de tu propio tablero durante 1 segundo y luego vuelve a ocultarla (solo información, no cambia puntos).",
  verde: "Al jugar esta carta, planta una bomba oculta en una posición aleatoria del tablero rival.",
  amarillo: "Al jugar esta carta, mezcla aleatoriamente todas las cartas del tablero del rival, cambiando completamente sus posiciones.",
};

export const CARD_DEFINITIONS: GameCardDef[] = [
  // --- REVERSO ---
  {
    id: "card-back",
    kind: "back",
    label: "Reverso de la Carta",
    shortLabel: "Reverso",
    color: "Gris",
    colorClass: "bg-slate-500",
    ribbonClass: "bg-slate-700",
    value: 0,
    description: "Esta es la imagen que se mostrará en el dorso de todas las cartas del juego cuando estén boca abajo.",
  },
  
  // --- PERSONAJES (UNA DEFINICIÓN POR COLOR) ---
  {
    id: 'character-rojo',
    kind: 'character',
    label: 'Personaje Rojo',
    shortLabel: 'Rojo',
    color: 'Rojo',
    colorClass: 'bg-red-500',
    ribbonClass: 'bg-red-700',
    value: 0, // valor base, no se usa directamente
    description: characterDescriptions.rojo,
    ability: {
      name: "Descartar Derecha",
      description: "Al jugar esta carta, descarta la carta a su derecha (si existe) en tu tablero.",
      json: JSON.stringify({
        "trigger": "ON_PLAY_OWN_BOARD",
        "target": "OWN_BOARD",
        "action": "DISCARD_NEIGHBOR",
        "params": {
          "direction": "RIGHT"
        }
      }, null, 2)
    }
  },
  {
    id: 'character-azul',
    kind: 'character',
    label: 'Personaje Azul',
    shortLabel: 'Azul',
    color: 'Azul',
    colorClass: 'bg-sky-500',
    ribbonClass: 'bg-sky-700',
    value: 0,
    description: characterDescriptions.azul,
    ability: {
        name: "Revelar Propia (temporal)",
        description: "Al jugar esta carta, revela una carta al azar de tu propio tablero durante 1 segundo y luego vuelve a ocultarla.",
        json: JSON.stringify({
            "trigger": "ON_PLAY_OWN_BOARD",
            "target": "OWN_BOARD",
            "action": "REVEAL_RANDOM_BRIEFLY",
            "params": {
                "durationMs": 1000
            }
        }, null, 2)
    }
  },
  {
    id: 'character-verde',
    kind: 'character',
    label: 'Personaje Verde',
    shortLabel: 'Verde',
    color: 'Verde',
    colorClass: 'bg-emerald-500',
    ribbonClass: 'bg-emerald-700',
    value: 0,
    description: characterDescriptions.verde,
    ability: {
      name: "Plantar Bomba",
      description: "Al jugar esta carta, planta una bomba oculta en una posición aleatoria del tablero rival.",
      json: JSON.stringify({
          "trigger": "ON_PLAY_OWN_BOARD",
          "target": "RIVAL_BOARD",
          "action": "PLANT_BOMB_RANDOM",
          "params": {
              "bombSource": "PLAYER_DECK_OR_DISCARD"
          }
      }, null, 2)
    }
  },
  {
    id: 'character-amarillo',
    kind: 'character',
    label: 'Personaje Amarillo',
    shortLabel: 'Amarillo',
    color: 'Amarillo',
    colorClass: 'bg-yellow-400',
    ribbonClass: 'bg-yellow-500',
    textColor: 'text-slate-900',
    value: 0,
    description: characterDescriptions.amarillo,
    ability: {
      name: "Mezclar Tablero Rival",
      description: "Al jugar esta carta, mezcla aleatoriamente todas las cartas del tablero del rival.",
      json: JSON.stringify({
        "trigger": "ON_PLAY_OWN_BOARD",
        "target": "RIVAL_BOARD",
        "action": "SHUFFLE_ALL_CARDS"
      }, null, 2)
    },
  },

  // --- BOMBAS Y PODERES ---
  {
    id: "bomb",
    kind: "bomb",
    label: "Bomba",
    shortLabel: "Bomba",
    color: "Negro",
    colorClass: "bg-slate-800",
    ribbonClass: "bg-slate-950",
    value: 0,
    description: "La Bomba destruye las cartas adyacentes que estén boca arriba. Úsala con estrategia para limpiar el tablero.",
  },
  {
    id: "hero",
    kind: "hero",
    label: "Héroe",
    shortLabel: "Héroe",
    color: "Dorado",
    colorClass: "bg-yellow-400",
    ribbonClass: "bg-yellow-500",
    textColor: "text-slate-900",
    value: 6,
    description: "El Héroe es una carta de alto valor. Tendrá habilidades especiales más adelante. Por ahora es una carta clave pero simple.",
  },
  {
    id: "power1",
    kind: "power",
    label: "Poder 1",
    shortLabel: "Poder",
    color: "Morado",
    colorClass: "bg-purple-500",
    ribbonClass: "bg-purple-700",
    value: 0,
    description: "Esta carta es un poder básico. El sistema de poderes está en construcción.",
  },
];
