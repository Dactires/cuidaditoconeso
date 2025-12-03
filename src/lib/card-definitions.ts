
export type CardKind = "color" | "bomb" | "hero" | "power";

export type GameCardDef = {
  id: string;
  kind: CardKind;
  label: string;
  shortLabel: string;
  colorClass: string;
  ribbonClass: string;
  textColor?: string;
  value: number | string;
  description: string;
  imageUrl?: string;
};

export const CARD_DEFINITIONS: GameCardDef[] = [
  {
    id: "color-red",
    kind: "color",
    label: "Personaje Rojo",
    shortLabel: "Rojo",
    colorClass: "bg-red-500",
    ribbonClass: "bg-red-700",
    value: 1,
    description:
      "Los personajes rojos van del número 1 al 5 en el mazo. Por ahora solo está disponible el nivel 1.",
  },
  {
    id: "color-blue",
    kind: "color",
    label: "Personaje Azul",
    shortLabel: "Azul",
    colorClass: "bg-sky-500",
    ribbonClass: "bg-sky-700",
    value: 1,
    description:
      "Los personajes azules van del número 1 al 5 en el mazo. Próximamente vas a poder subirlos de nivel.",
  },
  {
    id: "color-green",
    kind: "color",
    label: "Personaje Verde",
    shortLabel: "Verde",
    colorClass: "bg-emerald-500",
    ribbonClass: "bg-emerald-700",
    value: 1,
    description:
      "Los personajes verdes van del número 1 al 5. Ideal para probar diferentes combinaciones de mazo.",
  },
  {
    id: "color-amarillo",
    kind: "color",
    label: "Personaje Amarillo",
    shortLabel: "Amarillo",
    colorClass: "bg-amber-700",
    ribbonClass: "bg-amber-800",
    value: 1,
    description:
      "Los personajes amarillos también llegan hasta el número 5. Más adelante vas a poder desbloquearlos.",
  },
  {
    id: "bomb",
    kind: "bomb",
    label: "Bomba",
    shortLabel: "Bomba",
    colorClass: "bg-red-600",
    ribbonClass: "bg-red-800",
    value: 5,
    description:
      "La Bomba es una carta clave. Toda la mecánica de bombas está en construcción, pero ya forma parte del mazo base.",
  },
  {
    id: "hero",
    kind: "hero",
    label: "Héroe",
    shortLabel: "Héroe",
    colorClass: "bg-yellow-400",
    ribbonClass: "bg-yellow-500",
    textColor: "text-slate-900",
    value: 6,
    description:
      "El Héroe es la carta de más valor. Tendrá habilidades especiales más adelante. Por ahora es una carta clave pero simple.",
  },
  {
    id: "power1",
    kind: "power",
    label: "Poder 1",
    shortLabel: "Poder",
    colorClass: "bg-purple-500",
    ribbonClass: "bg-purple-700",
    value: "P",
    description:
      "Esta carta es un poder básico. El sistema de poderes está en construcción.",
  },
  {
    id: "power2",
    kind: "power",
    label: "Poder 2",
    shortLabel: "Poder",
    colorClass: "bg-indigo-500",
    ribbonClass: "bg-indigo-700",
    value: "P",
    description:
      "Segundo slot de Poder del mazo. Más adelante vas a poder cambiar qué poder usás en cada espacio.",
  },
];
