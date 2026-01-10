export interface StoryTurn {
  id: string;
  turnNumber: number;
  author: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export type GameStatus =
  | 'topic-selection'
  | 'playing'
  | 'generating-image'
  | 'video-preferences'  // User setting video preferences
  | 'generating-video'
  | 'voting'
  | 'complete';

/**
 * Video style options for Veo 3.1 generation
 */
export type VideoStyle =
  | 'live-action'   // Photorealistic, cinematic
  | 'animation'     // Stylized 3D animation
  | 'stop-motion'   // Stop-motion style
  | 'anime'         // Japanese anime style
  | 'watercolor'    // Artistic watercolor
  | 'noir';         // Film noir style

/**
 * Video duration options (seconds)
 */
export type VideoDuration = 4 | 6 | 8;

/**
 * Video aspect ratio options
 */
export type VideoAspectRatio = '16:9' | '9:16';

/**
 * Video resolution options
 */
export type VideoResolution = '720p' | '1080p';

/**
 * User preferences for video generation
 */
export interface VideoPreferences {
  style: VideoStyle;
  durationSeconds: VideoDuration;
  aspectRatio?: VideoAspectRatio; // Optional, defaults to "16:9"
  resolution?: VideoResolution; // Optional, defaults to "720p"
  negativePrompt?: string; // Optional, rarely used
  genreOverride?: string; // Optional, defaults to story genre
}

export interface GameState {
  topic: string | null;
  genre: string | null;
  story: StoryTurn[];
  currentTurn: number;
  interactionId: string | null;
  isUserTurn: boolean;
  gameStatus: GameStatus;
  finalImages: string[];
  turnImages: string[]; // Images generated per turn
  imageGenerationProgress: number; // 0-4 for parallel image generation
  finalVideoUrl: string | null; // Veo video URL
  videoAssetUrl: string | null; // Raw Veo video URI (may need proxy)
  videoOperationName: string | null; // Operation name for polling/download
  videoGenerationStatus: 'idle' | 'generating' | 'complete' | 'error';
  videoFetchStatus: 'idle' | 'fetching' | 'ready' | 'error';
  videoPreferences: VideoPreferences | null;
  userContributions: string[];
  aiContributions: string[];
}

export interface TopicOption {
  id: string;
  text: string;
}

export interface SentenceOption {
  id: string;
  text: string;
}

export interface GameContextType {
  gameState: GameState;
  selectGenre: (genre: string) => void;
  selectTopic: (topic: string) => void;
  addUserSentence: (sentence: string) => Promise<void>;
  addAiSentence: () => Promise<void>;
  setGameStatus: (status: GameStatus) => void;
  setFinalImageUrl: (imageUrl: string) => void;
  resetGame: () => void;
  generateTopics: () => Promise<TopicOption[]>;
  generateSentenceOptions: () => Promise<SentenceOption[]>;
  generateComicImage: () => Promise<void>;
  setVideoPreferences: (preferences: VideoPreferences) => void;
  generateStoryVideo: () => Promise<void>;
  retryFetchVideo: () => Promise<void>;
}
