import { NextRequest, NextResponse } from "next/server";
import {
  generateStoryVideo,
  pollVideoOperation,
  VideoOperation,
} from "@/lib/gemini/video-generation";
import { VideoStyle, VideoDuration, VideoAspectRatio, VideoResolution } from "@/types/game";

/**
 * Video generation API endpoint
 * 
 * Actions:
 * - "generate": Start video generation with images, style, and config (no story text to reduce token usage)
 * - "poll": Check status of an ongoing video generation operation
 * - "download": Download a generated video file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    const {
      genre,
      referenceImages,
      style,
      durationSeconds,
      aspectRatio,
      resolution,
      negativePrompt,
      operation,
    } = body;

    if (action === "generate") {
      // Validate required parameters
      if (!referenceImages || !Array.isArray(referenceImages) || referenceImages.length === 0) {
        return NextResponse.json(
          { error: "referenceImages array is required with at least 1 image" },
          { status: 400 }
        );
      }

      if (!style) {
        return NextResponse.json(
          { error: "style is required (live-action, animation, stop-motion, anime, watercolor, noir)" },
          { status: 400 }
        );
      }

      // Validate style is a valid VideoStyle
      const validStyles: VideoStyle[] = ["live-action", "animation", "stop-motion", "anime", "watercolor", "noir"];
      if (!validStyles.includes(style)) {
        return NextResponse.json(
          { error: `Invalid style. Must be one of: ${validStyles.join(", ")}` },
          { status: 400 }
        );
      }

      // Validate duration if provided
      const validDurations: VideoDuration[] = [4, 6, 8];
      const duration: VideoDuration = validDurations.includes(durationSeconds) ? durationSeconds : 8;

      // Validate aspect ratio if provided
      const validAspectRatios: VideoAspectRatio[] = ["16:9", "9:16"];
      const videoAspectRatio: VideoAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "16:9";

      // Validate resolution if provided (1080p only for 8s duration)
      const validResolutions: VideoResolution[] = ["720p", "1080p"];
      let videoResolution: VideoResolution = validResolutions.includes(resolution) ? resolution : "720p";
      if (videoResolution === "1080p" && duration !== 8) {
        videoResolution = "720p"; // 1080p only available for 8s
      }

      // Use genre or default to "cinematic"
      const videoGenre = genre || "cinematic";

      // Generate the video with images and config only (includes enhanced retry logic for 429 errors)
      const videoOperation = await generateStoryVideo(
        videoGenre,
        referenceImages,
        style as VideoStyle,
        duration,
        videoAspectRatio,
        videoResolution,
        negativePrompt || undefined
      );

      return NextResponse.json({
        operation: videoOperation,
        operationName: videoOperation.name,
        done: videoOperation.done,
        videoUrl: videoOperation.response?.generatedVideos?.[0]?.video?.uri || null,
      });
    }

    if (action === "poll") {
      const operationName = body.operationName || (operation as VideoOperation)?.name;
      
      if (!operationName || typeof operationName !== "string") {
        return NextResponse.json(
          { error: "operationName string is required for polling" },
          { status: 400 }
        );
      }

      const result = await pollVideoOperation(operationName);

      return NextResponse.json({
        operation: result,
        operationName: result.name,
        done: result.done,
        videoUrl: result.response?.generatedVideos?.[0]?.video?.uri || null,
        error: result.error?.message || null,
      });
    }

    if (action === "download") {
      const videoUrl = body.videoUrl;

      if (!videoUrl || typeof videoUrl !== "string") {
        return NextResponse.json(
          { error: "videoUrl is required for download" },
          { status: 400 }
        );
      }

      const headers: Record<string, string> = {};
      if (process.env.GEMINI_API_KEY) {
        headers["x-goog-api-key"] = process.env.GEMINI_API_KEY;
      }

      const upstream = await fetch(videoUrl, { headers });
      if (!upstream.ok) {
        const detail = await upstream.text().catch(() => "");
        return NextResponse.json(
          {
            error: `Failed to download video (${upstream.status})${detail ? `: ${detail}` : ""
              }`,
          },
          { status: upstream.status }
        );
      }

      const arrayBuffer = await upstream.arrayBuffer();
      const contentType = upstream.headers.get("content-type") || "video/mp4";
      const responseHeaders = new Headers({
        "Content-Type": contentType,
        "Content-Length": arrayBuffer.byteLength.toString(),
      });

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: responseHeaders,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Must be 'generate', 'poll', or 'download'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in video API:", error);
    const message = error instanceof Error ? error.message : "Failed to process video request";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
