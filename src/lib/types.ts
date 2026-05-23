import type { AnalyzeToneOutput } from '@/ai/flows/analyze-tone';
import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';

export type AppMode = 'text-toolkit' | 'document-summary' | 'tone-analysis' | 'ai-detection' | 'humanizer' | 'plagiarism-checker';

export type HistoryItem = {
  id: string;
  original: string;
  expanded: string;
  timestamp: number;
  model: string;
  type: AppMode;
};

export type AIModel = {
  id: string;
  name: string;
  provider: string;
  speed: 'Very Fast' | 'Fast' | 'Moderate' | 'Slow';
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  icon?: React.ElementType;
  description?: string;
  maxTokens?: number;
  isPremium?: boolean;
};

export type UserPlan = 'Free' | 'Pro' | 'Unlimited';
export type Feature = 'expansions' | 'fileUploads';

export type PlanDetails = {
  plan: UserPlan;
  isPremium: boolean;
  dailyTokensUsed: number;
  dailyFileUploadsUsed: number;
  lastUsageDate: string; // YYYY-MM-DD
};

export interface AppUser extends PlanDetails {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

export type UsageCounts = {
  [key in Feature]: number;
};

export type ProcessingMode =
  | 'expand'
  | 'summarize'
  | 'rephrase-formal'
  | 'rephrase-professional'
  | 'rephrase-casual'
  | 'rephrase-creative'
  | 'fix-grammar'
  | 'custom'
  | 'ai-detect'
  | 'humanize'
  | 'plagiarism-check';

export interface ViewProps {
  onProcess: () => void;
  isLoading: boolean;
  hasTokens: boolean;
}

export interface DocumentSummaryViewProps extends ViewProps {
  output: SummarizeDocumentOutput | null;
  setOutput: (output: SummarizeDocumentOutput | null) => void;
}

export interface ToneAnalysisViewProps extends ViewProps {
  output: AnalyzeToneOutput | null;
  setOutput: (output: AnalyzeToneOutput | null) => void;
}

// Helper type for model filtering
export type ModelFilter = 'all' | 'fast' | 'premium' | 'free';

// Model capabilities mapping
export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  maxContextLength: number;
  pricingPer1kTokens: {
    input: number;
    output: number;
  };
}