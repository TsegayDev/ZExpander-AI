
"use client";

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, BrainCircuit, Check } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { useModel } from '@/hooks/use-model';

export const aiModels: AIModel[] = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google' },
];

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useModel();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto justify-between bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 rounded-full shadow-sm h-auto py-1.5 px-2">
            <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-muted-foreground" />
                <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground/90">{selectedModel.name}</span>
                </div>
            </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[220px]">
        {aiModels.map(model => (
            <DropdownMenuItem key={model.id} onSelect={() => setSelectedModel(model)} className="p-2 cursor-pointer">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span>{model.name}</span>
                        <Badge variant="secondary" className="w-fit text-xs font-normal">{model.provider}</Badge>
                    </div>
                </div>
                {selectedModel.id === model.id && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
