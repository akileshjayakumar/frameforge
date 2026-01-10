"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
}

interface LogoParticleAnimationProps {
  progress: number; // 0-6
  total: number; // 6
}

export function LogoParticleAnimation({
  progress,
  total,
}: LogoParticleAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [logoScale, setLogoScale] = useState(1);
  const [logoError, setLogoError] = useState(false);

  // Generate particles based on progress
  const particleCount = useMemo(() => {
    // Slightly lighter particle load for smoother animation
    return Math.min(20 + progress * 3, 40);
  }, [progress]);

  // Create particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    const geminiColors = ["#439DDF", "#4F87ED", "#9476C5", "#BC688E", "#D6645D"];
    const bananaColors = ["#FFD700", "#FFA500", "#FF8C00", "#FFD700"];

    for (let i = 0; i < particleCount; i++) {
      const isGemini = i % 2 === 0;
      const colors = isGemini ? geminiColors : bananaColors;
      const color = colors[Math.floor(Math.random() * colors.length)];

      newParticles.push({
        id: i,
        x: Math.random() * 100, // Percentage of container width
        y: Math.random() * 100, // Percentage of container height
        vx: (Math.random() - 0.5) * 0.5, // Velocity X
        vy: (Math.random() - 0.5) * 0.5, // Velocity Y
        color,
        size: Math.random() * 4 + 2, // 2-6px
        opacity: Math.random() * 0.8 + 0.2, // 0.2-1.0
      });
    }

    setParticles(newParticles);
  }, [particleCount]);

  // Animate particles with requestAnimationFrame for smoother animation
  const animationFrameRef = useRef<number>();
  
  useEffect(() => {
    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: (p.x + p.vx + 100) % 100,
          y: (p.y + p.vy + 100) % 100,
          opacity: Math.max(0.2, Math.min(1, p.opacity + (Math.random() - 0.5) * 0.05)),
        }))
      );
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Pulse logos
  useEffect(() => {
    const interval = setInterval(() => {
      setLogoScale(1.05);
      setTimeout(() => setLogoScale(1), 300);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const progressPercent = (progress / total) * 100;

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
      {/* Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
            animate={{
              opacity: [particle.opacity * 0.7, particle.opacity, particle.opacity * 0.7],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Logos */}
      <div className="relative z-10 flex items-center gap-12 px-4 py-3 rounded-2xl bg-black/10 backdrop-blur-sm">
        {/* Gemini Logo */}
        <motion.div
          animate={{ scale: logoScale }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative"
        >
          <div className="relative w-32 h-12 md:w-40 md:h-16 flex items-center justify-center">
            {!logoError ? (
              <img
                src="/logos/gemini-logo.svg"
                alt="Gemini"
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(67,157,223,0.5)]"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-foreground font-semibold text-lg">Gemini</span>
            )}
          </div>
        </motion.div>

        {/* Plus/Connector */}
        <motion.div
          className="text-4xl text-foreground/40 font-bold"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          +
        </motion.div>

        {/* Nano Banana */}
        <motion.div
          animate={{ scale: logoScale }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="text-5xl md:text-6xl drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              🍌
            </div>
            <div className="text-xs md:text-sm font-semibold text-foreground/80 tracking-wider">
              NANO BANANA
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Indicator - Particles form progress */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="text-center">
          <motion.div
            className="text-2xl font-bold text-foreground mb-2"
            key={progress}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {progress}/{total}
          </motion.div>
          <div className="w-48 h-1 bg-foreground/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
