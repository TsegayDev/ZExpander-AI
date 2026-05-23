'use server';
/**
 * @fileOverview Expands a short sentence into a detailed version using a selected AI model.
 *
 * - expandSentence - A function that expands the sentence.
 * - ExpandSentenceInput - The input type for the expandSentence function.
 * - ExpandSentenceOutput - The return type for the expandSentence function.
 */

import { z } from 'zod';
import { callGeminiModel } from '../utils';

export const ExpandSentenceInputSchema = z.object({
  sentence: z.string().describe('The short sentence to expand.'),
  model: z.string().describe('The AI model to use for expansion.'),
  maxWords: z.number().describe('The maximum number of words in the expanded sentence.'),
  tone: z.string().describe('The tone of voice for the expansion (e.g., Formal, Casual).'),
});
export type ExpandSentenceInput = z.infer<typeof ExpandSentenceInputSchema>;

export const ExpandSentenceOutputSchema = z.object({
  expandedSentence: z.string().describe('The expanded sentence.'),
});
export type ExpandSentenceOutput = z.infer<typeof ExpandSentenceOutputSchema>;

const EXPAND_PROMPT = `You are an AI expert in expanding sentences into detailed and elaborated versions.

Expand the following sentence using the specified AI model. The expanded sentence should not exceed the specified word limit and should match the requested tone.

Sentence: {{sentence}}
AI Model: {{model}}
Max Words: {{maxWords}}
Tone: {{tone}}

Expanded Sentence:`;

export async function expandSentence(input: ExpandSentenceInput): Promise<ExpandSentenceOutput> {
  return await callGeminiModel({
    model: input.model,
    prompt: EXPAND_PROMPT,
    input: input,
    outputSchema: ExpandSentenceOutputSchema,
  });
}

