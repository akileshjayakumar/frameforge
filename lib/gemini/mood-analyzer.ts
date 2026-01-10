import { geminiClient, MODELS } from "./client";

export interface MusicPrompt {
  prompt: string;
  weight: number;
}

/**
 * Analyze story text to determine appropriate music prompts for Lyria
 */
export async function analyzeStoryMood(storyText: string): Promise<MusicPrompt> {
  try {
    const analysisPrompt = `Analyze this story excerpt and determine the mood, tone, and genre. 
Return ONLY a JSON object with two fields:
- "prompt": A concise music prompt (2-4 words) describing the mood/genre (e.g., "mysterious sci-fi", "tense action", "hopeful resolution", "ambient space")
- "weight": A number between 0.5 and 2.0 indicating the intensity (1.0 is default)

Story: "${storyText}"

Return ONLY valid JSON, no other text.`;

    const response = await geminiClient.models.generateContent({
      model: MODELS.FLASH,
      contents: analysisPrompt,
    });

    const typedResponse = response as { text?: string };
    const text = typedResponse.text ?? "";
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback to default
      return {
        prompt: "ambient sci-fi",
        weight: 1.0,
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as { prompt?: string; weight?: number };
      return {
        prompt: parsed.prompt || "ambient sci-fi",
        weight: Math.max(0.5, Math.min(2.0, parsed.weight || 1.0)),
      };
    } catch {
      // Fallback to default
      return {
        prompt: "ambient sci-fi",
        weight: 1.0,
      };
    }
  } catch (error) {
    console.error("Error analyzing story mood:", error);
    // Return default mood
    return {
      prompt: "ambient sci-fi",
      weight: 1.0,
    };
  }
}
