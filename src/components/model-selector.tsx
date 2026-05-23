"use client";

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  BrainCircuit,
  Check,
  Zap,
  Sparkles,
  Cpu,
  Gauge,
  Star
} from "lucide-react";
import type { AIModel, ModelFilter } from "@/lib/types";
import { useModel } from '@/hooks/use-model';
import { aiModels } from '@/lib/models';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Simplified provider configurations
const providerConfig = {
  Google: { color: 'from-emerald-500 to-teal-500', icon: Sparkles },
  OpenAI: { color: 'from-blue-500 to-cyan-500', icon: Cpu },
  Anthropic: { color: 'from-purple-500 to-pink-500', icon: BrainCircuit },
};

// Simplified speed indicators
const speedConfig = {
  'Very Fast': { icon: Zap, color: 'text-emerald-600 dark:text-emerald-400' },
  'Fast': { icon: Zap, color: 'text-blue-600 dark:text-blue-400' },
  'Moderate': { icon: Gauge, color: 'text-yellow-600 dark:text-yellow-400' },
  'Slow': { icon: Gauge, color: 'text-orange-600 dark:text-orange-400' },
};

interface ModelSelectorProps {
  showFilter?: boolean;
  onModelChange?: (model: AIModel) => void;
  className?: string;
}

export function ModelSelector({ showFilter = false, onModelChange, className }: ModelSelectorProps) {
  const { selectedModel, setSelectedModel } = useModel();
  const [isOpen, setIsOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<ModelFilter>('all');

  const filteredModels = React.useMemo(() => {
    if (filter === 'all') return aiModels;
    if (filter === 'fast') return aiModels.filter(m => m.speed === 'Very Fast' || m.speed === 'Fast');
    if (filter === 'premium') return aiModels.filter(m => m.isPremium);
    if (filter === 'free') return aiModels.filter(m => !m.isPremium);
    return aiModels;
  }, [filter]);

  const selectedModelData = aiModels.find(m => m.id === selectedModel.id) || aiModels[0];
  const SelectedIcon = providerConfig[selectedModelData.provider as keyof typeof providerConfig]?.icon || BrainCircuit;
  const speedInfo = speedConfig[selectedModelData.speed as keyof typeof speedConfig] || speedConfig.Moderate;
  const SpeedIcon = speedInfo.icon;

  const handleModelSelect = (model: AIModel) => {
    setSelectedModel(model);
    onModelChange?.(model);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "group relative w-full sm:w-auto",
            className
          )}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-br from-background to-background/80 border border-border/50 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md">
            {/* Model Icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 blur-md opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10">
                <SelectedIcon className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Model Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{selectedModel.name}</span>
                <div className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white bg-gradient-to-r",
                  providerConfig[selectedModelData.provider as keyof typeof providerConfig]?.color
                )}>
                  {selectedModelData.provider}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={cn("flex items-center gap-1 text-[10px]", speedInfo.color)}>
                  <SpeedIcon className="h-2.5 w-2.5" />
                  <span>{selectedModelData.speed}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="text-[10px] text-muted-foreground">
                  {selectedModelData.quality}
                </div>
                {selectedModelData.isPremium && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <div className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      <span>Pro</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[360px] bg-background/98 backdrop-blur-xl border-border/50 rounded-xl shadow-xl p-1.5"
        align="end"
        sideOffset={8}
      >
        {/* Header with filters */}
        <div className="px-2 py-2 mb-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-muted-foreground tracking-wider">
              AI MODELS
            </p>
            {showFilter && (
              <div className="flex gap-1">
                {(['all', 'fast', 'premium', 'free'] as ModelFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-md transition-all duration-150 font-medium",
                      filter === f
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {f === 'all' ? 'All' : f === 'fast' ? '⚡ Fast' : f === 'premium' ? '👑 Pro' : '✨ Free'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Model List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="max-h-[320px] overflow-y-auto space-y-1 px-1"
          >
            {filteredModels.map((model) => {
              const isSelected = selectedModel.id === model.id;
              const ProviderIcon = providerConfig[model.provider as keyof typeof providerConfig]?.icon || BrainCircuit;
              const modelSpeedInfo = speedConfig[model.speed as keyof typeof speedConfig] || speedConfig.Moderate;
              const ModelSpeedIcon = modelSpeedInfo.icon;

              return (
                <DropdownMenuItem
                  key={model.id}
                  onSelect={() => handleModelSelect(model)}
                  className={cn(
                    "p-2 cursor-pointer rounded-lg transition-all duration-150",
                    isSelected && "bg-gradient-to-r from-primary/5 to-purple-600/5 border border-primary/20",
                    "hover:bg-accent/50 focus:bg-accent/50"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {/* Model Icon */}
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-150",
                      isSelected ? "bg-gradient-to-br from-primary/20 to-purple-600/20" : "bg-muted/50"
                    )}>
                      <ProviderIcon className={cn(
                        "h-3.5 w-3.5 transition-all duration-150",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>

                    {/* Model Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected && "text-primary"
                        )}>
                          {model.name}
                        </span>
                        <div className={cn(
                          "px-1.5 py-0.5 rounded-md text-[9px] font-medium text-white bg-gradient-to-r",
                          providerConfig[model.provider as keyof typeof providerConfig]?.color
                        )}>
                          {model.provider}
                        </div>
                        {model.isPremium && (
                          <div className="flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-400">
                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                            <span>Pro</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1.5">
                        {model.description}
                      </p>

                      <div className="flex items-center gap-2 text-[9px]">
                        <div className={cn("flex items-center gap-0.5", modelSpeedInfo.color)}>
                          <ModelSpeedIcon className="h-2.5 w-2.5" />
                          <span>{model.speed}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-muted-foreground">{model.quality}</span>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-muted-foreground font-mono">
                          {model.maxTokens?.toLocaleString()} ctx
                        </span>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <div className="p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredModels.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No models available</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}