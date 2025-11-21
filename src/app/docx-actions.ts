
"use server";

import { z } from "zod";
import htmlToDocx from 'html-to-docx';

const generateDocxActionSchema = z.object({
    htmlString: z.string(),
});

export async function generateDocxAction(params: { htmlString: string }) {
    const validation = generateDocxActionSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: "Invalid input for DOCX generation." };
    }

    try {
        const fileBuffer = await htmlToDocx(params.htmlString, undefined, {
            font: 'Calibri',
            fontSize: 12,
        });

        if (fileBuffer instanceof Buffer) {
            return { success: true, data: fileBuffer.toString('base64') };
        }
        // For Blob type (if it ever returns that on server, though unlikely)
        const arrayBuffer = await (fileBuffer as Blob).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return { success: true, data: buffer.toString('base64') };
        
    } catch (error) {
        console.error("DOCX generation failed:", error);
        return { success: false, error: "Failed to generate DOCX file." };
    }
}
