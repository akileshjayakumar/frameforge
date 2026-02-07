"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { GenrePicker } from "./components/GenrePicker";
import { StoryDisplay } from "./components/StoryDisplay";
import { SentenceOptions } from "./components/SentenceOptions";
import { TurnIndicator } from "./components/TurnIndicator";
import { ComicDisplay } from "./components/ComicDisplay";
import { VideoDisplay } from "./components/VideoDisplay";
import { VideoPreferences } from "./components/VideoPreferences";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TerminalPanel } from "@/components/ui/TerminalPanel";

export default function GamePage() {
  const { 
    gameState, 
    addAiSentence, 
    generateComicImage, 
    resetGame,
    isLoading, 
    error 
  } = useGame();
  const router = useRouter();

  // One-shot guards to prevent repeated operations (dev effects can re-run).
  const comicTriggeredRef = useRef(false);
  const lastAiTurnRef = useRef<number | null>(null);
  const [topicResetCounter, setTopicResetCounter] = useState(0);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [storyboardRequested, setStoryboardRequested] = useState(false);

  // Handle AI turns automatically
  useEffect(() => {
    // Only trigger if:
    // 1. It's AI's turn
    // 2. We're in playing state
    // 3. Turn < 4 (two user + two AI turns)
    // 4. We haven't already triggered for this turn
    const shouldTrigger =
      !gameState.isUserTurn &&
      gameState.gameStatus === "playing" &&
      gameState.currentTurn < 4 &&
      lastAiTurnRef.current !== gameState.currentTurn;

    if (!shouldTrigger) return;

    lastAiTurnRef.current = gameState.currentTurn;

    const timer = setTimeout(() => {
      addAiSentence();
    }, 400); // Reduced from 1000ms for snappier feel

    return () => clearTimeout(timer);
  }, [
    gameState.isUserTurn,
    gameState.gameStatus,
    gameState.currentTurn,
    addAiSentence,
  ]);

  // Reset storyboard request when leaving generation phase
  useEffect(() => {
    if (gameState.gameStatus !== "generating-image") {
      comicTriggeredRef.current = false;
      setStoryboardRequested(false);
    }
  }, [gameState.gameStatus]);

  // Video generation is now user-triggered via VideoPreferences component
  // No automatic video generation - user must click "Generate Video" button

  const isPlaying = gameState.gameStatus === "playing" && gameState.genre;
  const hasImages = gameState.finalImages.length > 0;
  const hasStartedStoryboard =
    storyboardRequested || gameState.imageGenerationProgress > 0;

  const handleReset = () => {
    const confirmed = window.confirm("Start over and pick a new genre?");
    if (!confirmed) return;
    comicTriggeredRef.current = false;
    setStoryboardRequested(false);
    lastAiTurnRef.current = null;
    resetGame();
    setTopicResetCounter((c) => c + 1);
    setResetMessage("Game reset. Pick a new genre.");
    setTimeout(() => setResetMessage(null), 2500);
  };

  const handleStoryboard = async () => {
    if (storyboardRequested || comicTriggeredRef.current) return;
    comicTriggeredRef.current = true;
    setStoryboardRequested(true);
    try {
      await generateComicImage();
    } catch (err) {
      console.error(err);
      comicTriggeredRef.current = false;
      setStoryboardRequested(false);
    }
  };

  return (
    <main className="relative overflow-hidden bg-transparent z-10 flex flex-col pb-8">
      <div className="absolute inset-0 bg-tva-grid opacity-20 pointer-events-none -z-10" />


      {/* Error Alert */}
      {error && (
        <motion.div
          className="tva-alert px-8 py-4 shadow-lg text-center mx-auto max-w-2xl"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-foreground font-medium">{error}</p>
        </motion.div>
      )}

      {/* Genre Selection */}
      {(gameState.gameStatus === "topic-selection" || !gameState.genre) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 py-12 px-6 pb-8 w-full"
        >
          {resetMessage && (
            <div className="px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium">
              {resetMessage}
            </div>
          )}
          <div className="w-full max-w-5xl mx-auto">
            <GenrePicker key={topicResetCounter} />
          </div>
        </motion.div>
      )}

      {/* Active Play - Dead Center Layout */}
      {isPlaying && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 pb-8 w-full">
          {/* Progress Panel - Top, centered */}
          <div className="w-full max-w-[900px] mx-auto">
            <TerminalPanel
              title="Progress"
              padding="md"
            >
              <TurnIndicator />
            </TerminalPanel>
          </div>

          {/* Storyline and Your Turn - Side by Side, centered */}
          <div className="w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-4 items-stretch justify-center">
            {/* Left Side: Storyline */}
            <div className="lg:w-1/2 flex flex-col">
              <TerminalPanel
                title="Storyline"
                padding="md"
                className="h-full min-h-[400px] flex flex-col"
              >
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-350px)] pr-2">
                  <StoryDisplay />
                </div>
              </TerminalPanel>
            </div>

            {/* Right Side: Your Turn Options */}
            <div className="lg:w-1/2 flex flex-col">
              {gameState.isUserTurn ? (
                <TerminalPanel
                  title="Your Turn"
                  padding="md"
                  className="h-full min-h-[400px] flex flex-col"
                >
                  <div className="flex-1 flex items-center justify-center">
                    <SentenceOptions />
                  </div>
                </TerminalPanel>
              ) : isLoading ? (
                <TerminalPanel
                  padding="md"
                  className="h-full min-h-[400px] flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-secondary/20"></div>
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-secondary"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <p className="text-foreground/80 text-sm font-medium">
                      Drafting next scene...
                    </p>
                  </div>
                </TerminalPanel>
              ) : (
                <TerminalPanel
                  title="Waiting"
                  padding="md"
                  className="h-full min-h-[400px] flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 border-2 border-secondary/40 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-secondary/40 animate-pulse" />
                    </div>
                    <p className="text-foreground/70 text-sm">
                      Waiting for your turn...
                    </p>
                  </div>
                </TerminalPanel>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Generation Phase */}
      {gameState.gameStatus === "generating-image" && (
        <>
          {!hasStartedStoryboard && !hasImages ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center w-full min-h-[60vh] px-6 md:px-8 lg:px-12"
            >
              <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center gap-8 md:gap-10">
                <div className="flex flex-col items-center gap-5 md:gap-6 w-full">
                  <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-secondary/70 font-semibold">
                    Storyboard Ready
                  </p>
                  <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-display font-bold text-foreground leading-tight whitespace-nowrap w-full">
                    Gemini has the script. Kick off the storyboard?
                  </h2>
                  <p className="text-sm md:text-base lg:text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
                    We&apos;ll render the six keyframes once you give the go-ahead.
                    This keeps your turn snappy and avoids surprise image spins.
                  </p>
                </div>
                <div className="flex items-center justify-center w-full pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStoryboard}
                    disabled={storyboardRequested || isLoading}
                    className="min-w-[220px]"
                  >
                    {storyboardRequested || isLoading ? "Storyboarding..." : "Let’s storyboard!"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-4 pb-8 w-full"
            >
              <div className="w-full max-w-4xl mx-auto">
                <ComicDisplay />
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Video Preferences Phase - Side by side: Panels and Video Settings */}
      {gameState.gameStatus === "video-preferences" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex items-center justify-center gap-8 p-6 pb-8 w-full"
        >
          <div className="w-full max-w-6xl flex items-center justify-center gap-8">
            {/* Left: Panels */}
            <div className="flex-1 min-w-0 flex items-center justify-center">
              <ComicDisplay />
            </div>

            {/* Right: Video Settings */}
            <div className="flex-1 min-w-0 max-w-md flex items-center justify-center">
              <VideoPreferences />
            </div>
          </div>
        </motion.div>
      )}

      {/* Video Generation Phase */}
      {gameState.gameStatus === "generating-video" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col items-center justify-center gap-4 p-4 pb-8 w-full"
        >
          <div className="w-full max-w-4xl mx-auto">
            <VideoDisplay />
          </div>
        </motion.div>
      )}

      {/* Final Story & Comic */}
      {gameState.gameStatus === "complete" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 p-4 pb-8 w-full"
        >
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6">
            <ComicDisplay />
            <VideoDisplay />
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/")}
              className="min-w-[280px]"
            >
              Return Home
            </Button>
          </div>
        </motion.div>
      )}
    </main>
  );
}
