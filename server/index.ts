import 'dotenv/config';
import { Buffer } from 'node:buffer';
// Polyfill for SlowBuffer which is undefined in Node v25 but required by older dependencies of @google/genai
if (typeof (global as any).SlowBuffer === 'undefined') {
  (global as any).SlowBuffer = Buffer;
  try {
    const bufferModule = require('node:buffer');
    if (!bufferModule.SlowBuffer) {
      bufferModule.SlowBuffer = Buffer;
    }
  } catch (e) {}
}

import express from 'express';

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set in the environment. AI features may fail.');
} else {
  console.log('GEMINI_API_KEY is present in the environment.');
}
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { processText } from '../src/ai/flows/process-text';
import { analyzeTone } from '../src/ai/flows/analyze-tone';
import { summarizeDocument } from '../src/ai/flows/summarize-document';
import { hummanizeText } from '../src/ai/flows/hummanizer';
import { detectAI } from '../src/ai/flows/ai-detection';
import { checkPlagiarism } from '../src/ai/flows/plagiarism-checker';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import HTMLToDOCX from 'html-to-docx';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Utility for AI model fallback ---
async function withModelFallback<T>(
  data: any, 
  operation: (data: any) => Promise<T>
): Promise<T> {
  try {
    return await operation(data);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || (err.message && err.message.includes('429'));
    const isForbidden = err.status === 403 || (err.message && err.message.includes('403'));
    const isInvalidKey = err.status === 400 && err.message && err.message.includes('API key not valid');
    
    if (isInvalidKey) {
      throw new Error('API Key is invalid. Please check your API key configuration.');
    }

    if ((isRateLimit || isForbidden) && data.model !== 'gemini-3.1-flash-lite-preview') {
      const reason = isRateLimit ? 'Quota Exceeded' : 'Access Denied';
      console.warn(`[AI Error] ${reason}. Falling back from ${data.model} to gemini-3.1-flash-lite-preview`);
      const fallbackData = { ...data, model: 'gemini-3.1-flash-lite-preview' };

      return await operation(fallbackData);
    }
    
    if (isForbidden) {
      throw new Error(`AI Access Denied (403): Your API key may not have access to the model "${data.model}". Please check your Google AI Studio project settings.`);
    }
    
    throw err;
  }
}

// --- Process Text ---
const processTextSchema = z.object({
  text: z.string().min(1),
  mode: z.string(),
  model: z.string(),
  customPrompt: z.string().optional(),
  maxWords: z.number().optional(),
});

app.post('/api/process-text', async (req, res) => {
  const parsed = processTextSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
  }
  try {
    const result = await withModelFallback(parsed.data, processText);
    return res.json({ success: true, data: result.processedText });
  } catch (err: any) {
    console.error('[process-text]', err);
    return res.status(500).json({ success: false, error: err.message || 'Processing failed.' });
  }
});

// --- Analyze Tone ---
const analyzeToneSchema = z.object({
  text: z.string().min(1),
  model: z.string(),
});

app.post('/api/analyze-tone', async (req, res) => {
  const parsed = analyzeToneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
  }
  try {
    const result = await withModelFallback(parsed.data, analyzeTone);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[analyze-tone]', err);
    return res.status(500).json({ success: false, error: err.message || 'Tone analysis failed.' });
  }
});

// --- Summarize Document ---
const summarizeDocSchema = z.object({
  text: z.string().min(1),
  model: z.string(),
});

app.post('/api/summarize-document', async (req, res) => {
  const parsed = summarizeDocSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
  }
  try {
    const result = await withModelFallback(parsed.data, summarizeDocument);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[summarize-document]', err);
    return res.status(500).json({ success: false, error: err.message || 'Summarization failed.' });
  }
});

// --- Hummanizer ---
const hummanizeSchema = z.object({
  text: z.string().min(1),
  model: z.string(),
  style: z.string().optional(),
  maxWords: z.number().optional(),
});

app.post('/api/hummanize', async (req, res) => {
  const parsed = hummanizeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
  }
  try {
    const result = await withModelFallback(parsed.data, hummanizeText);
    return res.json({ success: true, data: result.humanizedText });
  } catch (err: any) {
    console.error('[hummanize]', err);
    return res.status(500).json({ success: false, error: err.message || 'Humanizing failed.' });
  }
});

// --- AI Detection ---
const aiDetectionSchema = z.object({
  text: z.string().min(1),
  model: z.string(),
});

app.post('/api/ai-detection', async (req, res) => {
  const parsed = aiDetectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
  }
  try {
    const result = await withModelFallback(parsed.data, detectAI);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[ai-detection]', err);
    return res.status(500).json({ success: false, error: err.message || 'AI detection failed.' });
  }
});

// --- Plagiarism Checker ---
const plagiarismSchema = z.object({
  text: z.string().min(1),
  model: z.string(),
});

app.post('/api/plagiarism-check', async (req, res) => {
  const parsed = plagiarismSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
  }
  try {
    const result = await withModelFallback(parsed.data, checkPlagiarism);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[plagiarism-check]', err);
    return res.status(500).json({ success: false, error: err.message || 'Plagiarism check failed.' });
  }
});

// --- Docx & File parsing ---
app.post('/api/generate-docx', async (req, res) => {
  const { htmlString } = req.body;
  if (!htmlString) return res.status(400).json({ success: false, error: 'htmlString required' });
  try {
    const buffer = await HTMLToDOCX(htmlString);
    const base64String = Buffer.from(buffer as any).toString('base64');
    return res.json({ success: true, data: base64String });
  } catch (err: any) {
    console.error('[generate-docx]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/extract-text', async (req, res) => {
  const { fileBuffer, fileType } = req.body;
  if (!fileBuffer || !fileType) return res.status(400).json({ success: false, error: 'fileBuffer and fileType required' });
  try {
    const buffer = Buffer.from(fileBuffer, 'base64');
    let extractedText = '';

    if (fileType === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileType === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type.' });
    }

    return res.json({ success: true, data: extractedText });
  } catch (err: any) {
    console.error('[extract-text]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --- Vite Middleware ---
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ ZExpander server running on http://localhost:${PORT}`);
  });
}

setupVite();
