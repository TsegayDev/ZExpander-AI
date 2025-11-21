
'use server';
/**
 * @fileOverview A multi-purpose AI text processing agent.
 *
 * - processText - A function that handles various text operations like expanding, summarizing, and rephrasing.
 * - ProcessTextInput - The input type for the processText function.
 * - ProcessTextOutput - The return type for the processText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const ProcessTextInputSchema = z.object({
  text: z.string().describe('The input text to process.'),
  model: z.string().describe('The AI model to use for expansion.'),
  mode: z
    .string()
    .describe(
      'The processing mode: expand, summarize, rephrase-formal, rephrase-professional, rephrase-casual, rephrase-creative, fix-grammar'
    ),
  customPrompt: z
    .string()
    .optional()
    .describe(
      'A custom user-defined prompt that overrides the mode. e.g., "Translate this to French"'
    ),
  maxWords: z
    .number()
    .optional()
    .describe('The maximum number of words for the output.'),
});
export type ProcessTextInput = z.infer<typeof ProcessTextInputSchema>;

const ProcessTextOutputSchema = z.object({
  processedText: z.string().describe('The resulting text after processing.'),
});
export type ProcessTextOutput = z.infer<typeof ProcessTextOutputSchema>;

export async function processText(
  input: ProcessTextInput
): Promise<ProcessTextOutput> {
  return processTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processTextPrompt',
  input: {schema: ProcessTextInputSchema},
  output: {schema: ProcessTextOutputSchema},
  prompt: `You are an expert AI writing assistant. Your task is to process the given text based on the user's instructions.
{{#if customPrompt}}
Follow this instruction: {{{customPrompt}}}
Text to process:
"{{{text}}}"
{{else}}
  {{#if expand}}
  Expand the following text into a detailed, well-written piece. {{#if maxWords}}The output should be approximately {{maxWords}} words.{{/if}}
  Text to expand: "{{{text}}}"
  {{/if}}
  {{#if summarize}}
  Summarize the following text. {{#if maxWords}}The output should be approximately {{maxWords}} words.{{/if}}
  Text to summarize: "{{{text}}}"
  {{/if}}
  {{#if rephrase-formal}}
  Rephrase the following text in a formal and professional tone.
  Text to rephrase: "{{{text}}}"
  {{/if}}
  {{#if rephrase-professional}}
  Rewrite the following text to sound more professional and authoritative.
  Text to rephrase: "{{{text}}}"
  {{/if}}
  {{#if rephrase-casual}}
  Rephrase the following text in a more casual and conversational tone.
  Text to rephrase: "{{{text}}}"
  {{/if}}
  {{#if rephrase-creative}}
  Rewrite the following text in a more creative and engaging style.
  Text to rephrase: "{{{text}}}"
  {{/if}}
  {{#if fix-grammar}}
  Fix any spelling and grammar mistakes in the following text.
Text to fix: "{{{text}}}"
  {{/if}}
{{/if}}

Output the result as a JSON object with a single key "processedText".`,
});

const processTextFlow = ai.defineFlow(
  {
    name: 'processTextFlow',
    inputSchema: ProcessTextInputSchema,
    outputSchema: ProcessTextOutputSchema,
  },
  async (input) => {
    // Create an object to pass to Handlebars that has a boolean flag for the selected mode.
    // This avoids using logic in the template itself.
    const handlebarsInput: Record<string, any> = {
      text: input.text,
      customPrompt: input.customPrompt,
      maxWords: input.maxWords,
      model: googleAI.model(input.model),
    };
    handlebarsInput[input.mode] = true;
    
    const {output} = await prompt(handlebarsInput, {
      model: googleAI.model(input.model),
      output: {
        format: 'json',
      },
    });

    return output!;
  }
);
