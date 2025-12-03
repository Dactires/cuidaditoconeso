
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
  value: number;
  description: string;
  imageUrl?: string;
};

const characterDescriptions = {
  rojo: "Los personajes rojos son conocidos por su agresividad y poder de ataque directo. Ideales para estrategias ofensivas.",
  azul: "Los personajes azules son maestros de la estrategia y el control, a menudo manipulando el tablero a su favor.",
  verde: "Los personajes verdes se centran en el crecimiento y la defensa, acumulando poder de forma sostenida.",
  amarillo: "Los personajes amarillos son versátiles y traen un elemento de sorpresa e ingenio al juego.",
};

const createCharacterCards = (color: string, colorClass: string, ribbonClass: string, textColor?: string): GameCardDef[] => {
    const cards: GameCardDef[] = [];
    for (let i = 1; i <= 5; i++) {
        cards.push({
            id: `character-${color.toLowerCase()}-${i}`,
            kind: 'character',
            label: `Personaje ${color} ${i}`,
            shortLabel: `${color}`,
            color: color,
            colorClass,
            ribbonClass,
            textColor,
            value: i,
            description: characterDescriptions[color.toLowerCase() as keyof typeof characterDescriptions],
            imageUrl: undefined, // Se cargará desde la DB
        });
    }
    return cards;
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
  
  // --- PERSONAJES ---
  ...createCharacterCards('Rojo', 'bg-red-500', 'bg-red-700'),
  ...createCharacterCards('Azul', 'bg-sky-500', 'bg-sky-700'),
  ...createCharacterCards('Verde', 'bg-emerald-500', 'bg-emerald-700'),
  ...createCharacterCards('Amarillo', 'bg-yellow-400', 'bg-yellow-500', 'text-slate-900'),

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
