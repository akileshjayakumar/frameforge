import type { Metadata } from "next";
import { GameProvider } from "@/contexts/GameContext";
import { ParticleBackground } from "@/components/layout/ParticleBackground";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "FrameForge - AI vs Human Storytelling Game",
  description: "A turn-based storytelling game where you compete against Gemini AI to create the most creative story",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="bg-tva-base min-h-screen relative flex flex-col" suppressHydrationWarning>
        <ParticleBackground />
        <GameProvider>
          <div className="flex-1 flex items-center justify-center">
            {children}
          </div>
          <Footer />
        </GameProvider>
      </body>
    </html>
  );
}
