import { NextRequest, NextResponse } from "next/server";
import { generateComicImage } from "@/lib/gemini/image-generation";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const TIMEOUT_MS = 60000; // 60 second timeout
  
  try {
    const body = await request.json();
    const { fullStory, sceneLabel } = body;

    if (!fullStory || typeof fullStory !== "string" || !fullStory.trim()) {
      return NextResponse.json(
        { error: "fullStory is required" },
        { status: 400 }
      );
    }

    const safeSceneLabel =
      typeof sceneLabel === "string" && sceneLabel.trim().length > 0
        ? sceneLabel.trim()
        : undefined;

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Image generation timeout after 60 seconds")), TIMEOUT_MS);
    });

    // Race between image generation and timeout
    const imageResponse = await Promise.race([
      generateComicImage(fullStory, {
        sceneLabel: safeSceneLabel,
      }),
      timeoutPromise,
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`Image generated in ${elapsed}ms${safeSceneLabel ? ` for ${safeSceneLabel}` : ""}`);

    // Convert base64 to data URL
    const imageDataUrl = `data:${imageResponse.mimeType};base64,${imageResponse.imageData}`;

    return NextResponse.json({
      imageUrl: imageDataUrl,
      mimeType: imageResponse.mimeType,
    }, {
      headers: {
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`Error generating image after ${elapsed}ms:`, error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to generate comic image";
    
    // Determine appropriate status code
    let statusCode = 500;
    if (errorMessage.includes("timeout")) {
      statusCode = 504; // Gateway Timeout
    } else if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      statusCode = 429; // Too Many Requests
    } else if (errorMessage.includes("400") || errorMessage.includes("invalid")) {
      statusCode = 400; // Bad Request
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
