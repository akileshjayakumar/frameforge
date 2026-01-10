"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  density: number;
  color: string;
  vx: number;
  vy: number;
  z: number; // For 3D parallax feel
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000, radius: 200 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      particles = [];
      // Adjust density based on screen size
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 12000);
      
      const colors = ["#d9823b", "#f0c36a", "#5b7f84", "#f5e9da"];

      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const z = Math.random() * 2 + 0.5; // depth factor
        
        particles.push({
          x,
          y,
          size: size * z,
          baseX: x,
          baseY: y,
          z,
          density: Math.random() * 40 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 0.4 * (1/z),
          vy: (Math.random() - 0.5) * 0.4 * (1/z),
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Constant drift with parallax
        p.x += p.vx;
        p.y += p.vy;
        
        // Wrap around screen
        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;

        // Mouse interaction - stronger and more fluid
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.current.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = mouse.current.radius;
          const force = (maxDistance - distance) / maxDistance;
          const directionX = forceDirectionX * force * p.density * 1.5;
          const directionY = forceDirectionY * force * p.density * 1.5;
          
          p.x -= directionX;
          p.y -= directionY;
        }

        // Draw connections to nearby particles (optimized)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 100) * 0.2;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.closePath();
          }
        }

        // Draw particle
        ctx.globalAlpha = 0.8 / p.z;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 20 / p.z;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
    };

    const handleMouseOut = () => {
      mouse.current.x = -1000;
      mouse.current.y = -1000;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);
    
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 1, // Above body background but below content
        background: "transparent"
      }}
    />
  );
}
