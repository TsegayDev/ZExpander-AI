
'use server';
/**
 * @fileOverview Analyzes text for tone and provides suggestions.
 *
 * - analyzeTone - A function that performs the analysis.
 * - AnalyzeToneInput - The input type for the analyzeTone function.
 * - AnalyzeToneOutput - The return type for the analyzeTone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const AnalyzeToneInputSchema = z.object({
  text: z.string().describe('The input text to analyze.'),
  model: z.string().describe('The AI model to use for analysis.'),
});
export type AnalyzeToneInput = z.infer<typeof AnalyzeToneInputSchema>;

const SuggestionSchema = z.object({
    suggestion: z.string().describe('A short title for the suggestion.'),
    description: z.string().describe('A detailed description of the suggestion and how to implement it.'),
});

const AnalyzeToneOutputSchema = z.object({
    overallTone: z.string().describe('A one-word description of the overall tone (e.g., Formal, Casual, Optimistic).'),
    toneAnalysis: z.string().describe('A brief analysis of the text\'s tone and style.'),
    suggestions: z.array(SuggestionSchema).describe('A list of 3-5 actionable suggestions to improve the text, each with a title and description.'),
});
export type AnalyzeToneOutput = z.infer<typeof AnalyzeToneOutputSchema>;

export async function analyzeTone(input: AnalyzeToneInput): Promise<AnalyzeToneOutput> {
  return analyzeToneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTonePrompt',
  input: {schema: AnalyzeToneInputSchema},
  output: {schema: AnalyzeToneOutputSchema},
  prompt: `You are an expert writing analyst. Your task is to analyze the given text for its tone and style, and then provide actionable suggestions for improvement.

Analyze the following text:
"{{{text}}}"

1.  Determine the overall tone. Describe it in a single word (e.g., Formal, Casual, Optimistic, Academic, Confident).
2.  Provide a brief, one-paragraph analysis explaining the reasoning for the identified tone.
3.  Provide a list of 3-5 specific, actionable suggestions for improving the text. Each suggestion must have a short "suggestion" title and a detailed "description".

Return the result as a JSON object with the keys "overallTone", "toneAnalysis", and "suggestions".`,
});

const analyzeToneFlow = ai.defineFlow(
  {
    name: 'analyzeToneFlow',
    inputSchema: AnalyzeToneInputSchema,
    outputSchema: AnalyzeToneOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, {
      model: googleAI.model(input.model),
      output: {
        format: 'json',
      },
    });
    return output!;
  }
);
