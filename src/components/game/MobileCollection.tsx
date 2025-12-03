"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  { id: "red", label: "Rojo", color: "bg-red-500" },
  { id: "blue", label: "Azul", color: "bg-blue-500" },
  { id: "green", label: "Verde", color: "bg-green-500" },
  { id: "brown", label: "Marrón", color: "bg-amber-700" },
];

export default function MobileCollection() {
  const [deck, setDeck] = useState([
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
    { id: "color-red-2", type: "color" },
    { id: "color-blue-2", type: "color" },
    { id: "mega-bomb", type: "special" },
    { id: "ultra-power", type: "special" },
  ];

  return (
    <div className="h-screen max-w-md mx-auto flex flex-col bg-[#05202e]">
      {/* MAZO */}
      <section className="px-3 pt-3 pb-2">
        <h2 className="comic-title text-white text-lg mb-1 tracking-[0.18em]">
          Mazo (8 / 8)
        </h2>

        <div className="grid grid-cols-4 gap-2">
          {deck.map((card) => (
            <CardSmall key={card.id} card={card} />
          ))}
        </div>
      </section>

      {/* COLECCIÓN */}
      <section className="px-3 pb-24 mt-2 flex-1 overflow-y-auto no-scrollbar">
        <h3 className="comic-title text-white text-base tracking-[0.2em] mb-2">
          Colección
        </h3>

        <div className="grid grid-cols-4 gap-2">
          {/* Cartas desbloqueadas */}
          {COLORS.map((c) => (
            <CardLarge key={c.id} color={c} unlocked />
          ))}

          {/* Cartas bloqueadas */}
          {lockedCards.map((c) => (
            <CardLarge key={c.id} locked />
          ))}
        </div>
      </section>
    </div>
  );
}

function CardSmall({ card }: { card: { id: string; type: string; value: number | string }}) {
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

function CardLarge({ color, locked }: { color?: { id: string, label: string, color: string }, locked?: boolean }) {
  if (locked) {
    return (
      <div className="relative h-24 rounded-xl border-[3px] border-black bg-slate-800 shadow-[0_4px_0_#020617] flex items-center justify-center opacity-40">
        <Lock className="w-6 h-6 text-slate-300" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-24 rounded-xl border-[3px] border-black shadow-[0_4px_0_#020617] flex flex-col items-center justify-center text-white font-bold",
        color?.color
      )}
    >
      <span className="text-3xl drop-shadow-[0_2px_0_#020617]">1</span>
      <span className="text-[10px] tracking-[0.15em] mt-1 uppercase drop-shadow-[0_2px_0_#020617]">
        {color?.label}
      </span>
    </div>
  );
}
