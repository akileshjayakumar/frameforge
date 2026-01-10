import { geminiClient, MODELS } from "./client";
import { runWithGeminiLimiter } from "./rate-limit";

export interface ImageGenerationResponse {
  imageData: string; // base64 encoded image
  mimeType: string;
}

type GeminiInlineData = {
  data?: string;
  // The GenAI SDK typically uses camelCase...
  mimeType?: string;
  // ...but some response shapes may use snake_case.
  mime_type?: string;
};

type GeminiContentPart = {
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiContentPart[];
  };
};

type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[];
};

type ImageGenerationOptions = {
  sceneLabel?: string;
  maxAttempts?: number;
};

function extractImageFromResponse(
  response: GeminiGenerateContentResponse
): ImageGenerationResponse {
  const candidates = response.candidates ?? [];
  if (candidates.length === 0) {
    throw new Error("No candidates in response");
  }

  const content = candidates[0]?.content;
  if (!content) {
    throw new Error("No content in candidate");
  }

  const parts = content.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData || part.inline_data);

  if (!imagePart) {
    throw new Error("No image data found in response");
  }

  const inlineData = imagePart.inlineData ?? imagePart.inline_data;
  if (!inlineData || !inlineData.data) {
    throw new Error("No image data received from Gemini");
  }

  return {
    imageData: inlineData.data,
    mimeType: inlineData.mimeType ?? inlineData.mime_type ?? "image/png",
  };
}

function isRetryableImageError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const errorMessage = error.message || String(error);
  const errorObj = error as any;
  const errorCode = errorObj?.error?.code || errorObj?.status || errorObj?.code;
  
  // Retryable errors: rate limits, server errors, empty responses
  return (
    /No candidates/i.test(errorMessage) ||
    /No content/i.test(errorMessage) ||
    /No image data/i.test(errorMessage) ||
    /429/i.test(errorMessage) ||
    /RESOURCE_EXHAUSTED/i.test(errorMessage) ||
    /quota/i.test(errorMessage) ||
    /rate limit/i.test(errorMessage) ||
    /500/i.test(errorMessage) ||
    /503/i.test(errorMessage) ||
    errorCode === 429 ||
    errorCode === 500 ||
    errorCode === 503 ||
    errorCode === "RESOURCE_EXHAUSTED"
  );
}

/**
 * Generate a cinematic sci-fi illustration using Nano Banana
 */
export async function generateComicImage(
  storyPrompt: string,
  options?: ImageGenerationOptions
): Promise<ImageGenerationResponse> {
  const { sceneLabel, maxAttempts = 3 } = options || {};
  let lastError: unknown = null;

  // Structured prompt engineering for high-fidelity sci-fi illustration
  const sceneContext = sceneLabel
    ? `${sceneLabel} keyframe from the story`
    : "a keyframe from the story";

  const fullPrompt = `Create a masterpiece cinematic sci-fi illustration for ${sceneContext}.

FULL STORY CONTEXT (use this for fidelity and consistency):
${storyPrompt}

COMPOSITION: Dynamic cinematic framing - use a wide-angle lens (24-35mm equivalent) with dramatic perspective. Employ the rule of thirds with the focal element positioned off-center. Include foreground interest and deep field depth to create immersion. Choose between: low-angle hero shot for empowerment, high-angle establishing shot for vulnerability, or Dutch angle for psychological tension.

LIGHTING: Atmospheric cinematic lighting with high contrast ratios. Use practical light sources (bioluminescent organisms, holographic displays, starlight filtering through atmosphere). Employ chiaroscuro techniques with deep shadows and bright highlights. Add volumetric lighting effects like light rays, lens flares, and atmospheric scattering.

STYLE: Prestige sci-fi aesthetic blending Moebius-inspired linework with photorealistic detail. Reference cyberpunk 2077 neon-grime, Solaris-like minimalism, or Event Horizon cosmic horror. Use a rich color palette with desaturated cool tones and saturated accent colors. Incorporate particle effects, energy fields, and technological interfaces with glowing UI elements.

TECHNICAL: Photorealistic rendering with ray-traced reflections and refractions. 85mm lens at f/2.8 aperture for shallow depth of field. High dynamic range with proper exposure for both bright energy sources and deep space darkness. Add film grain and subtle chromatic aberration for cinematic authenticity.

ATMOSPHERE: Capture the wonder, mystery, and emotional depth of the scene. Convey scale (cosmic vastness or intimate human moments), tension (impending revelation or quiet contemplation), and theme (humanity's place in the universe, consciousness, technological consequence).

The illustration should look like a key frame from a prestige sci-fi film - worthy of hanging in a museum of speculative art.`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await runWithGeminiLimiter(() =>
        geminiClient.models.generateContent({
          model: MODELS.NANO_BANANA,
          contents: fullPrompt,
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: "16:9",
            },
          },
        })
      );

      const typedResponse = response as unknown as GeminiGenerateContentResponse;
      return extractImageFromResponse(typedResponse);
    } catch (error) {
      lastError = error;
      const shouldRetry = isRetryableImageError(error) && attempt < maxAttempts;
      
      if (shouldRetry) {
        // Exponential backoff with jitter: 1s, 2s, 4s (plus jitter)
        const baseDelay = 1000 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 500; // Add up to 500ms jitter
        const delayMs = baseDelay + jitter;
        
        console.warn(
          `Image generation retry ${attempt}/${maxAttempts} after ${Math.round(delayMs)}ms${
            sceneLabel ? ` (${sceneLabel})` : ""
          }: ${error instanceof Error ? error.message : String(error)}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      
      // Not retryable or max attempts reached
      const detail =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to generate comic image${
          sceneLabel ? ` for ${sceneLabel}` : ""
        } after ${maxAttempts} attempts: ${detail}`
      );
    }
  }

  const detail = lastError instanceof Error ? lastError.message : "Unknown error";
  throw new Error(
    `Failed to generate comic image${
      sceneLabel ? ` for ${sceneLabel}` : ""
    }: ${detail}`
  );
}
