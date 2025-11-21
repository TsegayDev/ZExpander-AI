
import type { User } from 'firebase/auth';
import type { AnalyzeToneOutput } from '@/ai/flows/analyze-tone';
import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';

export type AppMode = 'text-toolkit' | 'document-summary' | 'tone-analysis';

export type HistoryItem = {
  id: string;
  original: string;
  expanded: string;
  timestamp: number;
  model: string;
  type: AppMode;
};

export type AIModel = {
  id:string;
  name: string;
  provider: string;
};

export type UserPlan = "Free" | "Pro" | "Unlimited";
export type Feature = "expansions" | "fileUploads";

export type PlanDetails = {
    plan: UserPlan;
    isPremium: boolean;
    dailyTokensUsed: number;
    dailyFileUploadsUsed: number;
    lastUsageDate: string; // YYYY-MM-DD
}

export interface AppUser extends User, PlanDetails {}

export type UsageCounts = {
    [key in Feature]: number;
}

export type ProcessingMode =
  | 'expand'
  | 'summarize'
  | 'rephrase-formal'
  | 'rephrase-professional'
  | 'rephrase-casual'
  | 'rephrase-creative'
  | 'fix-grammar'
  | 'custom';

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
