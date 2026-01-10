import { StoryTurn } from "@/types/game";

/**
 * Build the full story text from story turns
 */
export function buildStoryText(storyTurns: StoryTurn[]): string {
  return storyTurns.map((turn) => turn.content).join(" ");
}

/**
 * Get the story so far up to a specific turn
 */
export function getStoryUpToTurn(
  storyTurns: StoryTurn[],
  turnNumber: number
): string {
  const turnsUpTo = storyTurns.filter((turn) => turn.turnNumber <= turnNumber);
  return buildStoryText(turnsUpTo);
}

/**
 * Separate user and AI contributions
 */
export function separateContributions(storyTurns: StoryTurn[]): {
  userContributions: string[];
  aiContributions: string[];
} {
  const userContributions: string[] = [];
  const aiContributions: string[] = [];

  storyTurns.forEach((turn) => {
    if (turn.author === "user") {
      userContributions.push(turn.content);
    } else {
      aiContributions.push(turn.content);
    }
  });

  return { userContributions, aiContributions };
}

/**
 * Create a new story turn
 */
export function createStoryTurn(
  turnNumber: number,
  author: "user" | "ai",
  content: string
): StoryTurn {
  return {
    id: `turn-${turnNumber}-${author}-${Date.now()}`,
    turnNumber,
    author,
    content,
    timestamp: new Date(),
  };
}
