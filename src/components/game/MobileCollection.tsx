"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  { id: "red", label: "Rojo", color: "bg-red-500" },
  { id: "blue", label: "Azul", color: "bg-blue-500" },
  { id: "green", label: "Verde", color: "bg-emerald-500" },
  { id: "brown", label: "Marrón", color: "bg-amber-700" },
];

type CardKind = "color" | "bomb" | "hero" | "power";

type DeckCard = {
  id: string;
  type: CardKind;
  value: number | string;
};

type DetailCard = {
  id: string;
  kind: CardKind;
  title: string;
  description: string;
  colorClass: string;
  level: number;
  maxLevel: number;
  owned: number;
};

export default function MobileCollection() {
  const [deck] = useState<DeckCard[]>([
    { id: "red", type: "color", value: 1 },
    { id: "blue", type: "color", value: 1 },
    { id: "green", type: "color", value: 1 },
    { id: "brown", type: "color", value: 1 },
    { id: "bomb", type: "bomb", value: 5 },
    { id: "hero", type: "hero", value: 6 },
    { id: "power1", type: "power", value: "P" },
    { id: "power2", type: "power", value: "P" },
  ]);

  const lockedCards = [
    { id: "unknown-1", label: "Carta por descubrir" },
    { id: "special-bomb", label: "Nueva bomba especial" },
    { id: "new-hero", label: "Nuevo héroe" },
    { id: "new-power", label: "Nuevo poder" },
  ];

  const [selected, setSelected] = useState<DetailCard | null>(null);

  const openDetailFromDeck = (card: DeckCard) => {
    switch (card.type) {
      case "color": {
        const colorData = COLORS.find((c) => c.id === card.id);
        if (!colorData) return;
        setSelected({
          id: card.id,
          kind: "color",
          title: `Personaje ${colorData.label}`,
          description:
            "Los personajes de este color van del número 1 al 5. Ideal para probar diferentes combinaciones de mazo.",
          colorClass: colorData.color,
          level: 1,
          maxLevel: 5,
          owned: 1,
        });
        break;
      }
      case "bomb":
        setSelected({
          id: "bomb",
          kind: "bomb",
          title: "Bomba",
          description:
            "Carta de bomba básica. Podrás desbloquear distintos tipos de bombas con efectos especiales.",
          colorClass: "bg-red-600",
          level: 1,
          maxLevel: 1,
          owned: 1,
        });
        break;
      case "hero":
        setSelected({
          id: "hero",
          kind: "hero",
          title: "Héroe",
          description:
            "La carta de héroe es la más valiosa del mazo. Más adelante vas a poder desbloquear héroes alternativos.",
          colorClass: "bg-yellow-400",
          level: 1,
          maxLevel: 1,
          owned: 1,
        });
        break;
      case "power":
        setSelected({
          id: card.id,
          kind: "power",
          title: "Poder 1",
          description:
            "Esta es una carta de poder básica. El sistema de poderes está en construcción.",
          colorClass: "bg-purple-500",
          level: 1,
          maxLevel: 1,
          owned: 1,
        });
        break;
    }
  };

  const openDetailFromCollection = (colorId: string) => {
    const colorData = COLORS.find((c) => c.id === colorId);
    if (!colorData) return;

    setSelected({
      id: colorId,
      kind: "color",
      title: `Personaje ${colorData.label}`,
      description:
        "Los personajes de este color van del número 1 al 5. Ideal para probar diferentes combinaciones de mazo.",
      colorClass: colorData.color,
      level: 1,
      maxLevel: 5,
      owned: 1,
    });
  };

  return (
    <>
      {/* IMPORTANTE: h-full, sin h-screen ni fondo extra */}
      <div className="h-full w-full flex flex-col">
        {/* MAZO */}
        <section className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="comic-title text-white text-lg tracking-[0.18em]">
              Mazo (8 / 8)
            </h2>
            <span className="text-[10px] text-slate-300">
              Toque una carta para ver detalles
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {deck.map((card) => (
              <button
                key={card.id}
                onClick={() => openDetailFromDeck(card)}
                className="focus:outline-none"
              >
                <CardSmall card={card} />
              </button>
            ))}
          </div>
        </section>

        {/* COLECCIÓN */}
        <section className="px-3 pb-24 mt-2 flex-1 overflow-y-auto no-scrollbar">
          <h3 className="comic-title text-white text-base tracking-[0.2em] mb-2">
            Colección
          </h3>

          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => openDetailFromCollection(c.id)}
                className="focus:outline-none"
              >
                <CardLarge color={c} />
              </button>
            ))}

            {lockedCards.map((c) => (
              <LockedSlot key={c.id} label={c.label} />
            ))}
          </div>
        </section>
      </div>

      {/* MODAL DETALLE CARTA */}
      <AnimatePresence>
        {selected && (
          <CardDetailModal card={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function CardSmall({ card }: { card: DeckCard }) {
  const base =
    card.type === "color"
      ? "bg-sky-500"
      : card.type === "bomb"
      ? "bg-red-600"
      : card.type === "hero"
      ? "bg-yellow-400"
      : "bg-purple-500";

  return (
    <div
      className={cn(
        "relative h-16 rounded-xl border-[3px] border-black shadow-[0_4px_0_#020617] flex items-center justify-center font-bold text-white text-xl select-none",
        base
      )}
    >
      <span className="drop-shadow-[0_2px_0_#020617]">{card.value}</span>
    </div>
  );
}

function CardLarge({
  color,
}: {
  color: { id: string; label: string; color: string };
}) {
  return (
    <div
      className={cn(
        "relative h-24 rounded-xl border-[3px] border-black shadow-[0_4px_0_#020617] flex flex-col items-center justify-center text-white font-bold",
        color.color
      )}
    >
      <span className="text-3xl drop-shadow-[0_2px_0_#020617]">1</span>
      <span className="text-[10px] tracking-[0.15em] mt-1 uppercase drop-shadow-[0_2px_0_#020617]">
        {color.label}
      </span>
      <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-black/35 border border-black/60 font-mono">
        1 / 5
      </span>
    </div>
  );
}

function LockedSlot({ label }: { label: string }) {
  return (
    <div className="relative h-24 rounded-xl border-[3px] border-black bg-slate-800 shadow-[0_4px_0_#020617] flex flex-col items-center justify-center opacity-60">
      <Lock className="w-6 h-6 text-slate-300 mb-1" />
      <span className="text-[9px] text-slate-300 text-center px-2">
        {label}
      </span>
    </div>
  );
}

/* ================== MODAL DETALLE ================== */

function CardDetailModal({
  card,
  onClose,
}: {
  card: DetailCard;
  onClose: () => void;
}) {
  const progress = Math.min(
    100,
    Math.round((card.owned / card.maxLevel) * 100)
  );

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-[90%] max-w-md bg-[#0d4b63] rounded-[32px] border-[4px] border-slate-900 shadow-[0_18px_0_#020617] px-5 pt-6 pb-5 text-white"
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-slate-900 border-[3px] border-black flex items-center justify-center shadow-[0_5px_0_#020617]"
        >
          <X className="w-4 h-4 text-slate-100" />
        </button>

        {/* Carta protagonista */}
        <div className="flex justify-center mb-4">
          <motion.div
            className="relative w-40 h-64 rounded-[26px] bg-slate-900 border-[5px] border-black shadow-[0_14px_0_#020617] flex items-center justify-center"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className={cn(
                "w-[82%] h-[86%] rounded-[20px] border-[4px] border-black flex flex-col items-center justify-between py-4 px-3",
                card.colorClass
              )}
            >
              <span className="font-display text-4xl drop-shadow-[0_3px_0_#020617]">
                {card.kind === "power"
                  ? "P"
                  : card.kind === "bomb"
                  ? "5"
                  : card.kind === "hero"
                  ? "6"
                  : "1"}
              </span>
              <span className="text-[11px] text-center leading-tight">
                Ilustración de carta
              </span>
              <span className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-black/60 border border-black text-[11px] tracking-[0.18em] uppercase">
                {card.kind === "color"
                  ? card.title.split(" ")[1]
                  : card.kind === "bomb"
                  ? "Bomba"
                  : card.kind === "hero"
                  ? "Héroe"
                  : "Poder"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Texto y progreso */}
        <h2 className="comic-title text-sm mb-1 text-center">
          {card.title.toUpperCase()}
        </h2>
        <p className="text-[11px] text-slate-100 text-center mb-3">
          {card.description}
        </p>

        <div className="mt-1 mb-3">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-display tracking-[0.18em] text-amber-300 uppercase">
              Nivel {card.level}
            </span>
            <span className="font-mono text-slate-200">
              {card.owned} / {card.maxLevel}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-900 border-[2px] border-black overflow-hidden shadow-[0_2px_0_#020617]">
            <div
              className="h-full bg-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-200">
            Próximamente vas a poder subirla hasta el número 5.
          </p>
        </div>

        <button
          disabled
          className="w-full mt-1 comic-btn comic-btn-primary !bg-amber-300 !text-slate-900 !py-2.5 text-sm disabled:opacity-80 disabled:cursor-not-allowed"
        >
          Subir de nivel
        </button>

        <p className="mt-2 text-[10px] text-slate-200 text-center">
          Función en construcción. Más adelante vas a poder gastar recursos
          para mejorar esta carta.
        </p>
      </motion.div>
    </motion.div>
  );
}
