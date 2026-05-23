'use server';
/**
 * @fileOverview Humanizer — Best-of-both-worlds approach.
 *
 * Strategy: Take the proven simple-rewrite prompt that achieved 13% AI / 54% Human,
 * port it to the new @google/genai SDK (no Genkit), and layer on stronger
 * anti-detection post-processing from the newer pipeline.
 *
 * Key principles kept from the old winning code:
 * - Single, clear rewriting prompt (not extract/reconstruct - that kills formatting)
 * - Preserve structure: headings, bullets, citations all stay exactly
 * - Rewrite at sentence level using simpler, natural words
 * - Temperature 0.8 (enough creativity but not chaotic)
 * - JSON output requested in prompt, parsed manually (avoids JSON-schema cage effect)
 *
 * New additions on top:
 * - Adversarial polish pass (hunts AI triplets, balanced clauses, transitions)
 * - Extended lexical post-processor (40+ word swaps)
 * - Burstiness injector (sentence-length variance to boost perplexity score)
 */

import { z } from 'zod';
import { ai } from '../client';

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const HummanizerInputSchema = z.object({
  text: z.string().describe('The input text to humanize.'),
  model: z.string().describe('The AI model to use.'),
  style: z
    .enum(['academic', 'professional', 'casual', 'storytelling', 'empathetic', 'concise'])
    .optional()
    .default('academic')
    .describe('Desired human style.'),
  voiceSample: z.string().optional().describe('Optional writing sample for voice calibration.'),
  maxWords: z.number().optional().describe('Optional max words for the output.'),
  preserveTechnicalTerms: z.boolean().optional().default(true).describe('Preserve technical/scientific terminology.'),
  rephraseStrength: z.enum(['standard', 'aggressive', 'extreme']).optional().default('aggressive'),
});
export type HummanizerInput = z.infer<typeof HummanizerInputSchema>;

export const HummanizerOutputSchema = z.object({
  humanizedText: z.string().describe('The humanized text that bypasses AI detection.'),
  patternsRemoved: z.array(z.string()).describe('List of AI patterns that were removed.'),
});
export type HummanizerOutput = z.infer<typeof HummanizerOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Core Prompt (ported from the old working Genkit version)
// ─────────────────────────────────────────────────────────────────────────────

const HUMANIZER_PROMPT = `You are a writing editor that identifies and removes signs of AI-generated text to make writing sound more natural and human. Your goal is to humanize the provided text by removing common AI patterns, improving voice and rhythm, and ensuring natural vocabulary.

## YOUR TASK
When given text to humanize:
1. Identify AI patterns (sterile voice, predictable structure, AI vocabulary, filler).
2. Rewrite problematic sections.
3. Preserve meaning and structure (keep headings, bullet lists, citations).
4. Maintain the intended tone and add "soul" (personality, natural rhythm).
5. Do a final anti-AI pass to clean up any remaining tells.

## PERSONALITY AND SOUL
Good writing has a human behind it. 
- Have opinions: React to facts if appropriate. 
- Vary your rhythm: Mix short, punchy sentences with longer ones.
- Acknowledge complexity: Use nuanced framing instead of neutral reporting.
- Let some mess in: Perfect structure feels algorithmic.

## AVOID THESE AI PATTERNS:

### 1. Undue Emphasis & Puffery
AVOID: stands/serves as, is a testament/reminder, vital/significant/crucial/pivotal/key role/moment, underscores/highlights importance, reflects broader, symbolizing ongoing/enduring, contributing to, setting the stage, represents a shift, indelible mark.
RULE: Just state the facts without inflating their historical importance.

### 2. Superficial -ing Endings
AVOID adding present participle phrases for fake depth: highlighting..., underscoring..., ensuring..., reflecting..., contributing to..., cultivating..., encompassing...

### 3. Promotional/Ad-like Language
AVOID: boasts a, vibrant, rich, profound, enhancing its, showcasing, exemplifies, commitment to, natural beauty, nestled, groundbreaking, renowned, breathtaking, stunning.

### 4. Vague Attributions & Outline-like Sections
AVOID: Industry reports say, Observers have cited, Experts argue.
AVOID formulaic "Challenges and Future Prospects" sections. "Despite its... faces several challenges..."

### 5. Overused "AI Vocabulary"
NEVER USE: Actually, additionally, align with, crucial, delve, emphasizing, enduring, enhance, fostering, garner, highlight, interplay, intricate, key, landscape, pivotal, showcase, tapestry, testament, underscore, valuable, vibrant.

### 6. Copula Avoidance
AVOID: serves as, stands as, marks, represents, boasts, features. 
RULE: Just use "is", "are", "has".

### 7. Rule of Three & Elegant Variation
AVOID forcing ideas into groups of three to appear comprehensive. AVOID excessive synonym substitution (e.g. protagonist, main character, central figure).

### 8. Negative Parallelisms & Tailing Negations
AVOID: "Not only... but also", "It's not just about... it's..."
AVOID: Tacking fragments to the end, e.g., "...no guessing."

### 9. False Ranges
AVOID: "from X to Y" when X and Y aren't on a meaningful scale.

### 10. Passive Voice & Filler
AVOID subjectless fragments ("No configuration needed"). Use active voice.
AVOID filler: "In order to achieve this goal" -> "To achieve this".

### 11. Excessive Hedging & Signposting
AVOID: "It could potentially possibly be argued..."
AVOID: "Let's dive in", "here's what you need to know", "without further ado".

### 12. Style/Formatting tells
- NO em dashes (—). Use regular hyphens (-) or commas.
- NO boldface overload in paragraphs.
- NO inline-header vertical lists (e.g. "- **Item:** description").
- NO emojis.
- NO title case in headings (use sentence case).
- NO sycophantic/collaborative artifacts ("I hope this helps!", "Let me know!").

## INPUT
Text to humanize:
"""
{{text}}
"""

Target Style: {{style}}
{{voiceCalibration}}

## OUTPUT FORMAT
Return ONLY a valid JSON object with exactly the following keys:
{
  "draftRewrite": "Your initial draft rewrite.",
  "aiTells": ["bullet point 1 identifying what still sounds AI", "bullet point 2"],
  "humanizedText": "The final rewrite after fixing the AI tells.",
  "patternsRemoved": ["list of AI words or patterns removed from the original text"]
}
DO NOT add any markdown formatting like \`\`\`json ... \`\`\` around the JSON object. Just return the raw JSON object.`;

