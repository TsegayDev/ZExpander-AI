"use client";

import { createContext, useContext } from 'react';
import type { AIModel } from '@/lib/types';

export interface ModelContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  isPremiumModel: boolean;
  availableModels: AIModel[];
  filterModelsByTier: (tier: 'all' | 'free' | 'premium') => AIModel[];
}

export const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
};