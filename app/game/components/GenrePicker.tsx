"use client";

import React, { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/Button";
import { Shield, Sparkles, Skull, Rocket } from "lucide-react";
import { motion } from "framer-motion";

// 4 genres with simple, clean styling
const PRESET_GENRES = [
  {
    value: "sci-fi",
    label: "Cyberpunk Noir",
    hint: "Neon alleys & hard light",
    icon: Sparkles,
    color: "cyan",
    borderColor: "border-cyan-500",
    iconBg: "bg-cyan-500",
  },
  {
    value: "detective",
    label: "Space Opera",
    hint: "Starships & intrigue",
    icon: Rocket,
    color: "blue",
    borderColor: "border-blue-500",
    iconBg: "bg-blue-500",
  },
  {
    value: "horror",
    label: "Eclipse Horror",
    hint: "Atmospheric dread",
    icon: Skull,
    color: "red",
    borderColor: "border-red-600",
    iconBg: "bg-red-600",
  },
  {
    value: "superhero",
    label: "Vigilante Pulse",
    hint: "High stakes, bold heroes",
    icon: Shield,
    color: "orange",
    borderColor: "border-orange-500",
    iconBg: "bg-orange-500",
  },
];

export function GenrePicker() {
  const { selectGenre, isLoading } = useGame();
  const [customGenre, setCustomGenre] = useState("");

  const handleSelect = (genre: string) => {
    if (isLoading) return;
    selectGenre(genre);
  };

  const handleAddCustom = () => {
    const trimmed = customGenre.trim();
    if (!trimmed) return;
    handleSelect(trimmed);
  };

  return (
    <div className="w-full flex flex-col items-center gap-12 px-6 py-8">
      {/* Title only - removed subtitle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Choose Genre
        </h2>
      </motion.div>

      {/* 4 Genres Side-by-Side - Simple Design with better spacing */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRESET_GENRES.map((genre, index) => {
          const Icon = genre.icon;
          return (
            <motion.button
              key={genre.value}
              onClick={() => handleSelect(genre.value)}
              disabled={isLoading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group rounded-xl p-6 border-2 ${genre.borderColor} bg-background/40 hover:bg-background/60 transition-colors`}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Simple icon */}
                <div className={`w-14 h-14 rounded-lg ${genre.iconBg} text-white flex items-center justify-center`}>
                  <Icon className="w-7 h-7" />
                </div>
                
                {/* Simple text */}
                <div className="text-center">
                  <h3 className={`text-base font-semibold text-foreground`}>
                    {genre.label}
                  </h3>
                  <p className="text-foreground/50 text-xs mt-2">
                    {genre.hint}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Genre Input - Simplified */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-md flex flex-col items-center gap-4 pt-4"
      >
        <input
          type="text"
          aria-label="Custom genre"
          placeholder="Or enter a custom genre..."
          value={customGenre}
          onChange={(e) => setCustomGenre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
          className="w-full rounded-xl border-2 border-secondary/30 bg-background/60 px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-secondary/60 focus:border-secondary/60 transition-all"
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleAddCustom}
          disabled={isLoading}
          className="w-full"
        >
          Start Story
        </Button>
      </motion.div>
    </div>
  );
}
