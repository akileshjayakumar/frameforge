"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#1a1a1a] border-t-2 border-[#4a4a4a] py-4 px-4 md:px-8 mt-auto relative z-50">
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm text-[#b0b0b0]">
        {/* Built with Antigravity */}
        <Link
          href="https://antigravity.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-[#d0d0d0] transition-colors underline decoration-[#b0b0b0]/40 underline-offset-2 hover:decoration-[#d0d0d0]/60"
        >
          <span>Built with Antigravity</span>
        </Link>

        <div className="h-4 w-px bg-[#4a4a4a]" />

        {/* Powered by Gemini 3 Flash */}
        <Link
          href="https://ai.google.dev/gemini-api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-[#d0d0d0] transition-colors underline decoration-[#b0b0b0]/40 underline-offset-2 hover:decoration-[#d0d0d0]/60"
        >
          <span>Powered by Gemini API</span>
        </Link>

        <div className="h-4 w-px bg-[#4a4a4a]" />

        {/* Inspired by Gemini 3 Hackathon */}
        <Link
          href="https://luma.com/gemini3sgp?tk=whm5Bg"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-[#d0d0d0] transition-colors underline decoration-[#b0b0b0]/40 underline-offset-2 hover:decoration-[#d0d0d0]/60"
        >
          <span>Built for Gemini 3 Hackathon Singapore</span>
        </Link>

        <div className="h-4 w-px bg-[#4a4a4a]" />

        {/* Made by */}
        <Link
          href="https://akileshjayakumar.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-[#d0d0d0] transition-colors underline decoration-[#b0b0b0]/40 underline-offset-2 hover:decoration-[#d0d0d0]/60"
        >
          <span>made by akileshjayakumar.com</span>
        </Link>

        <div className="h-4 w-px bg-[#4a4a4a]" />

        {/* Date */}
        <span className="text-[#b0b0b0]">Jan 2026</span>
      </div>
    </footer>
  );
}
