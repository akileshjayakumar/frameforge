"use client";

import React from "react";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";

export function StoryDisplay() {
  const { gameState } = useGame();

  if (!gameState.genre && !gameState.topic && gameState.story.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-6 py-2">
      {/* Simple progress indicator */}
      {gameState.story.length > 0 && (
        <div className="flex items-center justify-center gap-2 pb-2">
          <div className="text-xs text-foreground/50 font-medium">
            Turn {gameState.story.length} of 4
          </div>
        </div>
      )}

      {/* Story turns - Clean and simple */}
      <div className="flex flex-col gap-4 w-full">
        {gameState.story.map((turn, idx) => (
          <motion.div
            key={turn.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="w-full"
          >
            <div className="flex flex-col gap-2">
              {/* Simple author label */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    turn.author === "ai"
                      ? "text-amber-400"
                      : "text-teal-400"
                  }`}
                >
                  {turn.author === "ai" ? "AI" : "You"}
                </span>
                <div className="flex-1 h-px bg-tva-border/30" />
              </div>

              {/* Clean message bubble */}
              <div className="pl-4">
                <p className="text-sm md:text-base leading-relaxed text-foreground/90">
                  {turn.content}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {gameState.story.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/50 text-sm">
            Your story will appear here
          </p>
        </div>
      )}
    </div>
  );
}
