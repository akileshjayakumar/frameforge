"use client";

import React, { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { VideoStyle, VideoDuration, VideoPreferences as VideoPreferencesType } from "@/types/game";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { TerminalPanel } from "@/components/ui/TerminalPanel";

// Simplified to 4 most popular styles
const VIDEO_STYLES: { value: VideoStyle; label: string; description: string }[] = [
  { value: "live-action", label: "Live Action", description: "Photorealistic cinematic" },
  { value: "animation", label: "Animation", description: "Stylized 3D animation" },
  { value: "anime", label: "Anime", description: "Japanese anime style" },
  { value: "watercolor", label: "Watercolor", description: "Artistic watercolor" },
];

const DURATIONS: { value: VideoDuration; label: string }[] = [
  { value: 4, label: "4s" },
  { value: 6, label: "6s" },
  { value: 8, label: "8s" },
];

export function VideoPreferences() {
  const { gameState, setVideoPreferences, generateStoryVideo, isLoading } = useGame();

  const [style, setStyle] = useState<VideoStyle>("live-action");
  const [duration, setDuration] = useState<VideoDuration>(6);

  const handleGenerateVideo = () => {
    const preferences: VideoPreferencesType = {
      style,
      durationSeconds: duration,
      aspectRatio: "16:9", // Always default to 16:9
      resolution: "720p", // Always default to 720p
      genreOverride: gameState.genre || undefined, // Use story genre automatically
    };

    // Pass preferences directly to avoid race condition with state updates
    generateStoryVideo(preferences);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.4 }}
      className="w-full flex flex-col items-center justify-center px-8 py-10"
    >
      {/* Simple label */}
      <h3 className="text-lg font-semibold text-foreground mb-12 text-center w-full">Video settings</h3>
      
      <div className="w-full flex flex-col items-center justify-center gap-10">
        {/* Style Selection - 3D buttons */}
        <div className="w-full flex flex-wrap items-center justify-center gap-4 px-4 pt-2 pb-2">
          {VIDEO_STYLES.map((s) => (
            <motion.button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`relative px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                style === s.value
                  ? "bg-gradient-to-br from-[#f0c36a] via-[#d9823b] to-[#b86b23] text-background shadow-[0_8px_0_#9a6b2a,0_12px_20px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.3)] border-2 border-[#d9823b]"
                  : "bg-gradient-to-br from-[#2a2419] via-[#1f1a14] to-[#16130f] text-foreground/80 hover:text-foreground shadow-[0_4px_0_#0f0d09,0_6px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border-2 border-[#3c3227] hover:border-[#4a3f32] hover:shadow-[0_6px_0_#0f0d09,0_8px_16px_rgba(0,0,0,0.4)]"
              }`}
              whileHover={{ y: style === s.value ? -2 : -1 }}
              whileTap={{ y: style === s.value ? 2 : 1, scale: 0.98 }}
            >
              <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {s.label}
              </span>
              {style === s.value && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ffd700] shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Duration Selection - 3D buttons */}
        <div className="w-full flex items-center justify-center gap-4 px-4 pt-2 pb-2">
          {DURATIONS.map((d) => (
            <motion.button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`relative px-10 py-4 rounded-xl text-base font-bold transition-all duration-200 ${
                duration === d.value
                  ? "bg-gradient-to-r from-[#f0c36a] via-[#d9823b] to-[#b86b23] text-background shadow-[0_8px_0_#9a6b2a,0_12px_20px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.3)] border-2 border-[#d9823b]"
                  : "bg-gradient-to-br from-[#2a2419] via-[#1f1a14] to-[#16130f] text-foreground/70 hover:text-foreground shadow-[0_4px_0_#0f0d09,0_6px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border-2 border-[#3c3227] hover:border-[#4a3f32] hover:shadow-[0_6px_0_#0f0d09,0_8px_16px_rgba(0,0,0,0.4)]"
              }`}
              whileHover={{ y: duration === d.value ? -2 : -1 }}
              whileTap={{ y: duration === d.value ? 2 : 1, scale: 0.98 }}
            >
              <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {d.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Generate Button - 3D design */}
        <div className="w-full flex items-center justify-center pt-8">
          <motion.button
            onClick={handleGenerateVideo}
            disabled={isLoading}
            className={`relative px-14 py-5 rounded-xl text-lg font-bold min-w-[220px] transition-all duration-200 ${
              isLoading
                ? "bg-gradient-to-br from-[#2a2419] via-[#1f1a14] to-[#16130f] text-foreground/50 shadow-[0_4px_0_#0f0d09,0_6px_12px_rgba(0,0,0,0.3)] border-2 border-[#3c3227] cursor-not-allowed"
                : "bg-gradient-to-br from-[#f0c36a] via-[#d9823b] to-[#b86b23] text-background shadow-[0_10px_0_#9a6b2a,0_16px_24px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.3)] border-2 border-[#d9823b] hover:shadow-[0_12px_0_#9a6b2a,0_18px_28px_rgba(0,0,0,0.6)]"
            }`}
            whileHover={!isLoading ? { y: -2 } : {}}
            whileTap={!isLoading ? { y: 2, scale: 0.98 } : {}}
          >
            <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              {isLoading ? "Starting..." : "Generate Video"}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
