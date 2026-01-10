"use client";

import React from "react";
import { motion } from "framer-motion";

interface TerminalPanelProps {
  title?: string;
  subtitle?: string;
  status?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function TerminalPanel({
  title,
  subtitle,
  status,
  actions,
  children,
  className = "",
  padding = "md",
}: TerminalPanelProps) {
  const paddingMap = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <motion.section
      className={`terminal-surface ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {title && (
        <div className="terminal-header">
          <h3 className="text-xl md:text-2xl font-display font-bold leading-tight text-foreground text-center w-full">
            {title}
          </h3>
        </div>
      )}

      <div className={`${paddingMap[padding]} relative z-10`}>{children}</div>
    </motion.section>
  );
}
