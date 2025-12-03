
export type CardKind = "character" | "bomb" | "hero" | "power" | "back";

export type GameCardDef = {
  id: string;
  kind: CardKind;
  label: string;
  shortLabel: string;
  color: string;
  colorClass: string;
  ribbonClass: string;
  textColor?: string;
  value: number; // For characters, this is a base value or can be ignored if values are 1-5
  description: string;
  imageUrl?: string;
};

const characterDescriptions = {
  rojo: "Los personajes rojos son conocidos por su agresividad y poder de ataque directo. Ideales para estrategias ofensivas.",
  azul: "Los personajes azules son maestros de la estrategia y el control, a menudo manipulando el tablero a su favor.",
  verde: "Los personajes verdes se centran en el crecimiento y la defensa, acumulando poder de forma sostenida.",
  amarillo: "Los personajes amarillos son versátiles y traen un elemento de sorpresa e ingenio al juego.",
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
  {
    id: "power2",
    kind: "power",
    label: "Poder 2",
    shortLabel: "Poder",
    color: "Indigo",
    colorClass: "bg-indigo-500",
    ribbonClass: "bg-indigo-700",
    value: 0,
    description: "Segundo slot de Poder del mazo. Más adelante vas a poder cambiar qué poder usás en cada espacio.",
  },
];
