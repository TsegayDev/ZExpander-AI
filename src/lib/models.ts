import { Zap, Crown, Gauge } from "lucide-react";
import type { AIModel } from "./types";

export const aiModels: AIModel[] = [
  {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'Google',
    speed: 'Very Fast',
    quality: 'Good',
    icon: Zap,
    description: 'Lightning speed for simple responses',
    maxTokens: 1048576,
    isPremium: false
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    speed: 'Moderate',
    quality: 'Excellent',
    icon: Crown,
    description: 'Top-tier reasoning and quality',
    maxTokens: 1048576,
    isPremium: true
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    speed: 'Fast',
    quality: 'Good',
    icon: Gauge,
    description: 'Advanced balanced model for general tasks',
    maxTokens: 1048576,
    isPremium: false
  },
];
