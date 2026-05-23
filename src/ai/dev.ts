
'use server';

import {config} from 'dotenv';
config();

import '@/ai/flows/process-text';
import '@/ai/flows/analyze-tone';
import '@/ai/flows/summarize-document';
