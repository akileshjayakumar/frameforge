"use client";

import React, { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/Button";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { LogoParticleAnimation } from "@/components/ui/LogoParticleAnimation";
import { Download } from "lucide-react";
import { VideoPreferences as VideoPreferencesType } from "@/types/game";

interface VideoPlayerWithDownloadProps {
  videoUrl: string;
  poster?: string;
  preferences?: VideoPreferencesType;
}

function VideoPlayerWithDownload({
  videoUrl,
  poster,
  preferences,
}: VideoPlayerWithDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Check if it's a blob URL (already downloaded) or a remote URL
      if (videoUrl.startsWith("blob:")) {
        // For blob URLs, create a download link directly
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `story-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // For remote URLs, use the API download endpoint
        const downloadResponse = await fetch("/api/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "download",
            videoUrl: videoUrl,
          }),
        });

        if (!downloadResponse.ok) {
          const errorData = await downloadResponse.json().catch(() => null);
          throw new Error(
            errorData?.error || `Download failed (${downloadResponse.status})`
          );
        }

        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `story-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to download video"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TerminalPanel title="Your Video" padding="md" className="w-full">
      <div className="flex flex-col gap-4">
        <div className="relative rounded-2xl overflow-hidden border-2 border-secondary/30 bg-[#0f0c09]">
          <div
            className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-primary/10 to-teal-500/20 opacity-50"
            aria-hidden
          />
          <video
            src={videoUrl}
            controls
            preload="metadata"
            poster={poster}
            className="w-full rounded-2xl shadow-xl relative z-10"
            style={{ maxHeight: "600px" }}
          >
            Your browser does not support the video tag.
          </video>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <Button
              variant="primary"
              size="md"
              onClick={handleDownload}
              disabled={isDownloading}
              className="shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download Video"}
            </Button>
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
}

export function VideoDisplay() {
  const { gameState, retryFetchVideo, generateStoryVideo, isLoading } =
    useGame();

  if (gameState.videoGenerationStatus === "idle") {
    return null;
  }

  if (gameState.videoGenerationStatus === "generating") {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 px-6">
        <LogoParticleAnimation progress={0} total={1} />
        <div className="mt-8 text-center space-y-2">
          <h3 className="text-xl md:text-2xl font-semibold text-foreground">
            Cutting your short film together...
          </h3>
          <p className="text-sm text-foreground/60">
            Splicing scenes in parallel...
          </p>
        </div>
      </div>
    );
  }

  if (gameState.videoGenerationStatus === "error") {
    return (
      <TerminalPanel title="Error" padding="md" className="max-w-2xl">
        <div className="p-4 tva-alert rounded flex flex-col gap-3 items-center text-center">
          <p className="text-foreground">
            Video generation failed. Please try again.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => generateStoryVideo()}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      </TerminalPanel>
    );
  }

  if (gameState.videoFetchStatus === "error") {
    return (
      <TerminalPanel title="Preparing Video" padding="md" className="max-w-2xl">
        <div className="p-4 tva-alert rounded flex flex-col gap-3">
          <p className="text-foreground">
            We generated the video, but couldn’t fetch a playable copy.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={retryFetchVideo}
            disabled={isLoading}
          >
            Retry fetching video
          </Button>
        </div>
      </TerminalPanel>
    );
  }

  if (
    gameState.videoGenerationStatus === "complete" &&
    !gameState.finalVideoUrl
  ) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10 px-6">
        <LogoParticleAnimation progress={0} total={1} />
        <div className="mt-6 text-center space-y-2">
          <h3 className="text-lg md:text-xl font-semibold text-foreground">
            Preparing video...
          </h3>
          <p className="text-sm text-foreground/60">
            Finalizing and making it ready to play.
          </p>
        </div>
      </div>
    );
  }

  if (
    gameState.videoGenerationStatus === "complete" &&
    gameState.finalVideoUrl
  ) {
    return (
      <VideoPlayerWithDownload
        videoUrl={gameState.finalVideoUrl}
        poster={gameState.finalImages?.[0]}
        preferences={gameState.videoPreferences || undefined}
      />
    );
  }

  return null;
}
