import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set in the environment. AI features will fail.');
}

// Initializing the client as requested by the user.
export const ai = new GoogleGenAI(apiKey ? { apiKey } : {});
