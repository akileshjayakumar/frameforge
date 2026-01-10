import { GameState, GameStatus } from "@/types/game";

const INITIAL_STATE: GameState = {
  topic: null,
  genre: null,
  story: [],
  currentTurn: 0,
  interactionId: null,
  isUserTurn: true,
  gameStatus: "topic-selection",
  finalImages: [],
  turnImages: [],
  imageGenerationProgress: 0,
  finalVideoUrl: null,
  videoAssetUrl: null,
  videoOperationName: null,
  videoGenerationStatus: 'idle',
  videoFetchStatus: 'idle',
  videoPreferences: null,
  userContributions: [],
  aiContributions: [],
};

export function createInitialGameState(): GameState {
  return { ...INITIAL_STATE };
}

export function updateGameStatus(
  state: GameState,
  status: GameStatus
): GameState {
  return { ...state, gameStatus: status };
}

export function setTopic(state: GameState, topic: string): GameState {
  return { ...state, topic, gameStatus: "playing", currentTurn: 1, isUserTurn: false };
}

export function setGenre(state: GameState, genre: string): GameState {
  return {
    ...state,
    genre,
    topic: null,
    gameStatus: "playing",
    currentTurn: 0,
    isUserTurn: true,
  };
}

export function addStoryTurn(
  state: GameState,
  turnNumber: number,
  author: "user" | "ai",
  content: string
): GameState {
  const newTurn = {
    id: `turn-${turnNumber}-${author}-${Date.now()}`,
    turnNumber,
    author,
    content,
    timestamp: new Date(),
  };

  const updatedStory = [...state.story, newTurn];
  const isUserTurn = author === "ai"; // Next turn switches

  return {
    ...state,
    story: updatedStory,
    currentTurn: turnNumber,
    isUserTurn,
  };
}

export function setInteractionId(
  state: GameState,
  interactionId: string
): GameState {
  return { ...state, interactionId };
}

export function setFinalImages(state: GameState, imageUrls: string[]): GameState {
  return { ...state, finalImages: imageUrls };
}

export function setFinalImage(state: GameState, imageUrl: string): GameState {
  return { ...state, finalImages: [...state.finalImages, imageUrl] };
}

export function resetGameState(): GameState {
  return createInitialGameState();
}
