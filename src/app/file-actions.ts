
"use server";

import { z } from "zod";
import mammoth from "mammoth";
import pdf from "pdf-parse/lib/pdf-parse.js";

const extractTextFromFileActionSchema = z.object({
    fileBuffer: z.string(), // base64 encoded string
    fileType: z.string(),
});

export async function extractTextFromFileAction(params: { fileBuffer: string, fileType: string }) {
    const validation = extractTextFromFileActionSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: "Invalid input for file extraction." };
    }
    
    const buffer = Buffer.from(params.fileBuffer, 'base64');

    try {
        let text = '';
        if (params.fileType === 'application/pdf') {
            const data = await pdf(buffer);
            text = data.text;
        } else if (params.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || params.fileType === 'application/msword') {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (params.fileType === 'text/plain') {
            text = buffer.toString('utf-8');
        } else {
            return { success: false, error: `Unsupported file type: ${params.fileType}` };
        }
        
        return { success: true, data: text };
    } catch (error) {
        console.error("File extraction failed:", error);
        return { success: false, error: "Failed to extract text from the file." };
    }
}
