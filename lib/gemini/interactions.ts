import { geminiClient, MODELS } from "./client";

export interface InteractionResponse {
  id: string;
  outputs: Array<{
    text?: string;
    type: string;
  }>;
  status: string;
}

/**
 * Create a new interaction for stateful conversation
 */
export async function createInteraction(
  input: string,
  previousInteractionId?: string
): Promise<InteractionResponse> {
  try {
    const interaction = await geminiClient.interactions.create({
      model: MODELS.FLASH,
      input,
      previous_interaction_id: previousInteractionId,
    });

    return {
      id: interaction.id,
      outputs: interaction.outputs || [],
      status: interaction.status || "completed",
    };
  } catch (error) {
    console.error("Error creating interaction:", error);
    throw new Error("Failed to create interaction");
  }
}

/**
 * Get an existing interaction by ID
 */
export async function getInteraction(
  interactionId: string
): Promise<InteractionResponse> {
  try {
    const interaction = await geminiClient.interactions.get(interactionId);
    return {
      id: interaction.id,
      outputs: interaction.outputs || [],
      status: interaction.status || "completed",
    };
  } catch (error) {
    console.error("Error getting interaction:", error);
    throw new Error("Failed to get interaction");
  }
}

/**
 * Generate text using Gemini 3 Flash
 */
export async function generateText(
  prompt: string,
  previousInteractionId?: string
): Promise<string> {
  const interaction = await createInteraction(prompt, previousInteractionId);

  const textOutput = interaction.outputs.find((output) => output.type === "text");
  if (!textOutput?.text) {
    throw new Error("No text output received from Gemini");
  }

  return textOutput.text;
}

/**
 * Generate text AND return interaction ID in a single API call.
 * Use this to avoid making a second createInteraction() call.
 */
export async function generateTextWithId(
  prompt: string,
  previousInteractionId?: string
): Promise<{ text: string; interactionId: string }> {
  const interaction = await createInteraction(prompt, previousInteractionId);

  const textOutput = interaction.outputs.find((output) => output.type === "text");
  if (!textOutput?.text) {
    throw new Error("No text output received from Gemini");
  }

  return {
    text: textOutput.text,
    interactionId: interaction.id,
  };
}

/**
 * Generate text with retry logic and exponential backoff.
 * Retries up to maxRetries times if generation fails or returns empty content.
 */
