"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "option";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-display font-semibold rounded-xl transition-all duration-150 relative overflow-hidden focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-secondary/60 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

  const variantClasses = {
    primary:
      "text-background bg-[linear-gradient(180deg,#f6c37a,#d9823b)] border border-[#b86b23] hover:-translate-y-[2px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.45)] active:shadow-[0_4px_14px_rgba(0,0,0,0.35)]",
    secondary:
      "text-background bg-[linear-gradient(180deg,rgba(240,195,106,0.95),rgba(233,201,135,0.92))] border border-[#9a7b3a] hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(0,0,0,0.35)] active:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
    ghost:
      "text-foreground bg-transparent border border-tva-border/60 hover:bg-white/5 active:bg-white/10 hover:border-tva-border shadow-sm",
    option:
      "text-foreground bg-[radial-gradient(circle_at_20%_30%,rgba(240,195,106,0.08),transparent_35%),linear-gradient(180deg,#25201a,#1b1611)] border border-secondary/30 hover:-translate-y-[2px] hover:border-secondary/60 hover:shadow-[0_16px_30px_rgba(0,0,0,0.35)]",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-10 py-4 text-lg",
  };

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      {...props}
    >
      <span className="relative z-10 drop-shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        {children}
      </span>
      <span className="absolute inset-0 rounded-xl bg-white/5 pointer-events-none mix-blend-overlay" />
      <span className="absolute inset-x-0 top-0 h-[2px] bg-white/20 opacity-60" />
    </motion.button>
  );
}
