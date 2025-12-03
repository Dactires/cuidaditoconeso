"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type CardKind = "color" | "bomb" | "hero" | "power";

type ColorId = "red" | "blue" | "green" | "brown";

type GameCardDef = {
  id: string;
  kind: CardKind;
  label: string;
  shortLabel: string;
  colorClass: string;   // bg-*
  ribbonClass: string;  // bg-*
  textColor?: string;
  maxValue?: number;
  description: string;
};

const BASE_CARDS: GameCardDef[] = [
  {
    id: "color-red",
    kind: "color",
    label: "Personaje Rojo",
    shortLabel: "Rojo",
    colorClass: "bg-red-500",
    ribbonClass: "bg-red-700",
    maxValue: 5,
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
    maxValue: 5,
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
    maxValue: 5,
    description:
      "Los personajes verdes van del número 1 al 5. Ideal para probar diferentes combinaciones de mazo.",
  },
  {
    id: "color-brown",
    kind: "color",
    label: "Personaje Marrón",
    shortLabel: "Marrón",
    colorClass: "bg-amber-700",
    ribbonClass: "bg-amber-800",
    maxValue: 5,
    description:
      "Los personajes marrones también llegan hasta el número 5. Más adelante vas a poder desbloquearlos.",
  },
  {
    id: "bomb",
    kind: "bomb",
    label: "Bomba",
    shortLabel: "Bomba",
    colorClass: "bg-red-600",
    ribbonClass: "bg-red-800",
    description:
      "La Bomba es la carta 5 del mazo. Toda la mecánica de bombas está en construcción, pero ya forma parte del mazo base.",
  },
  {
    id: "hero",
    kind: "hero",
    label: "Héroe",
    shortLabel: "Héroe",
    colorClass: "bg-yellow-400",
    ribbonClass: "bg-yellow-500",
    textColor: "text-slate-900",
    description:
      "El Héroe es la carta 6 del mazo. Tendrá habilidades especiales más adelante. Por ahora es una carta clave pero simple.",
  },
  {
    id: "power1",
    kind: "power",
    label: "Poder 1",
    shortLabel: "Poder",
    colorClass: "bg-purple-500",
    ribbonClass: "bg-purple-700",
    description:
      "Los poderes reemplazan a los hechizos. Esta carta es un poder básico. Sistema de poderes en construcción.",
  },
  {
    id: "power2",
    kind: "power",
    label: "Poder 2",
    shortLabel: "Poder",
    colorClass: "bg-indigo-500",
    ribbonClass: "bg-indigo-700",
    description:
      "Segundo slot de Poder del mazo. Más adelante vas a poder cambiar qué poder usás en cada espacio.",
  },
];

const LOCKED_PLACEHOLDERS = [
  "Carta por descubrir",
  "Nueva bomba especial",
  "Nuevo héroe",
  "Nuevo poder",
];

type SelectedCard = {
  card: GameCardDef;
  from: "deck" | "collection";
} | null;

