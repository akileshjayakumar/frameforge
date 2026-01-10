"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { useGame } from "@/contexts/GameContext";

export default function Home() {
  const router = useRouter();
  const { gameState, resetGame } = useGame();

  return (
    <main className="w-full flex flex-col items-center justify-center px-6 py-8 md:py-12 relative overflow-hidden bg-transparent">
      <div className="absolute inset-0 bg-tva-grid opacity-10 pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl">
        <div className="flex flex-col items-center text-center gap-8">
          {/* Hero Section */}
          <div className="flex flex-col items-center gap-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-linear-to-r from-foreground via-primary/80 to-secondary/80 drop-shadow-[0_5px_30px_rgba(0,0,0,0.35)]"
            >
              FrameForge
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-base md:text-lg text-foreground/65 max-w-2xl leading-relaxed font-normal"
            >
              Engage in a high-stakes narrative collaboration with{" "}
              <span className="inline-flex items-center gap-2">
                <img
                  src="/gemini-icon.svg"
                  alt="Gemini logo"
                  className="w-5 h-5 rounded-sm"
                />
                <a
                  href="https://ai.google.dev/gemini-api/docs/gemini-3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors font-medium underline decoration-secondary/30 underline-offset-4 hover:decoration-primary"
                >
                  Gemini 3
                </a>
              </span>
              <br />
              <span
                style={{
                  display: "inline-block",
                  paddingTop: "0.75em",
                  paddingBottom: "0.5em",
                }}
              >
                Draft, diverge, and manifest your story into a comic strip while
                nano bananas drift in the background.
              </span>
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                resetGame();
                router.push("/game");
              }}
              className="min-w-[220px] text-base py-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              Start New Story
            </Button>
            {gameState.gameStatus !== "topic-selection" && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.push("/game")}
                className="min-w-[220px] border-secondary/20 hover:border-secondary/40 py-4"
              >
                Continue Story
              </Button>
            )}
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-6">
            {[
              {
                title: "SELECT TOPIC",
                desc: "Choose from AI-generated sci-fi story starters.",
                code: "01",
              },
              {
                title: "BUILD STORY",
                desc: "Challenge the AI in a turn-based writing duel.",
                code: "02",
              },
              {
                title: "SEE IT COME ALIVE",
                desc: "Visualize the final narrative as a comic panels/short film.",
                code: "03",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                className="flex flex-col items-center text-center gap-2 p-5 rounded-lg border border-secondary/10 bg-background/30 backdrop-blur-sm hover:border-secondary/30 hover:bg-background/50 transition-all duration-300 group"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
              >
                <div className="text-4xl font-display font-black text-secondary/20 group-hover:text-secondary/40 transition-colors">
                  {item.code}
                </div>
                <h3 className="text-sm font-display font-bold text-foreground tracking-wider uppercase">
                  {item.title}
                </h3>
                <div className="h-px w-12 bg-linear-to-r from-transparent via-secondary/30 to-transparent" />
                <p className="text-foreground/50 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
