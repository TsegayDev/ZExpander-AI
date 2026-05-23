/**
 * @fileOverview Summarizes a document and provides key takeaways.
 *
 * - summarizeDocument - A function that performs the summarization.
 * - SummarizeDocumentInput - The input type for the summarizeDocument function.
 * - SummarizeDocumentOutput - The return type for the summarizeDocument function.
 */

import { z } from 'zod';
import { callGeminiModel } from '../utils';

export const SummarizeDocumentInputSchema = z.object({
  text: z.string().describe('The document text to summarize.'),
  model: z.string().describe('The AI model to use for summarization.'),
});
export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;

export const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the document.'),
  keyTakeaways: z.array(z.string()).describe('A list of the most important key takeaways or bullet points.'),
  headline: z.string().describe('A potential headline for the document.'),
});
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

const SUMMARIZE_PROMPT = `You are an expert AI assistant specializing in summarizing documents.

Analyze the following document:
"{{text}}"

Based on the document, please provide the following:
1.  A concise but comprehensive summary.
2.  A list of the 3-5 most important key takeaways as bullet points.
3.  A catchy, appropriate headline for the document.

IMPORTANT: You MUST return a JSON object that strictly adheres to the following keys:
- "summary": (string) A concise summary of the document.
- "keyTakeaways": (array of strings) A list of the most important key takeaways.
- "headline": (string) A potential headline for the document.

Do not use alternative keys. Use exactly the keys listed above.`;

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  return await callGeminiModel({
    model: input.model,
    prompt: SUMMARIZE_PROMPT,
    input: input,
    outputSchema: SummarizeDocumentOutputSchema,
  });
}