export default function MobileCollection() {
  const [selected, setSelected] = useState<SelectedCard>(null);

  // Mazo fijo de 8 cartas (1 de cada color + bomb + hero + 2 poderes)
  const deck = BASE_CARDS;

  // Colección muestra primero los 4 colores base, luego 4 slots bloqueados
  const collectionUnlocked = BASE_CARDS.slice(0, 4);
  const collectionLocked = LOCKED_PLACEHOLDERS;

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* MAZO */}
      <section className="px-3 pt-1 pb-2">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="comic-title text-white text-sm tracking-[0.22em]">
            MAZO (8 / 8)
          </h2>
          <span className="text-[10px] text-slate-300 font-mono">
            Toque una carta para ver detalles
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {deck.map((card) => (
            <DeckCard
              key={card.id}
              card={card}
              isSelected={selected?.card.id === card.id}
              onClick={() => setSelected({ card, from: "deck" })}
            />
          ))}
        </div>
      </section>

      {/* PANEL DETALLE (tipo Clash Royale, arriba de la colección) */}
      <AnimatePresence>
        {selected && (
          <motion.section
            key={selected.card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-2"
          >
            <div className="comic-card bg-[#0b3b4e] border-[3px] border-slate-900 shadow-[0_6px_0_#020617] px-3 py-2 flex gap-3">
              <div className="w-16">
                <DeckCard card={selected.card} smallStatic />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-1 mb-0.5">
                  <Info className="w-3.5 h-3.5 text-amber-300" />
                  <span className="comic-title text-xs text-white">
                    {selected.card.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-100 leading-snug">
                  {selected.card.description}
                </p>
                {selected.card.kind === "color" && selected.card.maxValue && (
                  <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-300 border-[2px] border-black text-[9px] font-display tracking-[0.18em] uppercase text-slate-900 shadow-[0_2px_0_#020617]">
                    Llega hasta el número {selected.card.maxValue}
                  </span>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* COLECCIÓN */}
      <section className="px-3 pb-20 pt-1 flex-1 overflow-y-auto no-scrollbar">
        <h3 className="comic-title text-white text-sm tracking-[0.2em] mb-2">
          COLECCIÓN
        </h3>

        <div className="grid grid-cols-4 gap-2">
          {collectionUnlocked.map((card) => (
            <CollectionCard
              key={card.id}
              card={card}
              onClick={() => setSelected({ card, from: "collection" })}
            />
          ))}

          {collectionLocked.map((label, idx) => (
            <LockedCard key={idx} label={label} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────
   COMPONENTES VISUALES
   ───────────────────── */

function DeckCard({
  card,
  isSelected,
  onClick,
  smallStatic,
}: {
  card: GameCardDef;
  isSelected?: boolean;
  onClick?: () => void;
  smallStatic?: boolean;
}) {
  const value =
    card.kind === "color"
      ? 1
      : card.kind === "bomb"
      ? 5
      : card.kind === "hero"
      ? 6
      : "P";

  const baseTextColor =
    card.textColor ?? (card.kind === "hero" ? "text-slate-900" : "text-white");

  const containerClasses = smallStatic ? "h-16" : "h-18 min-h-[70px]";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95, y: 1 }}
      onClick={onClick}
      className={cn(
        "relative w-full select-none",
        containerClasses,
        "rounded-2xl border-[3px] border-black shadow-[0_4px_0_#020617] overflow-hidden bg-slate-900"
      )}
    >
      <div
        className={cn(
          "absolute inset-[3px] rounded-[14px] border-[2px] border-black flex flex-col items-center justify-between py-1.5",
          card.colorClass
        )}
      >
        {/* Número grande */}
        <span
          className={cn(
            "text-2xl font-display drop-shadow-[0_2px_0_#020617] leading-none",
            baseTextColor
          )}
        >
          {value}
        </span>

        {/* Cinta inferior con tipo */}
        <div
          className={cn(
            "px-1.5 py-0.5 rounded-full border-[2px] border-black shadow-[0_2px_0_#020617] text-[9px] font-display tracking-[0.18em] uppercase",
            card.ribbonClass,
            baseTextColor
          )}
        >
          {card.kind === "color"
            ? card.shortLabel
            : card.kind === "bomb"
            ? "BOMBA"
            : card.kind === "hero"
            ? "HÉROE"
            : "PODER"}
        </div>
      </div>

      {isSelected && (
        <motion.div
          layoutId={`deck-card-glow-${card.id}`}
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-amber-300/80 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
        />
      )}
    </motion.button>
  );
}

function CollectionCard({
  card,
  onClick,
}: {
  card: GameCardDef;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96, y: 1 }}
      onClick={onClick}
      className="relative h-28 w-full rounded-2xl border-[3px] border-black shadow-[0_4px_0_#020617] overflow-hidden bg-slate-900"
    >
      <div
        className={cn(
          "absolute inset-[4px] rounded-[14px] border-[2px] border-black flex flex-col items-center justify-between py-2",
          card.colorClass
        )}
      >
        <span className="text-3xl font-display text-white drop-shadow-[0_2px_0_#020617] leading-none">
          1
        </span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-display tracking-[0.18em] uppercase drop-shadow-[0_1px_0_#020617]">
            {card.shortLabel}
          </span>
          <span className="text-[9px] bg-slate-900/70 px-2 py-0.5 rounded-full border border-black font-mono">
            1 / 5
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function LockedCard({ label }: { label: string }) {
  return (
    <div className="relative h-28 w-full rounded-2xl border-[3px] border-black bg-slate-900 shadow-[0_4px_0_#020617] flex flex-col items-center justify-center gap-1 opacity-60">
      <div className="w-9 h-9 rounded-xl bg-slate-800 border-[3px] border-black flex items-center justify-center">
        <Lock className="w-5 h-5 text-slate-300" />
      </div>
      <span className="text-[9px] text-slate-400 text-center px-1">
        {label}
      </span>
    </div>
  );
}
