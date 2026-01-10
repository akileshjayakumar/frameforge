"use client";

import React, { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { TopicOption } from "@/types/game";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";

import { TimelineVisualizer } from "./TimelineVisualizer";

export function TopicSelector() {
  const { generateTopics, selectTopic, isLoading } = useGame();
  const [topics, setTopics] = useState<TopicOption[]>([]);

  useEffect(() => {
    const loadTopics = async () => {
      const generatedTopics = await generateTopics();
      setTopics(generatedTopics);
    };
    loadTopics();
  }, [generateTopics]);

  if (isLoading && topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner
          size="lg"
          label="Generating story ideas..."
          hint="Calibrating branches"
        />
      </div>
    );
  }

  return (
    <section
      className="w-full flex flex-col items-center justify-center gap-8"
      aria-label="Topic selection"
    >
      <div className="text-center space-y-2 px-6 max-w-3xl">
        <h2 className="text-4xl md:text-5xl font-display font-black text-foreground tracking-tight uppercase leading-tight">
          Select a Topic
        </h2>
        <p className="text-foreground/75 text-base md:text-lg font-medium mx-auto">
          Choose a beginning to start your story. Pick any branch to continue.
        </p>
        <div className="text-xs md:text-[13px] text-secondary/80 font-mono uppercase tracking-[0.25em]">
          Tip: Use Tab/Shift+Tab to focus branches, Enter to select.
        </div>
      </div>

      <div className="w-full">
        <TimelineVisualizer topics={topics} onSelect={selectTopic} />
      </div>
    </section>
  );
}
