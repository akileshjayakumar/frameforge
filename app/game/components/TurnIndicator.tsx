"use client";

import React from "react";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";

export function TurnIndicator() {
  const { gameState, isLoading } = useGame();

  if (gameState.gameStatus !== "playing") {
    return null;
  }

  const totalTurns = 4;
  const currentTurn = gameState.currentTurn;
  const isUserTurn = gameState.isUserTurn;

  return (
    <div className="w-full flex flex-col gap-3 items-center">
      <motion.div
        className={`text-lg font-bold ${
          isUserTurn ? "text-teal-400" : "text-amber-300"
        }`}
        animate={!isUserTurn && isLoading ? { opacity: [0.6, 1, 0.6] } : {}}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        {isUserTurn ? "Your Turn" : "Gemini Thinking..."}
      </motion.div>

      <div className="relative w-full max-w-[500px] h-3 rounded-full overflow-hidden bg-foreground/10 border-2 border-secondary/30">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary via-primary to-accent rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentTurn / totalTurns) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-secondary/25 to-secondary/10 border border-secondary/40 text-foreground text-sm font-bold">
          {currentTurn}
        </span>
        <span className="text-foreground/30 font-medium">/</span>
        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-foreground/10 to-foreground/5 border border-foreground/20 text-foreground/70 text-sm font-medium">
          {totalTurns}
        </span>
      </div>
    </div>
  );
}
