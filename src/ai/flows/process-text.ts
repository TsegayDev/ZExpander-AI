
/**
 * @fileOverview A multi-purpose AI text processing agent.
 *
 * - processText - A function that handles various text operations like expanding, summarizing, and rephrasing.
 * - ProcessTextInput - The input type for the processText function.
 * - ProcessTextOutput - The return type for the processText function.
 */

import { z } from 'zod';
import { callGeminiModel } from '../utils';

export const ProcessTextInputSchema = z.object({
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

export const ProcessTextOutputSchema = z.object({
  processedText: z.string().describe('The resulting text after processing.'),
});
export type ProcessTextOutput = z.infer<typeof ProcessTextOutputSchema>;

export async function processText(
  input: ProcessTextInput
): Promise<ProcessTextOutput> {
  let promptText = "You are an expert AI writing assistant. Your task is to process the given text based on the user's instructions.\n\n";

  if (input.customPrompt) {
    promptText += `Follow this instruction: ${input.customPrompt}\nText to process:\n"${input.text}"`;
  } else {
    const maxWordsText = input.maxWords ? ` The output should be approximately ${input.maxWords} words.` : "";
    
    switch (input.mode) {
      case 'expand':
        promptText += `Expand the following text into a detailed, well-written piece.${maxWordsText}\nText to expand: "${input.text}"`;
        break;
      case 'summarize':
        promptText += `Summarize the following text.${maxWordsText}\nText to summarize: "${input.text}"`;
        break;
      case 'rephrase-formal':
        promptText += `Rephrase the following text in a formal and professional tone.\nText to rephrase: "${input.text}"`;
        break;
      case 'rephrase-professional':
        promptText += `Rewrite the following text to sound more professional and authoritative.\nText to rephrase: "${input.text}"`;
        break;
      case 'rephrase-casual':
        promptText += `Rephrase the following text in a more casual and conversational tone.\nText to rephrase: "${input.text}"`;
        break;
      case 'rephrase-creative':
        promptText += `Rewrite the following text in a more creative and engaging style.\nText to rephrase: "${input.text}"`;
        break;
      case 'fix-grammar':
        promptText += `Fix any spelling and grammar mistakes in the following text.\nText to fix: "${input.text}"`;
        break;
      default:
        promptText += `Process the following text:\n"${input.text}"`;
    }
  }

  promptText += '\n\nOutput the result as a JSON object with a single key "processedText".';

  return await callGeminiModel({
    model: input.model,
    prompt: promptText,
    input: input,
    outputSchema: ProcessTextOutputSchema,
  });
}

