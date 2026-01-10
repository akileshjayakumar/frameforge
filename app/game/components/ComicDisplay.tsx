"use client";

import React from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/Button";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { LogoParticleAnimation } from "@/components/ui/LogoParticleAnimation";
import { motion } from "framer-motion";

export function ComicDisplay() {
  const { gameState, generateComicImage, isLoading, error } = useGame();

  // Show loading indicator during image generation phase
  if (gameState.gameStatus === "generating-image") {
    const progress = Math.min(gameState.imageGenerationProgress, 4);

    return (
      <div className="w-full flex flex-col items-center justify-center py-12 gap-6">
        {/* Creative Logo Particle Animation */}
        <LogoParticleAnimation progress={progress} total={4} />

        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">Rendering storyboard panels</p>
          <p className="text-sm text-foreground/70">
            Generating 4 keyframes with automatic retries. This usually takes a few moments.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-foreground/80 mt-2">
            <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
            <span>
              Progress: {progress}/4
            </span>
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-xl text-center"
          >
            <div className="px-6 py-4 rounded-xl bg-red-900/20 border border-red-500/30">
              <p className="text-foreground font-medium mb-3">{error}</p>
              <p className="text-sm text-foreground/70 mb-4">
                We&apos;ll keep your progress. Try again if the retry stalls.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => generateComicImage()}
                disabled={isLoading}
              >
                Retry panel generation
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  const canShowPanels = ["complete", "video-preferences", "generating-video"].includes(
    gameState.gameStatus
  );

  if (!canShowPanels) {
    return null;
  }

  // Prefer finalImages (full set), fall back to turnImages
  const imagesToShow = gameState.finalImages.length > 0
    ? gameState.finalImages
    : gameState.turnImages;

  if (imagesToShow.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="w-full flex flex-col items-center justify-center p-4 md:p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Simple label */}
      <h3 className="text-lg font-semibold text-foreground mb-6 text-center w-full">
        Storyboarding panels
      </h3>
      
      {/* Images in a flowing grid - no heavy borders, centered */}
      <div className="w-full grid grid-cols-2 gap-3 md:gap-4 justify-items-center">
        {imagesToShow.map((image, idx) => (
          <motion.div
            key={idx}
            className="group relative aspect-video overflow-hidden rounded-lg w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={image}
              alt={`Scene ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Simple number badge */}
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-foreground">
              {idx + 1}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
