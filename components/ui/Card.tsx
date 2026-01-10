"use client";

import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({
  children,
  className = "",
  onClick,
  hover = true,
}: CardProps) {
  const baseClasses = "tva-card p-6 transition-all duration-200 rounded-[28px]";
  const hoverClass = hover
    ? "cursor-pointer hover:shadow-lg hover:bg-[#25201a]"
    : "";

  return (
    <motion.div
      className={`${baseClasses} ${hoverClass} ${className}`}
      onClick={onClick}
      whileHover={hover && onClick ? { scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