export async function generateTextWithIdRetry(
  prompt: string,
  previousInteractionId?: string,
  maxRetries: number = 3
): Promise<{ text: string; interactionId: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateTextWithId(prompt, previousInteractionId);
      if (result.text && result.text.trim().length > 0) {
        return result;
      }
      // Empty response, treat as failure
      lastError = new Error("Empty response received from Gemini");
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit error - use longer backoff
      const errorMessage = lastError.message || String(error);
      const errorObj = error as any;
      const errorCode = errorObj?.error?.code || errorObj?.status;
      const isRateLimit = 
        /429/i.test(errorMessage) ||
        /RESOURCE_EXHAUSTED/i.test(errorMessage) ||
        /quota/i.test(errorMessage) ||
        errorCode === 429 ||
        errorCode === "RESOURCE_EXHAUSTED";
      
      // If rate limited and not last attempt, use longer backoff
      if (isRateLimit && attempt < maxRetries) {
        const delayMs = 2000 * attempt; // 2s, 4s, 6s for rate limits
        console.log(`Rate limit hit, retrying text generation in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
    }

    // Exponential backoff before retry (1s, 2s, 3s) with jitter
    if (attempt < maxRetries) {
      const baseDelay = 1000 * attempt;
      const jitter = Math.random() * 300; // Add up to 300ms jitter
      await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
    }
  }

  throw new Error(
    `Failed to generate content after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/** Maximum character length for a single option */
const MAX_OPTION_LENGTH = 150;

/**
 * Sanitize and clamp a single extracted option string
 */
function sanitizeOption(text: string): string {
  let cleaned = text
    .trim()
    // Strip leading/trailing quotes, brackets, commas
    .replace(/^[\[\]"'`,;:\s]+|[\[\]"'`,;:\s]+$/g, '')
    // Remove bullet points and list numbers
    .replace(/^[-*]\s*/, '')
    .replace(/^\d+[.):\s]+/, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Cap length at a sentence boundary if possible
  if (cleaned.length > MAX_OPTION_LENGTH) {
    // Try to cut at a sentence end
    const sentenceEnd = cleaned.substring(0, MAX_OPTION_LENGTH).lastIndexOf('.');
    if (sentenceEnd > 40) {
      cleaned = cleaned.substring(0, sentenceEnd + 1).trim();
    } else {
      // Otherwise cut at word boundary
      const wordBoundary = cleaned.substring(0, MAX_OPTION_LENGTH).lastIndexOf(' ');
      if (wordBoundary > 40) {
        cleaned = cleaned.substring(0, wordBoundary).trim() + '...';
      } else {
        cleaned = cleaned.substring(0, MAX_OPTION_LENGTH).trim() + '...';
      }
    }
  }

  return cleaned;
}

/**
 * Robust JSON extraction from LLM responses that may include extra text.
 * Returns sanitized, length-capped options.
 * Throws an error if extraction fails - no fallbacks.
 */
export function extractJsonArray(response: string, expectedLength?: number): string[] {
  if (!response || typeof response !== 'string') {
    throw new Error("Invalid or empty response provided for JSON extraction");
  }

  // Clean up common LLM artifacts
  const cleanResponse = response
    .trim()
    .replace(/^```(?:json)?\s*/i, '') // Remove markdown code blocks
    .replace(/\s*```$/, '')
    .replace(/^["`']|["`']$/gm, '') // Remove surrounding quotes
    .replace(/^\s*["`']|["`']\s*$/gm, ''); // Remove quotes at start/end of lines

  // Multiple regex patterns to handle different LLM response formats
  const patterns = [
    /\[[\s\S]*?\]/,  // Standard JSON array
    /\{[\s\S]*?\}/,  // JSON object (in case they return an object)
    /"(\[[\s\S]*?\])"/,  // JSON array wrapped in quotes
    /'(\[[\s\S]*?\])'/,  // JSON array wrapped in single quotes
  ];

  for (const pattern of patterns) {
    const match = cleanResponse.match(pattern);
    if (match) {
      try {
        // Extract the matched content (handle capturing groups)
        const jsonContent = match[1] || match[0];

        // Try to parse as JSON
        const parsed = JSON.parse(jsonContent);

        // Handle different return types
        let array: string[];
        if (Array.isArray(parsed)) {
          array = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // If they returned an object with an array property, try to extract it
          const values = Object.values(parsed);
          const firstArray = values.find(val => Array.isArray(val));
          if (firstArray) {
            array = firstArray as string[];
          } else {
            // Convert object values to strings
            array = values.map(val => String(val));
          }
        } else {
          continue; // Not usable, try next pattern
        }

        // Validate, sanitize, and clamp the array
        const cleanedArray = array
          .filter(item => item != null && item !== '')
          .map(item => sanitizeOption(String(item)))
          .filter(item => item.length > 5); // Minimum reasonable length

        if (cleanedArray.length > 0) {
          return cleanedArray;
        }
      } catch {
        // If JSON parsing fails for this pattern, keep trying other patterns
        continue;
      }
    }
  }

  // Fallback: manual line-based extraction
  // Split on newlines, semicolons, or numbered items
  const lines = cleanResponse
    .replace(/\n+/g, '\n')
    .split(/[\n;]|(?=\d+[.)\s])/)
    .map(line => sanitizeOption(line))
    .filter(line => line.length > 10); // Must be meaningful

  if (lines.length > 0) {
    return lines.slice(0, expectedLength || 3);
  }

  // No fallbacks - throw error
  throw new Error(`Failed to extract valid JSON array from response: "${response.substring(0, 100)}..."`);
}

/**
 * Extract a single text response with cleanup.
 * Throws an error if response is invalid or too short.
 */
export function extractSingleText(response: string, minLength: number = 10): string {
  if (!response || typeof response !== 'string') {
    throw new Error("Invalid response provided for text extraction");
  }

  const cleaned = response
    .trim()
    .replace(/^["'`]|["'`]$/g, '') // Remove surrounding quotes
    .replace(/\n+/g, ' ') // Normalize line breaks
    .trim();

  if (cleaned.length < minLength) {
    throw new Error(`Extracted text is too short (${cleaned.length} chars, minimum ${minLength})`);
  }

  return cleaned;
}
