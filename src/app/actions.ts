
"use server";

import { processText, type ProcessTextInput } from "@/ai/flows/process-text";
import { analyzeTone, type AnalyzeToneOutput } from "@/ai/flows/analyze-tone";
import { summarizeDocument, type SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import { z } from "zod";
import { auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import type { ProcessingMode } from "@/lib/types";

const processTextActionSchema = z.object({
  text: z.string().min(1, "Input text cannot be empty."),
  mode: z.string(),
  model: z.string(),
  customPrompt: z.string().optional(),
  maxWords: z.number().optional(),
});

export async function processTextAction(params: { text: string, mode: ProcessingMode, model: string, customPrompt?: string, maxWords?: number }) {
  const validation = processTextActionSchema.safeParse(params);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  
  try {
    const finalInput: ProcessTextInput = {
        text: params.text,
        mode: params.mode,
        model: params.model,
        maxWords: params.maxWords,
        customPrompt: params.customPrompt,
    };
    
    const result = await processText(finalInput);
    
    return { success: true, data: result.processedText };
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred during processing." };
  }
}

const analyzeToneActionSchema = z.object({
    text: z.string().min(1, "Input text cannot be empty."),
    model: z.string(),
});

export async function analyzeToneAction(params: { text: string, model: string }): Promise<{ success: boolean, data?: AnalyzeToneOutput, error?: any }> {
    const validation = analyzeToneActionSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: validation.error.flatten().fieldErrors };
    }

    try {
        const result = await analyzeTone(params);
        return { success: true, data: result };
    } catch (error) {
        console.error("Tone analysis failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
    }
}

const summarizeDocumentActionSchema = z.object({
    text: z.string().min(1, "Input text cannot be empty."),
    model: z.string(),
});

export async function summarizeDocumentAction(params: { text: string, model: string }): Promise<{ success: boolean, data?: SummarizeDocumentOutput, error?: any }> {
    const validation = summarizeDocumentActionSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: validation.error.flatten().fieldErrors };
    }

    try {
        const result = await summarizeDocument(params);
        return { success: true, data: result };
    } catch (error) {
        console.error("Document summarization failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
    }
}


const profileActionSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
});

export async function updateUserProfileAction(params: { fullName: string }) {
  const validation = profileActionSchema.safeParse(params);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, error: "You must be logged in to update your profile." };
  }

  try {
    if (currentUser.displayName !== params.fullName) {
      await updateProfile(currentUser, { displayName: params.fullName });
    }
    return { success: true };
  } catch (error: any) {
    console.error("Profile update failed:", error);
    return { success: false, error: error.message || "An unexpected error occurred during profile update." };
  }
}
