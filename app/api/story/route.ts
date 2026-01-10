import { NextRequest, NextResponse } from "next/server";
import { generateTextWithIdRetry, extractJsonArray, extractSingleText } from "@/lib/gemini/interactions";

/** Maximum allowed length for a single option */
const MAX_OPTION_LEN = 150;

/**
 * Final sanitization pass for a single option string
 */
function sanitizeOptionText(text: string): string {
  let s = text
    .trim()
    .replace(/^[\[\]"'`,;:\s]+|[\[\]"'`,;:\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (s.length > MAX_OPTION_LEN) {
    const cut = s.substring(0, MAX_OPTION_LEN).lastIndexOf(' ');
    s = (cut > 30 ? s.substring(0, cut) : s.substring(0, MAX_OPTION_LEN)).trim() + '...';
  }

  return s;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storySoFar,
      genre,
      previousInteractionId,
      turnType,
    } = body;

    if (!storySoFar) {
      return NextResponse.json(
        { error: "storySoFar is required" },
        { status: 400 }
      );
    }

    const g = genre || "sci-fi";

    if (turnType === "user-options") {
      // Prompt with strict JSON formatting instructions
      const prompt = `You are a ${g} writer. Story so far: "${storySoFar}"

Generate exactly 3 short sentence continuations (1-2 sentences each) that:
- Follow the story logically
- Offer different directions (hopeful, mysterious, dramatic)

CRITICAL: You MUST return ONLY a valid JSON array with exactly 3 strings.
Format: ["option 1", "option 2", "option 3"]`;

      // Use retry logic - will throw if all retries fail
      const { text: response, interactionId } = await generateTextWithIdRetry(
        prompt,
        previousInteractionId,
        3
      );

      // Extract options - will throw if extraction fails
      const rawOptions: string[] = extractJsonArray(response, 3);

      // Sanitize and validate
      const options = rawOptions
        .map(sanitizeOptionText)
        .filter(opt => opt.length > 10);

      if (options.length === 0) {
        throw new Error("No valid options extracted from AI response");
      }

      // Ensure we have exactly 3 options
      if (options.length < 3) {
        throw new Error(`Expected 3 options, got ${options.length}. AI response may be malformed.`);
      }

      const sentenceOptions = options.slice(0, 3).map((text, index) => ({
        id: `option-${index + 1}`,
        text,
      }));

      return NextResponse.json({
        options: sentenceOptions,
        interactionId,
      });
    } else {
      // AI turn - generate story continuation
      const prompt = `You are a ${g} storyteller. Story so far: "${storySoFar}"

Add exactly 1-2 sentences that advance the plot with a surprising but logical development. Return ONLY the sentence(s), no quotes or explanation.`;

      // Use retry logic - will throw if all retries fail
      const { text: response, interactionId } = await generateTextWithIdRetry(
        prompt,
        previousInteractionId,
        3
      );

      // Extract and validate - will throw if too short
      const aiSentence = extractSingleText(response, 10);

      // Take first complete sentence if response is very long
      let finalSentence = aiSentence;
      const sentenceMatch = aiSentence.match(/^[^.!?]*[.!?]/);
      if (sentenceMatch && aiSentence.length > 200) {
        finalSentence = sentenceMatch[0];
      }

      // Ensure proper punctuation
      if (!finalSentence.match(/[.!?]$/)) {
        finalSentence += '.';
      }

      return NextResponse.json({
        sentence: finalSentence,
        interactionId,
      });
    }
  } catch (error) {
    console.error("Error in story API:", error);
    const message = error instanceof Error ? error.message : "Failed to generate story content";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
