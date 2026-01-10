"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  hint?: string;
}

/**
 * Terminal-style loader with a filling progress bar.
 * Kept the original name to avoid refactors; styling is now inline with the new UI.
 */
export function LoadingSpinner({
  size = "md",
  label = "Synthesizing",
  hint = "System online",
}: LoadingSpinnerProps) {
  const widthMap = {
    sm: "max-w-[220px]",
    md: "max-w-[340px]",
    lg: "max-w-[420px]",
  };

  return (
    <div className={`loader-shell ${widthMap[size]} glow-border`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="loader-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </div>

      <div className="loader-bar">
        <motion.div
          className="loader-meter"
          initial={{ width: "8%" }}
          animate={{ width: ["15%", "86%", "60%", "100%"] }}
          transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
        />
      </div>

      <div className="flex items-center justify-center mt-3 text-sm text-foreground/70 font-medium">
        <span>{label}</span>
      </div>
    </div>
  );
}
