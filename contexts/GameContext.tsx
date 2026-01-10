"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { GameState, GameStatus, SentenceOption, VideoPreferences } from "@/types/game";
import {
  createInitialGameState,
  setTopic,
  setGenre,
  addStoryTurn,
  setInteractionId,
  setFinalImage,
  setFinalImages,
  updateGameStatus,
  resetGameState,
} from "@/lib/game/game-state";
import {
  buildStoryText,
  separateContributions,
} from "@/lib/game/story-builder";

interface GameContextType {
  gameState: GameState;
  selectGenre: (genre: string) => void;
  selectTopic: (topic: string) => void;
  addUserSentence: (sentence: string) => Promise<void>;
  addAiSentence: () => Promise<void>;
  setGameStatus: (status: GameStatus) => void;
  setFinalImageUrl: (imageUrl: string) => void;
  resetGame: () => void;
  generateSentenceOptions: () => Promise<SentenceOption[]>;
  generateComicImage: () => Promise<void>;
  setVideoPreferences: (preferences: VideoPreferences) => void;
  generateStoryVideo: (preferences?: VideoPreferences) => Promise<void>;
  retryFetchVideo: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(
    createInitialGameState()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent accidental repeated operations (effects can run twice in dev).
  const comicInFlightRef = useRef(false);
  const comicDoneRef = useRef(false);
  const aiInFlightRef = useRef(false);
  const optionsInFlightRef = useRef(false);
  const videoObjectUrlRef = useRef<string | null>(null);
  
  // Cache for pre-fetched options
  const prefetchedOptionsRef = useRef<{
    turnNumber: number;
    options: SentenceOption[];
  } | null>(null);
  const selectGenre = useCallback((genre: string) => {
    setGameState((prev) => setGenre(prev, genre.trim()));
    setError(null);
    comicInFlightRef.current = false;
    comicDoneRef.current = false;
    aiInFlightRef.current = false;
    // No image generation here - images only generated at completion
  }, []);

  const selectTopic = useCallback(async (topic: string) => {
    // Legacy support if ever used; prefers genre flow
    setGameState((prev) => setTopic(prev, topic));
    setError(null);
    comicInFlightRef.current = false;
    comicDoneRef.current = false;
  }, []);

  const addUserSentence = useCallback(
    async (sentence: string) => {
      if (gameState.gameStatus !== "playing") return;
      setIsLoading(true);
      setError(null);
      try {
        const turnNumber = gameState.currentTurn + 1;
        
        setGameState((prev) => {
          const updated = addStoryTurn(prev, turnNumber, "user", sentence);
          const { userContributions } = separateContributions(updated.story);
          return { ...updated, userContributions };
        });
        // No image generation here - images only generated at completion
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add sentence");
      } finally {
        setIsLoading(false);
      }
    },
    [gameState]
  );

  const addAiSentence = useCallback(async () => {
    if (gameState.gameStatus !== "playing") return;
    // Prevent concurrent AI sentence generation
    if (aiInFlightRef.current) return;
    aiInFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      const storyContent = buildStoryText(gameState.story);
      const storySoFar = gameState.genre
        ? `In this ${gameState.genre} story, ${storyContent}`.trim()
        : storyContent;

      const response = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storySoFar,
          genre: gameState.genre,
          previousInteractionId: gameState.interactionId,
          turnType: "ai-turn",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI sentence");
      }

      const data = await response.json();
      const turnNumber = gameState.currentTurn + 1;
      const aiSentence = data.sentence;
      const isFinalTurn = turnNumber >= 4;

      setGameState((prev) => {
        const updated = addStoryTurn(prev, turnNumber, "ai", aiSentence);
        const withInteraction = setInteractionId(updated, data.interactionId);
        const { aiContributions } = separateContributions(
          withInteraction.story
        );

        return {
          ...withInteraction,
          aiContributions,
          // Lock turns and advance to image generation after the final AI turn
          gameStatus: isFinalTurn ? "generating-image" : withInteraction.gameStatus,
          isUserTurn: isFinalTurn ? false : withInteraction.isUserTurn,
        };
      });

      // No image generation here - images only generated at completion

      // Pre-fetch next user options in background (non-blocking)
      // This makes options appear instantly when user's turn starts
      if (!isFinalTurn) {
        const fullStorySoFar = `${storySoFar} ${aiSentence}`.trim();
        fetch("/api/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storySoFar: fullStorySoFar,
            genre: gameState.genre,
            previousInteractionId: data.interactionId,
            turnType: "user-options",
          }),
        })
          .then((res) => res.ok && res.json())
          .then((optionsData) => {
            if (optionsData?.options?.length > 0) {
              prefetchedOptionsRef.current = {
                turnNumber: turnNumber,
                options: optionsData.options,
              };
              if (optionsData.interactionId) {
                setGameState((prev) =>
                  setInteractionId(prev, optionsData.interactionId)
                );
              }
            }
          })
          .catch(() => {
            // Silent fail for prefetch
          });
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate AI sentence"
      );
    } finally {
      setIsLoading(false);
      aiInFlightRef.current = false;
    }
  }, [gameState]);

  const setGameStatus = useCallback((status: GameStatus) => {
    setGameState((prev) => updateGameStatus(prev, status));
  }, []);

  const setFinalImageUrl = useCallback((imageUrl: string) => {
    setGameState((prev) => setFinalImages(prev, [imageUrl]));
  }, []);

  const resetGame = useCallback(() => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
    setGameState(resetGameState());
    setError(null);
    comicInFlightRef.current = false;
    comicDoneRef.current = false;
    aiInFlightRef.current = false;
    optionsInFlightRef.current = false;
    prefetchedOptionsRef.current = null;
  }, []);

  const setVideoPreferences = useCallback((preferences: VideoPreferences) => {
    setGameState((prev) => ({
      ...prev,
      videoPreferences: preferences,
    }));
  }, []);

  const generateSentenceOptions = useCallback(async (): Promise<
    SentenceOption[]
  > => {
    // If the game is already in generation phase, don't generate more options
    if (gameState.gameStatus !== "playing") return [];

    // Check if we have pre-fetched options for the current turn
    const cached = prefetchedOptionsRef.current;
    if (cached && cached.turnNumber === gameState.currentTurn && cached.options.length > 0) {
      prefetchedOptionsRef.current = null; // Clear cache after use
      return cached.options;
    }

    // Prevent duplicate fetches
    if (optionsInFlightRef.current) return [];
    optionsInFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      const storyContent = buildStoryText(gameState.story);
      const storySoFar = gameState.genre
        ? `In this ${gameState.genre} story, ${storyContent}`.trim()
        : storyContent;

      const response = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storySoFar,
          genre: gameState.genre,
          previousInteractionId: gameState.interactionId,
          turnType: "user-options",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate sentence options");
      }

      const data = await response.json();

      // Update interaction ID
      if (data.interactionId) {
        setGameState((prev) => setInteractionId(prev, data.interactionId));
      }

      return data.options || [];
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate options"
      );
      return [];
    } finally {
      setIsLoading(false);
      optionsInFlightRef.current = false;
    }
  }, [gameState]);

  const setReadyVideoUrl = useCallback(
    (url: string, isObjectUrl: boolean) => {
      if (videoObjectUrlRef.current && videoObjectUrlRef.current !== url) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
      videoObjectUrlRef.current = isObjectUrl ? url : null;
      setGameState((prev) => ({
        ...prev,
        finalVideoUrl: url,
        videoFetchStatus: "ready",
        videoGenerationStatus: "complete",
        gameStatus:
          prev.gameStatus === "generating-video" ? "complete" : prev.gameStatus,
      }));
    },
    []
  );

  const fetchPlayableVideo = useCallback(
    async (rawUrl: string) => {
      setGameState((prev) => ({
        ...prev,
        videoFetchStatus: "fetching",
      }));

      try {
        // Try direct URL first (fast path)
        const headOk = await fetch(rawUrl, { method: "HEAD" })
          .then((res) => res.ok)
          .catch(() => false);
        if (headOk) {
          setReadyVideoUrl(rawUrl, false);
          return rawUrl;
        }

        // Fallback: proxy/download via our API to get a browser-safe URL
        const downloadResponse = await fetch("/api/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "download",
            videoUrl: rawUrl,
          }),
        });

        if (!downloadResponse.ok) {
          const detail = await downloadResponse.json().catch(() => null);
          const message =
            detail?.error || `Download failed (${downloadResponse.status})`;
          throw new Error(message);
        }

        const buffer = await downloadResponse.arrayBuffer();
        const mime =
          downloadResponse.headers.get("content-type") || "video/mp4";
        const blobUrl = URL.createObjectURL(new Blob([buffer], { type: mime }));
        setReadyVideoUrl(blobUrl, true);
        return blobUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to prepare video";
        setError(message);
        setGameState((prev) => ({
          ...prev,
          videoFetchStatus: "error",
        }));
        throw err;
      }
    },
    [setReadyVideoUrl]
  );

  const generateComicImage = useCallback(async () => {
    // Require the full 4-turn story before generating panels
    if (gameState.story.length < 4) return;
    if (gameState.finalImages.length > 0) {
      comicDoneRef.current = true;
      return;
    }
    if (comicDoneRef.current || comicInFlightRef.current) return;
    comicInFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      const fullStory = buildStoryText(gameState.story);
      const genreLabel = gameState.genre || gameState.topic || "story";

      // Generate 4 panels derived from the completed story
      const panels = [
        {
          prompt: `Opening establishing keyframe for a ${genreLabel}. Use the full story context: ${fullStory}`,
          label: "Scene 1",
        },
        {
          prompt: `Rising action and development drawn from the full story: ${fullStory}`,
          label: "Scene 2",
        },
        {
          prompt: `Climactic moment from the full story: ${fullStory}`,
          label: "Scene 3",
        },
        {
          prompt: `Resolution / aftermath that honors the full story: ${fullStory}`,
          label: "Scene 4",
        },
      ];

      // Initialize progress tracking
      setGameState((prev) => ({ ...prev, imageGenerationProgress: 0 }));

      // Generate all 6 images in parallel for maximum speed
      const imagePromises = panels.map(async (panel, index) => {
        try {
          const response = await fetch("/api/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullStory: panel.prompt,
              sceneLabel: panel.label,
            }),
          });

          let payload: any = null;
          try {
            payload = await response.json();
          } catch (_) {
            payload = null;
          }

          if (!response.ok) {
            const detail = payload?.error || response.statusText;
            throw new Error(`Failed to generate ${panel.label}: ${detail}`);
          }

          if (!payload?.imageUrl) {
            throw new Error(`No image returned for ${panel.label}`);
          }

          // Update progress as each image completes
          setGameState((prev) => ({
            ...prev,
            imageGenerationProgress: Math.min(prev.imageGenerationProgress + 1, panels.length),
          }));

          return { success: true, imageUrl: payload.imageUrl, index, label: panel.label };
        } catch (error) {
          // Still update progress even on failure
          setGameState((prev) => ({
            ...prev,
            imageGenerationProgress: Math.min(prev.imageGenerationProgress + 1, panels.length),
          }));
          
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            index,
            label: panel.label,
          };
        }
      });

      // Wait for all images to complete (parallel execution)
      const results = await Promise.allSettled(imagePromises);
      
      // Process results: extract successful images and handle failures
      const imageUrls: string[] = [];
      const errors: string[] = [];
      
      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const data = result.value;
          if (data.success && data.imageUrl) {
            // Insert at correct index to maintain order
            imageUrls[data.index] = data.imageUrl;
          } else {
            errors.push(`${data.label}: ${data.error || "Failed"}`);
          }
        } else {
          errors.push(`${panels[idx].label}: ${result.reason?.message || "Failed"}`);
        }
      });

      // Filter out undefined entries and ensure we have at least some images
      const validImageUrls = imageUrls.filter((url): url is string => url !== undefined);
      
      if (validImageUrls.length === 0) {
        throw new Error(`All image generations failed. Errors: ${errors.join("; ")}`);
      }

      // If some failed but we have at least 3, continue with partial results
      if (validImageUrls.length < panels.length && errors.length > 0) {
        console.warn(`Partial image generation: ${validImageUrls.length}/${panels.length} succeeded. Errors: ${errors.join("; ")}`);
      }

      setGameState((prev) => ({
        ...prev,
        finalImages: validImageUrls,
        imageGenerationProgress: panels.length, // Mark as complete
        gameStatus: "video-preferences", // Move to video preferences phase (user-triggered)
      }));
      comicDoneRef.current = true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate comic strip"
      );
      // Allow retry only after an error, but don't spam retries automatically.
      comicDoneRef.current = false;
    } finally {
      setIsLoading(false);
      comicInFlightRef.current = false;
    }
  }, [gameState.topic, gameState.genre, gameState.story]);

  // Generate final story video using Veo with user preferences
  const generateStoryVideo = useCallback(async (preferencesOverride?: VideoPreferences) => {
    if (gameState.videoGenerationStatus === "generating") {
      return;
    }

    // Use provided preferences or fall back to state
    const prefs = preferencesOverride || gameState.videoPreferences;

    // Require video preferences to be set
    if (!prefs) {
      setError("Please set video preferences before generating");
      return;
    }

    // Prepare state for a fresh generation and update preferences if provided
    setGameState((prev) => ({
      ...prev,
      videoPreferences: preferencesOverride || prev.videoPreferences,
      gameStatus: "generating-video",
      videoGenerationStatus: "generating",
      videoFetchStatus: "idle",
      finalVideoUrl: null,
      videoAssetUrl: null,
      videoOperationName: null,
    }));

    setIsLoading(true);
    setError(null);

    try {
      const genre = prefs.genreOverride || gameState.genre || "cinematic";

      // Get reference images (all 4) - these provide the visual narrative for video generation
      const referenceImages = gameState.finalImages.length > 0 
        ? gameState.finalImages.slice(0, 4) 
        : gameState.turnImages.slice(0, 4);

      // Start video generation with images and config only (no story text to reduce token usage)
      // Apply defaults for optional fields
      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          genre,
          referenceImages,
          style: prefs.style,
          durationSeconds: prefs.durationSeconds,
          aspectRatio: prefs.aspectRatio || "16:9", // Default to 16:9
          resolution: prefs.resolution || "720p", // Default to 720p
          negativePrompt: prefs.negativePrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start video generation");
      }

      const data = await response.json();

      setGameState((prev) => ({
        ...prev,
        videoOperationName: data.operationName || null,
        videoAssetUrl: data.videoUrl || null,
      }));

      // If the initial response already contains a playable URL, try to use it
      if (data.videoUrl) {
        await fetchPlayableVideo(data.videoUrl);
        return;
      }

      // Poll for completion with adaptive intervals (faster early, slower later)
      let operationName = data.operationName;
      let done = data.done;
      let pollAttempts = 0;
      const maxAttempts = 90; // 15 minutes max (increased from 10)
      const startTime = Date.now();

      while (!done && pollAttempts < maxAttempts) {
        // Adaptive polling: 5s for first 2 min, 10s for next 3 min, 20s after that
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        let pollInterval: number;
        if (elapsedSeconds < 120) {
          pollInterval = 5000; // 5 seconds for first 2 minutes
        } else if (elapsedSeconds < 300) {
          pollInterval = 10000; // 10 seconds for next 3 minutes
        } else {
          pollInterval = 20000; // 20 seconds after 5 minutes
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const pollResponse = await fetch("/api/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "poll",
            operationName,
          }),
        });

        if (!pollResponse.ok) {
          // Retry polling on transient errors
          if (pollResponse.status >= 500 && pollAttempts < maxAttempts - 1) {
            pollAttempts++;
            continue;
          }
          throw new Error("Failed to poll video status");
        }

        const pollData = await pollResponse.json();
        done = pollData.done;
        operationName = pollData.operationName;

        setGameState((prev) => ({
          ...prev,
          videoOperationName: operationName || prev.videoOperationName,
          videoAssetUrl: pollData.videoUrl || prev.videoAssetUrl,
        }));

        if (pollData.error) {
          throw new Error(pollData.error);
        }

        if (pollData.videoUrl) {
          await fetchPlayableVideo(pollData.videoUrl);
          return;
        }

        pollAttempts++;
      }

      if (!done) {
        throw new Error("Video generation timed out after 15 minutes");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate video"
      );
      setGameState((prev) => ({
        ...prev,
        videoGenerationStatus: "error",
        videoFetchStatus: prev.videoFetchStatus === "ready" ? "ready" : "error",
      }));
    } finally {
      setIsLoading(false);
    }
  }, [gameState, fetchPlayableVideo]);

  const retryFetchVideo = useCallback(async () => {
    if (!gameState.videoAssetUrl) {
      setError("No video is available to fetch yet. Please generate first.");
      return;
    }
    await fetchPlayableVideo(gameState.videoAssetUrl);
  }, [gameState.videoAssetUrl, fetchPlayableVideo]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        selectGenre,
        selectTopic,
        addUserSentence,
        addAiSentence,
        setGameStatus,
        setFinalImageUrl: setFinalImageUrl,
        resetGame,
        generateSentenceOptions,
        generateComicImage,
        setVideoPreferences,
        generateStoryVideo,
        retryFetchVideo,
        isLoading,
        error,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
