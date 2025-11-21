'use server';
/**
 * @fileOverview Expands a short sentence into a detailed version using a selected AI model.
 *
 * - expandSentence - A function that expands the sentence.
 * - ExpandSentenceInput - The input type for the expandSentence function.
 * - ExpandSentenceOutput - The return type for the expandSentence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandSentenceInputSchema = z.object({
  sentence: z.string().describe('The short sentence to expand.'),
  model: z.string().describe('The AI model to use for expansion.'),
  maxWords: z.number().describe('The maximum number of words in the expanded sentence.'),
  tone: z.string().describe('The tone of voice for the expansion (e.g., Formal, Casual).'),
});
export type ExpandSentenceInput = z.infer<typeof ExpandSentenceInputSchema>;

const ExpandSentenceOutputSchema = z.object({
  expandedSentence: z.string().describe('The expanded sentence.'),
});
export type ExpandSentenceOutput = z.infer<typeof ExpandSentenceOutputSchema>;

export async function expandSentence(input: ExpandSentenceInput): Promise<ExpandSentenceOutput> {
  return expandSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandSentencePrompt',
  input: {schema: ExpandSentenceInputSchema},
  output: {schema: ExpandSentenceOutputSchema},
  prompt: `You are an AI expert in expanding sentences into detailed and elaborated versions.

  Expand the following sentence using the specified AI model. The expanded sentence should not exceed the specified word limit and should match the requested tone.

  Sentence: {{{sentence}}}
  AI Model: {{{model}}}
  Max Words: {{{maxWords}}}
  Tone: {{{tone}}}

  Expanded Sentence:`, 
});

const expandSentenceFlow = ai.defineFlow(
  {
    name: 'expandSentenceFlow',
    inputSchema: ExpandSentenceInputSchema,
    outputSchema: ExpandSentenceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
