"use client";

import { useState, ReactNode, useMemo } from 'react';
import type { AIModel } from '@/lib/types';
import { aiModels } from '@/lib/models';
import { ModelContext } from '@/hooks/use-model';

const STORAGE_KEY = 'selected-ai-model';

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const [selectedModel, setSelectedModelState] = useState<AIModel>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = aiModels.find(m => m.id === parsed.id);
          if (found) return found;
        } catch (e) {
          console.error('Failed to parse saved model', e);
        }
      }
    }
    return aiModels[0];
  });

  const setSelectedModel = (model: AIModel) => {
    setSelectedModelState(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: model.id }));
    }
  };

  const isPremiumModel = selectedModel.isPremium || false;

  const filterModelsByTier = (tier: 'all' | 'free' | 'premium'): AIModel[] => {
    if (tier === 'all') return aiModels;
    if (tier === 'free') return aiModels.filter(m => !m.isPremium);
    return aiModels.filter(m => m.isPremium);
  };

  const value = useMemo(() => ({
    selectedModel,
    setSelectedModel,
    isPremiumModel,
    availableModels: aiModels,
    filterModelsByTier
  }), [selectedModel, isPremiumModel]);

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};
