import { geminiClient, MODELS } from "./client";
import { runWithGeminiLimiter } from "./rate-limit";
import {
  VideoStyle,
  VideoDuration,
  VideoAspectRatio,
  VideoResolution,
} from "@/types/game";

/**
 * Video operation response from Veo 3.1
 */
export interface VideoOperation {
  name: string;
  done: boolean;
  response?: {
    generatedVideos?: Array<{
      video: {
        uri: string;
        videoBytes?: Uint8Array;
      };
    }>;
  };
  error?: {
    message: string;
  };
}

/**
 * Style-specific prompt fragments for different video styles
 */
const stylePrompts: Record<VideoStyle, string> = {
  "live-action":
    "Photorealistic cinematic footage with natural lighting, real-world textures, film grain, and Hollywood-quality cinematography. Shallow depth of field, practical lighting sources.",
  animation:
    "High-quality 3D animated style with vibrant colors, expressive characters, smooth motion, and Pixar-quality rendering. Clean lines and polished visuals.",
  "stop-motion":
    "Whimsical stop-motion animation style with handcrafted textures, visible fingerprints on clay, charming imperfections, and frame-by-frame movement.",
  anime:
    "Japanese anime style with dynamic camera angles, expressive faces, speed lines, dramatic lighting, cel-shading, and vibrant color palettes.",
  watercolor:
    "Artistic watercolor animation with flowing paint textures, soft edges, dreamy color bleeds, and ethereal transitions between scenes.",
  noir: "Classic film noir style in high-contrast black and white with dramatic shadows, venetian blind lighting, rain-slicked streets, and moody atmosphere.",
};

/**
 * Generate a story video using Veo 3.1
 * Uses reference images and style config only - no story text to reduce token usage
 *
 * @param genre - The story genre (thriller, sci-fi, fantasy, etc.)
 * @param referenceImages - Array of base64 image data URIs (up to 4 used as reference)
 * @param style - Video style (live-action, animation, etc.)
 * @param durationSeconds - Video duration (4, 6, or 8 seconds)
 * @param aspectRatio - Aspect ratio (16:9 or 9:16)
 * @param resolution - Resolution (720p or 1080p, 1080p only for 8s)
 * @param negativePrompt - Optional prompt for what to exclude
 */
export async function generateStoryVideo(
  genre: string,
  referenceImages: string[],
  style: VideoStyle,
  durationSeconds: VideoDuration = 8,
  aspectRatio: VideoAspectRatio = "16:9",
  resolution: VideoResolution = "720p",
  negativePrompt?: string
): Promise<VideoOperation> {
  try {
    const styleDescription = stylePrompts[style];

    // Minimal prompt focused on style and config - images provide visual narrative
    const videoPrompt = `Create a ${durationSeconds}-second ${styleDescription} video in ${genre} style. Use the reference images as visual guidance.${
      negativePrompt ? ` Avoid: ${negativePrompt}` : ""
    }`;

    const config: Record<string, unknown> = {
      aspectRatio: aspectRatio,
      resolution: resolution,
      durationSeconds: durationSeconds,
    };

    // Add negative prompt if provided
    if (negativePrompt) {
      config.negativePrompt = negativePrompt;
    }

    // Prepare reference images (up to 4 for storyboard-based video)
    // Extract base64 data from data URIs
    const processedImages = referenceImages.slice(0, 4).map((img) => {
      // Handle data URI format: "data:image/png;base64,..."
      if (img.startsWith("data:")) {
        const base64Data = img.split(",")[1];
        return {
          image: {
            imageBytes: base64Data,
            mimeType: img.split(";")[0].split(":")[1] || "image/png",
          },
          referenceType: "asset",
        };
      }
      // Handle raw base64 or URL
      return {
        image: img,
        referenceType: "asset",
      };
    });

    // Build the generation request
    const generateRequest: Record<string, unknown> = {
      model: MODELS.VEO,
      prompt: videoPrompt,
      config: config,
    };

    // Add reference images if available
    if (processedImages.length > 0) {
      generateRequest.referenceImages = processedImages;
    }

    const operation = await runWithGeminiLimiter(() =>
      geminiClient.models.generateVideos(generateRequest as any)
    );
    return operation as unknown as VideoOperation;
  } catch (error) {
    console.error("Error generating video:", error);
    throw new Error(
      `Failed to generate video: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Poll video operation status using the Veo 3.1 REST API
 * Uses REST API directly since SDK operation objects can't be serialized over HTTP
 *
 * @param operationName - The operation name string (e.g., "models/veo-3.1-generate-preview/operations/...")
 */
export async function pollVideoOperation(
  operationName: string
): Promise<VideoOperation> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
      {
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Transform REST API response to our VideoOperation format
    const videoUri =
      data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

    return {
      name: operationName,
      done: data.done || false,
      response: videoUri
        ? {
            generatedVideos: [
              {
                video: {
                  uri: videoUri,
                },
              },
            ],
          }
        : undefined,
      error: data.error
        ? { message: data.error.message || "Unknown error" }
        : undefined,
    };
  } catch (error) {
    console.error("Error polling video operation:", error);
    throw new Error(
      `Failed to poll video operation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Download a generated video file
 *
 * @param videoFile - The video file object from the operation response
 */
export async function downloadVideo(videoFile: {
  uri: string;
}): Promise<Uint8Array> {
  try {
    const result = await geminiClient.files.download({
      file: videoFile,
      downloadPath: "", // Temporary path, not used when returning bytes directly
    } as any);
    return result as unknown as Uint8Array;
  } catch (error) {
    console.error("Error downloading video:", error);
    throw new Error(
      `Failed to download video: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
