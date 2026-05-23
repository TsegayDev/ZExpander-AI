import type { ProcessingMode } from '@/lib/types';
import type { AnalyzeToneOutput } from '@/ai/flows/analyze-tone';
import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import type { AIDetectionOutput } from '@/ai/flows/ai-detection';
import type { PlagiarismOutput } from '@/ai/flows/plagiarism-checker';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function post<T>(endpoint: string, body: object): Promise<{ success: boolean; data?: T; error?: string }> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function processTextAction(params: {
  text: string;
  mode: ProcessingMode;
  model: string;
  customPrompt?: string;
  maxWords?: number;
}) {
  return post<string>('/process-text', params);
}

export function analyzeToneAction(params: { text: string; model: string }) {
  return post<AnalyzeToneOutput>('/analyze-tone', params);
}

export function summarizeDocumentAction(params: { text: string; model: string }) {
  return post<SummarizeDocumentOutput>('/summarize-document', params);
}

export function hummanizeAction(params: { text: string; model: string; style?: string; maxWords?: number }) {
  return post<string>('/hummanize', params);
}

export function aiDetectionAction(params: { text: string; model: string }) {
  return post<AIDetectionOutput>('/ai-detection', params);
}

export function plagiarismCheckAction(params: { text: string; model: string }) {
  return post<PlagiarismOutput>('/plagiarism-check', params);
}

export function generateDocxAction(params: { htmlString: string }) {
  return post<string>('/generate-docx', params);
}

export function extractTextFromFileAction(params: { fileBuffer: string; fileType: string }) {
  return post<string>('/extract-text', params);
}
