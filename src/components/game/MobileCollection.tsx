
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_DEFINITIONS, GameCardDef } from "@/lib/card-definitions";

const LOCKED_PLACEHOLDERS = [
  "Carta por descubrir",
  "Nueva bomba especial",
  "Nuevo héroe",
  "Nuevo poder",
];

type SelectedCard = GameCardDef | null;

export default function MobileCollection() {
  const [selected, setSelected] = useState<SelectedCard>(null);

  const deck = CARD_DEFINITIONS.filter(def => def.kind === 'character' || def.kind === 'bomb' || def.kind === 'hero' || def.kind === 'power');
  const collectionUnlocked = CARD_DEFINITIONS.filter(c => c.kind === "character");
  const collectionLocked = LOCKED_PLACEHOLDERS;

  return (
    <div className="flex flex-col h-full bg-transparent relative no-scrollbar">
      {/* MAZO */}
      <section className="px-3 pt-1 pb-2">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="comic-title text-white text-sm tracking-[0.22em]">
            MAZO ({deck.length} / {deck.length})
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
  const currentLevel = card.kind === "character" ? 1 : 1;
  const maxLevel = card.kind === "character" ? 5 : 1;
  const hasLevels = card.kind === "character";

  const ribbonText =
    card.kind === "character"
      ? card.shortLabel
      : card.kind === "bomb"
      ? "BOMBA"
      : card.kind === "hero"
      ? "HÉROE"
      : "PODER";

  const baseTextColor =
    card.textColor ?? (card.kind === "hero" ? "text-slate-900" : "text-white");

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fondo oscuro */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Contenedor */}
      <motion.div
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 10, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative z-50 w-full max-w-md"
      >
        <div className="comic-card bg-[#0b3b4e] border-[4px] border-slate-900 shadow-[0_10px_0_#020617] px-4 pt-4 pb-5">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 rounded-full bg-slate-900 border-[3px] border-black w-8 h-8 flex items-center justify-center shadow-[0_4px_0_#020617] text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>

          {/* CARTA PROTAGONISTA */}
          <div className="flex flex-col items-center text-center gap-4 md:gap-5">
            <div className="mx-auto mb-4 md:mb-6 w-40 md:w-56">
              <div className="relative w-full aspect-square rounded-[24px] bg-slate-900 border-[6px] border-black shadow-[0_14px_0_#020617,0_0_30px_rgba(0,0,0,0.7)] overflow-hidden flex items-center justify-center">
                <div
                  className={cn(
                    "absolute inset-0",
                    card.colorClass
                  )}
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      "font-display text-5xl md:text-6xl text-white drop-shadow-[0_3px_0_#020617]",
                      baseTextColor
                    )}
                  >
                    {card.value}
                  </span>

                  <span className="mt-2 text-[12px] md:text-sm uppercase tracking-[0.18em] bg-black/70 px-4 py-1 rounded-full">
                    {ribbonText}
                  </span>
                </div>
              </div>
            </div>

            {/* TÍTULO + TEXTO */}
            <div className="w-full text-center mt-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Info className="w-4 h-4 text-amber-300" />
                <h2 className="comic-title text-sm sm:text-base text-white">
                  {card.label}
                </h2>
              </div>
              <p className="text-[11px] sm:text-[12px] text-slate-100 leading-snug max-w-sm mx-auto">
                {card.description}
              </p>
            </div>

            {/* NIVEL / PROGRESO */}
            <div className="w-full mt-2">
              {hasLevels ? (
                <>
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
                </>
              ) : (
                <span className="text-[10px] text-slate-200">
                  Esta carta todavía no tiene sistema de niveles, pero ya forma
                  parte del mazo base.
                </span>
              )}
            </div>

            {/* BOTÓN SUBIR DE NIVEL */}
            <div className="w-full mt-3 flex flex-col gap-1">
              <button
                disabled
                className="comic-btn comic-btn-primary !w-full !justify-center !py-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                SUBIR DE NIVEL
              </button>
              <span className="text-[10px] text-center text-slate-300">
                Función en construcción. Más adelante vas a poder gastar recursos
                para mejorar esta carta.
              </span>
            </div>
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
          {card.value}
        </span>

        <div
          className={cn(
            "px-1.5 py-0.5 rounded-full border-[2px] border-black shadow-[0_2px_0_#020617] text-[9px] font-display tracking-[0.18em] uppercase",
            card.ribbonClass,
            baseTextColor
          )}
        >
          {card.kind === "character"
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
          {card.value}
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
