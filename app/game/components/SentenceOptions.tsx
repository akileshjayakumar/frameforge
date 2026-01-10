"use client";

import React, { useEffect, useState, useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { SentenceOption } from "@/types/game";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";

export function SentenceOptions() {
  const { generateSentenceOptions, addUserSentence, isLoading, gameState } =
    useGame();
  const [options, setOptions] = useState<SentenceOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Track which turn we last fetched options for to prevent duplicate fetches
  const lastFetchedTurnRef = useRef<number | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    // Only fetch if:
    // 1. It's the user's turn
    // 2. We're in playing state
    // 3. We haven't already fetched for this turn
    // 4. No fetch is currently in progress
    const shouldFetch =
      gameState.isUserTurn &&
      gameState.gameStatus === "playing" &&
      lastFetchedTurnRef.current !== gameState.currentTurn &&
      !fetchInProgressRef.current;

    if (!shouldFetch) return;

    const loadOptions = async () => {
      fetchInProgressRef.current = true;
      lastFetchedTurnRef.current = gameState.currentTurn;

      try {
        const generatedOptions = await generateSentenceOptions();
        setOptions(generatedOptions);
        setSelectedId(null);
      } finally {
        fetchInProgressRef.current = false;
      }
    };

    loadOptions();
  }, [gameState.isUserTurn, gameState.currentTurn, gameState.gameStatus, generateSentenceOptions]);

  const handleSelect = async (option: SentenceOption) => {
    if (selectedId) return; // Prevent double clicks
    
    setSelectedId(option.id);
    await addUserSentence(option.text);
    setOptions([]);
  };

  if (!gameState.isUserTurn || gameState.gameStatus !== "playing") {
    return null;
  }

  if (isLoading && options.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <LoadingSpinner
          size="md"
          label="Scouting the scene..."
          hint="Pulling story threads for your next choice"
        />
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {options.map((option, index) => (
        <motion.div
          key={option.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.3 }}
          className="w-full max-w-[500px]"
        >
          <button
            onClick={() => handleSelect(option)}
            disabled={selectedId !== null}
            className="group w-full text-left rounded-xl border-2 border-secondary/30 bg-gradient-to-br from-background/70 via-background/50 to-background/60 hover:border-secondary/70 hover:from-secondary/15 hover:via-secondary/5 hover:to-background/70 hover:shadow-[0_4px_20px_rgba(240,195,106,0.25)] transition-all duration-200 px-4 py-3.5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary via-primary to-secondary text-background flex items-center justify-center font-bold text-sm shadow-[0_4px_12px_rgba(240,195,106,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] flex-shrink-0 group-hover:scale-110 group-hover:shadow-[0_6px_16px_rgba(240,195,106,0.5)] transition-all">
                {index + 1}
              </div>
              <p className="text-sm text-foreground leading-relaxed font-medium group-hover:text-foreground transition-colors flex-1">
                {option.text}
              </p>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
}
