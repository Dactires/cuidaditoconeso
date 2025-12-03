"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CardKind = "color" | "bomb" | "hero" | "power";

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
      "Esta carta es un poder básico. El sistema de poderes está en construcción.",
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

type SelectedCard = GameCardDef | null;

export default function MobileCollection() {
  const [selected, setSelected] = useState<SelectedCard>(null);

  const deck = BASE_CARDS;
  const collectionUnlocked = BASE_CARDS.slice(0, 4);
  const collectionLocked = LOCKED_PLACEHOLDERS;

  return (
    <div className="flex flex-col h-full bg-transparent relative">
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
              isSelected={selected?.id === card.id}
              onClick={() => setSelected(card)}
            />
          ))}
        </div>
      </section>

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
              onClick={() => setSelected(card)}
            />
          ))}

          {collectionLocked.map((label, idx) => (
            <LockedCard key={idx} label={label} />
          ))}
        </div>
      </section>

      {/* MODAL FLOANTE DE DETALLE */}
      <AnimatePresence>
        {selected && (
          <CardDetailModal
            card={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────
   MODAL DE DETALLE
   ───────────────────── */

function CardDetailModal({
  card,
  onClose,
}: {
  card: GameCardDef;
  onClose: () => void;
}) {
  // Por ahora todo nivel 1, progreso 1/5 si es color
  const currentLevel = card.kind === "color" ? 1 : 1;
  const maxLevel = card.kind === "color" ? 5 : 1;
  const hasLevels = card.kind === "color";

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* FONDO OSCURO */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* CONTENEDOR */}
      <motion.div
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 10, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative z-50 w-full max-w-sm"
      >
        <div className="comic-card bg-[#0b3b4e] border-[4px] border-slate-900 shadow-[0_10px_0_#020617] px-4 pt-3 pb-4">
          {/* BOTÓN CERRAR */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 rounded-full bg-slate-900 border-[3px] border-black w-8 h-8 flex items-center justify-center shadow-[0_4px_0_#020617] text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-3">
            {/* Carta grande */}
            <div className="w-24 shrink-0">
              <DeckCard card={card} smallStatic />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Info className="w-4 h-4 text-amber-300" />
                <h2 className="comic-title text-sm text-white">
                  {card.label}
                </h2>
              </div>
              <p className="text-[11px] text-slate-100 leading-snug mt-1">
                {card.description}
              </p>

              {/* NIVEL / PROGRESO */}
              {hasLevels && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="comic-title text-[10px] text-amber-300">
                      NIVEL {currentLevel}
                    </span>
                    <span className="text-[10px] text-slate-100 font-mono">
                      {currentLevel} / {maxLevel}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-900 border-[2px] border-black overflow-hidden shadow-[0_2px_0_#020617]">
                    <div className="h-full w-1/5 bg-emerald-400" />
                  </div>
                  <span className="block mt-1 text-[10px] text-slate-300">
                    Próximamente vas a poder subirla hasta el número {maxLevel}.
                  </span>
                </div>
              )}

              {!hasLevels && (
                <span className="mt-2 text-[10px] text-slate-200">
                  Esta carta todavía no tiene sistema de niveles, pero ya forma
                  parte del mazo base.
                </span>
              )}
            </div>
          </div>

          {/* BOTÓN SUBIR DE NIVEL */}
          <div className="mt-3 flex flex-col gap-1">
            <button
              disabled
              className="comic-btn comic-btn-primary !w-full !justify-center !py-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Subir de nivel
            </button>
            <span className="text-[10px] text-center text-slate-300">
              Función en construcción. Más adelante vas a poder gastar recursos
              para mejorar esta carta.
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────
   CARTAS
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
      whileTap={{ scale: onClick ? 0.95 : 1, y: onClick ? 1 : 0 }}
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
        <span
          className={cn(
            "text-2xl font-display drop-shadow-[0_2px_0_#020617] leading-none",
            baseTextColor
          )}
        >
          {value}
        </span>

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
