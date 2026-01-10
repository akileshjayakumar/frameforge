import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const MODELS = {
  FLASH: "gemini-3-flash-preview",
  IMAGE_PRO: "gemini-3-pro-image-preview",
  NANO_BANANA: "gemini-2.5-flash-image",
  TTS: "gemini-2.5-pro-tts",
  VEO: "veo-3.1-generate-preview",
} as const;



