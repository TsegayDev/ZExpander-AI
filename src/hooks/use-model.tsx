
"use client";

import { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import type { AIModel } from '@/lib/types';
import { aiModels } from '@/components/model-selector';

interface ModelContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const [selectedModel, setSelectedModel] = useState<AIModel>(aiModels[0]);
  
  const value = useMemo(() => ({
    selectedModel,
    setSelectedModel
  }), [selectedModel]);

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
};
