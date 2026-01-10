"use client";

import React from "react";
import { motion } from "framer-motion";
import { TopicOption } from "@/types/game";

interface TimelineVisualizerProps {
  topics: TopicOption[];
  onSelect: (topic: string) => void;
}

export function TimelineVisualizer({
  topics,
  onSelect,
}: TimelineVisualizerProps) {
  const list = topics.slice(0, 5);

  return (
    <div className="w-full relative py-10">
      <div className="relative w-full max-w-6xl mx-auto h-[500px] px-4 md:px-8">
        {/* 1. The Main horizontal Timeline Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-linear-to-r from-transparent via-secondary/40 to-transparent -translate-y-1/2 z-0" />

        {/* 2. Branches evenly spaced across the width */}
        <div className="relative flex w-full h-full items-center justify-between gap-4">
          {list.map((topic, idx) => {
            const isTop = idx % 2 === 0;

            return (
              <div
                key={topic.id}
                className="relative flex flex-col items-center w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px]"
              >
                {/* The Node on the line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-secondary shadow-[0_0_20px_rgba(240,195,106,0.8)] z-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.08 }}
                  />
                  <motion.div
                    className="absolute inset-0 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-secondary/30"
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>

                {/* The Branch Connector (Vertical Line) */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-0.5 bg-linear-to-b ${
                    isTop
                      ? "bottom-1/2 h-24 md:h-28 from-secondary/0 to-secondary/60"
                      : "top-1/2 h-24 md:h-28 from-secondary/60 to-secondary/0"
                  }`}
                />

                {/* The Topic Card */}
                <motion.div
                  className={`absolute left-1/2 -translate-x-1/2 ${
                    isTop
                      ? "bottom-[calc(50%+88px)] md:bottom-[calc(50%+112px)]"
                      : "top-[calc(50%+88px)] md:top-[calc(50%+112px)]"
                  }`}
                  initial={{ opacity: 0, y: isTop ? -18 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.08 }}
                >
                  <button
                    onClick={() => onSelect(topic.text)}
                    className="group w-[200px] sm:w-[220px] md:w-[230px] lg:w-[240px] text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[30px]"
                  >
                    <div className="p-5 md:p-6 bg-[#1f1a14]/90 backdrop-blur-2xl border-2 border-secondary/10 rounded-[26px] md:rounded-[30px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7)] group-hover:border-secondary/50 group-hover:shadow-[0_0_50px_rgba(240,195,106,0.2)] transition-all duration-500">
                      <p className="text-[9px] md:text-[10px] font-mono text-secondary/50 mb-2 uppercase tracking-[0.35em] font-black">
                        BRANCH 0{idx + 1}
                      </p>
                      <p className="text-sm md:text-lg font-bold text-foreground leading-snug break-words hyphens-auto">
                        {topic.text}
                      </p>
                    </div>
                  </button>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
