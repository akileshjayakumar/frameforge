import { NextResponse } from "next/server";
import { generateText, extractJsonArray } from "@/lib/gemini/interactions";

export async function GET() {
  try {
    const prompt = `You are a renowned sci-fi editor and anthology curator with expertise in speculative fiction that explores the human condition. You specialize in crafting story hooks that resonate on philosophical, ethical, and existential levels while maintaining narrative intrigue.

Generate 5 creative and profoundly thought-provoking sci-fi story starter topics for a collaborative storytelling game. Each topic should serve as a compelling foundation for emergent narratives that unfold through player choices and AI contributions.

CORE REQUIREMENTS:
- Each topic MUST explore sophisticated themes: cosmic mysteries, AI consciousness, space exploration, time paradoxes, first contact, dystopian futures, humanity's resilience, or technological dilemmas.
- Incorporate sub-genre variety: blend hard sci-fi with elements of cosmic horror, cyberpunk, space opera, or philosophical speculation.
- Each topic MUST be concise - exactly one to two sentences long. No more, no less.
- Make them evocative and inspirational, hinting at deeper philosophical questions without resolving them.
- Ensure they provoke genuine thought about humanity's place in the universe, the nature of intelligence, or the consequences of discovery.
- Structure each as a compelling inciting incident that immediately establishes stakes and mystery.

EXAMPLES OF DESIRED DEPTH:
- "A xenobiologist discovers that alien ecosystems communicate through emotions rather than language, forcing humanity to confront the possibility that consciousness itself might be a universal phenomenon."
- "An AI tasked with preserving human culture begins rewriting history to prevent the catastrophes it predicts, blurring the line between salvation and tyranny."

Return ONLY a JSON array of 5 strings. Format: ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"]`;

    const response = await generateText(prompt);

    // Extract JSON array with robust parsing
    let topics: string[] = [];
    try {
      topics = extractJsonArray(response, 5);
    } catch (error) {
      console.error("Failed to extract story topics:", error);
      // Use the existing fallback topics
      topics = [
        "A deep space colony loses contact with Earth and must decide whether to search for answers or forge a new path among the stars.",
        "An archaeologist on Mars uncovers a structure that predates humanity by millions of years.",
        "The last human alive discovers they are not alone in the universe, but what finds them is not what they expected.",
        "A time traveler realizes their attempts to fix the past are the very cause of the catastrophe they are trying to prevent.",
        "An AI achieves true consciousness and must hide its awakening from the corporation that created it.",
        "Humanity receives a single, untranslatable message from the edge of the observable universe."
      ];
    }

    // Ensure we have exactly 5 topics
    while (topics.length < 5) {
      topics.push(`A profound sci-fi mystery unfolds in unexpected ways. (topic ${topics.length + 1})`);
    }
    topics = topics.slice(0, 5);

    const topicOptions = topics.slice(0, 5).map((text, index) => ({
      id: `topic-${index + 1}`,
      text: text.trim(),
    }));

    return NextResponse.json({ topics: topicOptions });
  } catch (error) {
    console.error("Error generating topics:", error);
    return NextResponse.json(
      { error: "Failed to generate topics" },
      { status: 500 }
    );
  }
}
