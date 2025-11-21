
'use server';
/**
 * @fileOverview Summarizes a document and provides key takeaways.
 *
 * - summarizeDocument - A function that performs the summarization.
 * - SummarizeDocumentInput - The input type for the summarizeDocument function.
 * - SummarizeDocumentOutput - The return type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const SummarizeDocumentInputSchema = z.object({
  text: z.string().describe('The document text to summarize.'),
  model: z.string().describe('The AI model to use for summarization.'),
});
export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;

const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the document.'),
  keyTakeaways: z.array(z.string()).describe('A list of the most important key takeaways or bullet points.'),
  headline: z.string().describe('A potential headline for the document.'),
});
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  return summarizeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: {schema: SummarizeDocumentInputSchema},
  output: {schema: SummarizeDocumentOutputSchema},
  prompt: `You are an expert AI assistant specializing in summarizing documents.

Analyze the following document:
"{{{text}}}"

Based on the document, please provide the following:
1.  A concise but comprehensive summary.
2.  A list of the 3-5 most important key takeaways as bullet points.
3.  A catchy, appropriate headline for the document.

Return the result as a JSON object with the keys "summary", "keyTakeaways", and "headline".`,
});

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
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