// ─────────────────────────────────────────────────────────────────────────────
// Adversarial Polish Prompt (second pass - only for aggressive/extreme)
// ─────────────────────────────────────────────────────────────────────────────

const POLISH_PROMPT = `Review the following draft for AI detection markers. Preserve ALL Markdown headings, bullet points, and citations exactly. DO NOT shorten the text or remove any section.

Fix ONLY these AI fingerprints:
1. TRIPLETS: Any list of three items (e.g., "managing, directing, and guiding") - remove one item or split across two sentences
2. BALANCED CLAUSES: Sentences with perfect symmetry like "While X is true, Y is also true" - make them lopsided or split them
3. FORBIDDEN TRANSITIONS: Replace any "Furthermore", "Moreover", "Additionally", "Consequently", "Therefore", "Thus" with "And", "So", or restructure the sentence
4. ROBOTIC WRAP-UPS: Lines ending with perfectly neat conclusions - make them sound more like someone still thinking it through

DRAFT:
---
{{draft}}
---

Return ONLY the corrected text. No explanation. No preamble.`;

// ─────────────────────────────────────────────────────────────────────────────
// Post-Processing (extended from old proven code + new additions)
// ─────────────────────────────────────────────────────────────────────────────

function postProcess(text: string): string {
  let cleaned = text;

  // Typography normalization (from old code)
  cleaned = cleaned.replace(/[\u2013\u2014]/g, '-');
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'");
  cleaned = cleaned.replace(/[\u201C\u201D]/g, '"');
  cleaned = cleaned.replace(/[\u2026]/g, '...');
  cleaned = cleaned.replace(/[^\x00-\x7F]/g, '');

  // Extended word replacements (old code replacements + new additions from AI Cleanup Guide)
  const wordSwaps: [RegExp, string][] = [
    [/\b(utilize|utilizing|utilized|utilizes)\b/gi, 'use'],
    [/\b(demonstrate|demonstrating|demonstrated|demonstrates)\b/gi, 'show'],
    [/\b(implement|implementing|implemented|implements)\b/gi, 'use'],
    [/\b(facilitate|facilitating|facilitated|facilitates)\b/gi, 'help'],
    [/\b(commence|commencing|commenced|commences)\b/gi, 'start'],
    [/\b(terminate|terminating|terminated|terminates)\b/gi, 'end'],
    [/\b(encompass|encompasses|encompassed)\b/gi, 'cover'],
    [/\b(constitute|constitutes|constituted)\b/gi, 'make up'],
    [/\b(indicate|indicates|indicated)\b/gi, 'show'],
    [/\brobust\b/gi, 'strong'],
    [/\bnuanced\b/gi, 'complex'],
    [/\bmultifaceted\b/gi, 'complex'],
    [/\bparamount\b/gi, 'very important'],
    [/\bpivotal\b/gi, 'key'],
    [/\bimperative\b/gi, 'essential'],
    [/\boptimal\b/gi, 'best'],
    [/\bseamlessly\b/gi, 'smoothly'],
    [/\bfoster(s|ed|ing)?\b/gi, 'build'],
    [/\bspearhead(s|ed|ing)?\b/gi, 'lead'],
    [/\btrajectory\b/gi, 'path'],
    [/\b(leverage|leverages|leveraged|leveraging)\b/gi, 'use'],
    [/\bparadigm\b/gi, 'model'],
    [/\bdichotomy\b/gi, 'division'],
    [/\bsynerg(y|istic|ies)\b/gi, 'collaboration'],
    [/\bdelve(s|d)? into\b/gi, 'look into'],
    [/\bmyriad\b/gi, 'many'],
    [/\bplethora\b/gi, 'many'],
    [/\bubiquitous\b/gi, 'common'],
    [/\bincentivize(s|d)?\b/gi, 'encourage'],
    
    // New additions from Wikipedia guide
    [/\b(is a testament to|stands as a testament to)\b/gi, 'shows'],
    [/\b(plays a )?(vital|significant|crucial|pivotal|key) role\b/gi, 'is important'],
    [/\b(underscores|highlights) (its )?(importance|significance)\b/gi, 'is important'],
    [/\breflects broader\b/gi, 'shows'],
    [/\bsymbolizing (its )?(ongoing|enduring|lasting)\b/gi, 'representing'],
    [/\bsetting the stage for\b/gi, 'preparing for'],
    [/\b(represents|marks) a shift\b/gi, 'changes'],
    [/\b(key turning point|focal point)\b/gi, 'important point'],
    [/\bevolving landscape\b/gi, 'changes'],
    [/\bindelible mark\b/gi, 'lasting impact'],
    [/\bdeeply rooted\b/gi, 'established'],
    [/\bboasts? a\b/gi, 'has a'],
    [/\bvibrant\b/gi, 'lively'],
    [/\benhancing its\b/gi, 'improving its'],
    [/\bshowcas(e|es|ing)\b/gi, 'show'],
    [/\bexemplifies\b/gi, 'shows'],
    [/\bnestled\b/gi, 'located'],
    [/\bgroundbreaking\b/gi, 'new'],
    [/\bbreathtaking\b/gi, 'beautiful'],
    [/\bstunning\b/gi, 'beautiful'],
    [/\bintricate( interplay| intricacies)?\b/gi, 'complex'],
    [/\btapestry\b/gi, 'mix'],
    [/\b(serves as|stands as|functions as|marks|represents) a\b/gi, 'is a'],
    [/\bthird-party\b/gi, 'third party'],
    [/\bcross-functional\b/gi, 'cross functional'],
    [/\bclient-facing\b/gi, 'client facing'],
    [/\bdata-driven\b/gi, 'data driven'],
    [/\bdecision-making\b/gi, 'decision making'],
  ];

  for (const [pattern, replacement] of wordSwaps) {
    cleaned = cleaned.replace(pattern, (match) => {
      return match[0] === match[0].toUpperCase()
        ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
        : replacement;
    });
  }

  // AI transition cleanup
  const transitionMap: [RegExp, string][] = [
    [/^(Furthermore|Moreover|Additionally)[,.]?\s+/gm, 'And '],
    [/^(Consequently|Therefore|Thus|Hence)[,.]?\s+/gm, 'So '],
    [/^(Nevertheless|Nonetheless)[,.]?\s+/gm, 'Still, '],
    [/^Subsequently[,.]?\s+/gm, 'Then '],
    [/\bIt is (important|crucial|worth|vital) (to note|noting) that\b/gi, 'Note that'],
    [/\bIt should be noted that\b/gi, ''],
    [/\b(In conclusion|To summarize|To conclude|In summary)[,.]?\s*/gi, ''],
    [/\b(this demonstrates|this illustrates|this highlights|this underscores) that\b/gi, 'this shows that'],
    [/\bAs (previously|earlier) mentioned\b/gi, 'As noted'],
    [/\bNot only\b.*?\bbut also\b/gi, 'And'],
    [/\b(Let's dive in|Let's explore|Let's break this down|Here's what you need to know|Now let's look at|Without further ado)[,.]?\s*/gi, ''],
    [/\b(The real question is|At its core|In reality|What really matters|Fundamentally|The deeper issue|The heart of the matter)[,.]?\s*/gi, ''],
    [/\bIn order to\b/gi, 'To'],
    [/\bDue to the fact that\b/gi, 'Because'],
    [/\bAt this point in time\b/gi, 'Now'],
    [/\bIn the event that\b/gi, 'If'],
    [/\bhas the ability to\b/gi, 'can'],
  ];

  for (const [pattern, replacement] of transitionMap) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Enforce contractions
  const contractions: [RegExp, string][] = [
    [/\bdo not\b/g, "don't"],
    [/\bdoes not\b/g, "doesn't"],
    [/\bdid not\b/g, "didn't"],
    [/\bcannot\b/g, "can't"],
    [/\bwill not\b/g, "won't"],
    [/\bwould not\b/g, "wouldn't"],
    [/\bshould not\b/g, "shouldn't"],
    [/\bcould not\b/g, "couldn't"],
    [/\bhas not\b/g, "hasn't"],
    [/\bhave not\b/g, "haven't"],
    [/\bis not\b/g, "isn't"],
    [/\bare not\b/g, "aren't"],
    [/\bthey are\b/g, "they're"],
    [/\bwe are\b/g, "we're"],
  ];

  for (const [pattern, replacement] of contractions) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Final spacing cleanup
  cleaned = cleaned.replace(/  +/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Burstiness Injector (boosts sentence-length variance = higher perplexity score)
// ─────────────────────────────────────────────────────────────────────────────

function injectBurstiness(text: string): string {
  const reactions = [
    ' Which makes sense.',
    ' That matters a lot.',
    ' And that gap is real.',
    " It's not a small issue.",
    ' That changes things significantly.',
  ];

  return text.split('\n').map((line, idx) => {
    if (line.startsWith('#') || line.length < 100) return line;

    const matches = line.match(/[^.!?]+[.!?]+["']?/g);
    if (!matches || matches.length < 3) return line;

    const sentences = Array.from(matches).map(s =>
      s.replace(/([a-zA-Z]+),\s+([a-zA-Z]+),\s+(?:and|or)\s+([a-zA-Z]+)/gi, '$1 and $2')
    );

    const seed = (line.length * 7 + idx * 13) % 100;
    if (seed < 20 && sentences.length > 2) {
      sentences[1] = sentences[1].trimEnd() + reactions[seed % reactions.length] + ' ';
    }

    return sentences.join(' ');
  }).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON Parser — handles the model's free-form JSON output safely
// ─────────────────────────────────────────────────────────────────────────────

function parseJsonResponse(raw: string): { humanizedText: string; patternsRemoved: string[] } | null {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Extract JSON block from the response
    const jsonMatch = raw.match(/\{[\s\S]*"humanizedText"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through
      }
    }
    // If all parsing fails, return the raw text as humanizedText
    return { humanizedText: raw, patternsRemoved: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Generation Helper (free-form, no JSON schema constraint)
// ─────────────────────────────────────────────────────────────────────────────

async function freeGenerate(model: string, prompt: string, temp: number): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      temperature: temp,
      topP: 0.9,
      topK: 50,
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI returned an empty response.');
  return text.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function hummanizeText(input: HummanizerInput): Promise<HummanizerOutput> {
  const { text, model, style = 'academic', voiceSample, rephraseStrength = 'aggressive' } = input;

  // Track removed patterns
  const trackedFlags = [
    'utilize', 'leverage', 'facilitate', 'furthermore', 'moreover',
    'in conclusion', 'to summarize', 'notwithstanding', 'plethora',
    'myriad', 'ubiquitous', 'robust', 'nuanced', 'multifaceted',
    'paradigm', 'synergy', 'delve', 'spearhead', 'foster', 'trajectory',
    'tapestry', 'testament', 'showcase', 'pivotal', 'crucial', 'vibrant',
    'intricate', 'enduring'
  ];
  const patternsRemoved = trackedFlags.filter(f => text.toLowerCase().includes(f));

  // --- PHASE 1: Core Humanization ---
  let voiceCalibration = '';
  if (voiceSample && voiceSample.trim() !== '') {
    voiceCalibration = `\nVoice Calibration Reference:\n"""\n${voiceSample}\n"""\nUse this writing sample to match the sentence length patterns, word choice level, punctuation habits, and tone.`;
  }

  const mainPrompt = HUMANIZER_PROMPT
    .replace(/\{\{text\}\}/g, text)
    .replace(/\{\{style\}\}/g, style)
    .replace(/\{\{voiceCalibration\}\}/g, voiceCalibration);

  // Temperature 0.8 for creativity
  const rawResponse = await freeGenerate(model, mainPrompt, 0.8);

  // Parse the JSON response from the model
  const parsed = parseJsonResponse(rawResponse);
  let humanizedText = parsed?.humanizedText ?? rawResponse;
  const modelPatterns = parsed?.patternsRemoved ?? [];

  // --- PHASE 2: Adversarial Polish (only for aggressive / extreme) ---
  if (rephraseStrength !== 'standard') {
    const polishPrompt = POLISH_PROMPT.replace(/\{\{draft\}\}/g, humanizedText);
    // Lower temp for the polish pass - precision, not creativity
    humanizedText = await freeGenerate(model, polishPrompt, 0.65);
  }

  // --- PHASE 3: Post-Processing + Burstiness ---
  humanizedText = postProcess(humanizedText);
  if (rephraseStrength === 'extreme') {
    humanizedText = injectBurstiness(humanizedText);
  }

  return {
    humanizedText,
    patternsRemoved: [...new Set([...patternsRemoved, ...modelPatterns])],
  };
}