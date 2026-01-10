"use client";

import React from "react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingDisplayProps {
  title?: string;
  subtitle?: string;
  status?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingDisplay({
  title = "Loading...",
  subtitle = "Please wait",
  status = "ACTIVE",
  size = "md",
}: LoadingDisplayProps) {
  return (
    <div className="w-full flex flex-col items-center gap-4 text-center">
      <LoadingSpinner size={size} label={title} />
      {subtitle && (
        <motion.p
          className="text-foreground/60 text-sm font-medium"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
