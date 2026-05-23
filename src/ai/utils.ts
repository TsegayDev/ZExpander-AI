import { ai } from "./client";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Helper to call the Google AI Gemini models with structured output.
 */
export async function callGeminiModel<I, O>(params: {
  model: string;
  prompt: string;
  input: I;
  outputSchema: z.ZodType<O>;
  config?: {
    temperature?: number;
    topP?: number;
    topK?: number;
  };
}): Promise<O> {
  // Replace variables in the prompt if using string templates manually
  let finalPrompt = params.prompt;
  if (typeof params.input === "object" && params.input !== null) {
    Object.entries(params.input).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      finalPrompt = finalPrompt.replace(regex, String(value));
      // Handle triple braces too just in case
      const tripleRegex = new RegExp(`{{{${key}}}}`, "g");
      finalPrompt = finalPrompt.replace(tripleRegex, String(value));
    });
  }

  const response = await ai.models.generateContent({
    model: params.model,
    contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(params.outputSchema) as Record<string, unknown>,
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  try {
    const rawData = JSON.parse(text);
    return params.outputSchema.parse(rawData);
  } catch (err) {
    console.error("Failed to parse or validate AI response:", text, err);
    throw new Error("Invalid AI response format.");
  }
}
