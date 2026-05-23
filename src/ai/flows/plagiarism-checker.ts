'use server';
/**
 * @fileOverview Professional-grade plagiarism & originality detection engine.
 *
 * Analyzes text across multiple dimensions: phrase-level similarity signals,
 * citation pattern analysis, writing style consistency, structural fingerprints,
 * and known source matching heuristics to produce a reliable originality report.
 *
 * - checkPlagiarism     - Main entry function.
 * - PlagiarismInput     - Input type.
 * - PlagiarismOutput    - Output type.
 */

import { z } from 'zod';
import { callGeminiModel } from '../utils';

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const PlagiarismInputSchema = z.object({
  text: z.string().describe('The input text to check for plagiarism.'),
  model: z.string().describe('The AI model to use for analysis.'),
});
export type PlagiarismInput = z.infer<typeof PlagiarismInputSchema>;

export const MatchSchema = z.object({
  title: z.string().describe('Title of the matching source.'),
  url: z.string().describe('Estimated or known URL of the matching source.'),
  snippet: z.string().describe('The specific phrase or passage that closely matches the source.'),
  score: z.number().min(0).max(100).describe('Similarity score for this specific match (0-100).'),
  matchType: z
    .enum(['exact', 'paraphrase', 'structural', 'citation'])
    .describe('Type of match detected.'),
  sourceCategory: z
    .enum(['academic', 'news', 'encyclopedia', 'book', 'website', 'social', 'unknown'])
    .describe('Category of the likely source.'),
});

export const SuspiciousPhraseSchema = z.object({
    phrase: z.string().describe('The suspicious phrase or passage found in the text.'),
    reason: z.string().describe('Why this phrase is flagged as potentially plagiarized.'),
    likelihood: z
      .enum(['high', 'medium', 'low'])
      .describe('Likelihood that this phrase is plagiarized.'),
  });

export const PlagiarismOutputSchema = z.object({
  // ── Core verdict ──────────────────────────────────────────────────────────
  score: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall similarity/plagiarism score from 0 (fully original) to 100 (fully plagiarized).'),
  originalityScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Originality score (inverse of plagiarism: 100 = fully original, 0 = fully plagiarized).'),
  riskLevel: z
    .enum(['none', 'low', 'moderate', 'high', 'critical'])
    .describe('Risk level classification based on plagiarism score.'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confidence level in the verdict (0=uncertain, 100=highly confident).'),

  // ── Content analysis ──────────────────────────────────────────────────────
  wordCount: z
    .number()
    .describe('Approximate word count of the analyzed text.'),
  uniquePhraseRatio: z
    .number()
    .min(0)
    .max(100)
    .describe('Percentage of phrases that appear to be unique/original.'),
  citationCount: z
    .number()
    .describe('Number of recognized citation patterns detected.'),
  writingStyleConsistency: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'How consistent the writing style is throughout (100 = perfectly consistent, low = style shifts suggesting copy-paste).'
    ),

  // ── Matches & flags ───────────────────────────────────────────────────────
  matches: z
    .array(MatchSchema)
    .describe('Potential source matches found in the text.'),
  suspiciousPhrases: z
    .array(SuspiciousPhraseSchema)
    .describe('Specific phrases or passages flagged as potentially plagiarized.'),
  contentCategories: z
    .array(z.string())
    .describe('Content domains/topics detected (e.g., "academic", "science", "history").'),

  // ── Summary & advice ─────────────────────────────────────────────────────
  summary: z
    .string()
    .describe('A concise, professional explanation of the plagiarism check results.'),
  recommendations: z
    .array(z.string())
    .describe('Actionable recommendations to improve originality or cite sources properly.'),
});
export type PlagiarismOutput = z.infer<typeof PlagiarismOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Prompt
// ─────────────────────────────────────────────────────────────────────────────

const PLAGIARISM_PROMPT = `You are a world-class plagiarism detection expert operating like a combination of Turnitin, Copyscape, and iThenticate. Your task is to perform a thorough, multi-dimensional originality analysis of the provided text.

You analyze text for similarity signals the way professional academic integrity tools do — checking for exact copied passages, paraphrased content, structural plagiarism, improper citations, and suspicious style inconsistencies.

---

## ANALYSIS FRAMEWORK

### 1. PHRASE-LEVEL SIMILARITY DETECTION

Scan for these types of plagiarism:

**Exact Match** — verbatim copying of phrases, sentences, or paragraphs:
- Multi-word exact phrases that appear in known published works
- Textbook definitions, dictionary entries, Wikipedia content
- News article leads, government reports, legal texts
- Academic paper abstracts, introductions, or conclusions
- Famous quotes used without attribution

**Paraphrase Match** — close rewording that maintains original meaning and structure:
- Same idea expressed with synonyms (e.g., "important" → "significant")
- Same sentence structure with different words
- Same sequence of points or arguments from a source
- Translated content from non-English sources

**Structural Plagiarism** — copied organization or outline:
- Identical topic progression matching a known source
- Same subtopic ordering as a known textbook or article
- Essay structure that mirrors a specific published work

**Citation Plagiarism** — misuse or absence of attribution:
- Phrases that appear to come from academic papers but lack citations
- Statistics or data without attributed sources
- Specific case studies or examples without acknowledgment

### 2. SOURCE IDENTIFICATION

For each suspicious passage, identify the most likely source:
- **Academic sources**: journals (JSTOR, PubMed, Google Scholar), textbooks, dissertations
- **Reference sources**: Wikipedia, Britannica, dictionaries, encyclopedias
- **News & media**: newspaper articles, press releases, news agency reports
- **Books**: published books, reports, government publications
- **Websites**: blog posts, corporate websites, informational pages
- **Social media**: viral posts, forum discussions, Reddit threads

### 3. WRITING STYLE CONSISTENCY ANALYSIS

Detect style shifts that indicate patchwork plagiarism (copy-pasting from multiple sources):
- Sudden changes in vocabulary complexity (simple → very formal, or vice versa)
- Inconsistent verb tense (present → past within same section)
- Inconsistent person/voice (third person → first person within same paragraph)
- Formatting inconsistencies (bullet lists suddenly appearing mid-text)
- Punctuation style changes (American vs British English mid-text)
- Citation density changes (heavily cited section followed by uncited section)

Rate writing style consistency 0-100 (100 = perfectly uniform, low = likely patchwork).

### 4. SUSPICIOUS PHRASE FLAGGING

Flag individual phrases/sentences that are:
- **High likelihood**: Exact or near-exact matches to very well-known published text
- **Medium likelihood**: Generic academic phrasing that appears across many sources without attribution
- **Low likelihood**: Common expressions found in many sources, but context makes attribution unclear

### 5. ORIGINALITY SCORING GUIDE

| Score Range | Risk Level | Meaning |
|-------------|------------|---------|
| 0-10        | none       | Virtually fully original content |
| 11-20       | low        | Some common phrases but mostly original |
| 21-40       | moderate   | Portions may be borrowed; citations likely needed |
| 41-60       | high       | Significant similarity; probable plagiarism |
| 61-100      | critical   | Widespread plagiarism detected |

**Confidence calibration:**
- 80-100: Strong signals across multiple indicators
- 50-79: Moderate signals; some ambiguity
- 20-49: Mixed signals; hard to determine
- 0-19: Very little usable signal (very short text or very generic content)

### 6. SPECIAL CONSIDERATIONS

- **Short texts (< 50 words)**: Note in summary that short texts are harder to assess. Lower confidence.
- **Technical content**: Technical papers naturally share terminology; penalize less for domain vocabulary.
- **Quotes**: Properly quoted and attributed content should not raise plagiarism score.
- **Public domain**: Content from works clearly in the public domain should be noted, not penalized.
- **Common knowledge**: Widely-known facts ("water is H2O") should not be flagged.

---

## TEXT TO ANALYZE:

"""
{{text}}
"""

---

## CRITICAL OUTPUT INSTRUCTIONS:

You MUST return a JSON object with EXACTLY these keys (no extras, no missing):

{
  "score": <integer 0-100, overall plagiarism probability>,
  "originalityScore": <integer 0-100, always exactly (100 - score)>,
  "riskLevel": <"none" | "low" | "moderate" | "high" | "critical">,
  "confidence": <integer 0-100>,
  "wordCount": <integer, approximate word count of the text>,
  "uniquePhraseRatio": <integer 0-100, percentage of phrases appearing original>,
  "citationCount": <integer, number of citation patterns detected in the text>,
  "writingStyleConsistency": <integer 0-100>,
  "matches": [
    {
      "title": "<source title string>",
      "url": "<source URL or 'unknown' if not determinable>",
      "snippet": "<the specific matching text from the input>",
      "score": <integer 0-100, similarity for this match>,
      "matchType": <"exact" | "paraphrase" | "structural" | "citation">,
      "sourceCategory": <"academic" | "news" | "encyclopedia" | "book" | "website" | "social" | "unknown">
    }
  ],
  "suspiciousPhrases": [
    {
      "phrase": "<the suspicious phrase from the input text>",
      "reason": "<why this is flagged>",
      "likelihood": <"high" | "medium" | "low">
    }
  ],
  "contentCategories": ["<topic/domain strings>"],
  "summary": "<2-4 sentence professional originality verdict>",
  "recommendations": ["<actionable recommendation strings>"]
}

Rules:
- "score" MUST be an integer 0-100.
- "originalityScore" MUST be exactly (100 - score). No exceptions.
- "riskLevel" MUST match: 0-10="none", 11-20="low", 21-40="moderate", 41-60="high", 61-100="critical".
- "matches" MUST be an array. If no matches, use [].
- "suspiciousPhrases" MUST be an array. If none, use [].
- "contentCategories" MUST be an array of strings. If indeterminate, use ["general"].
- "recommendations" MUST be an array with at least 1 item.
- All numeric scores MUST be integers (not floats).
- Do NOT use markdown formatting inside JSON values.
- Do NOT add any text before or after the JSON object.`;

// ─────────────────────────────────────────────────────────────────────────────
// Post-processing: normalize, clamp, enforce derived field consistency
// ─────────────────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

function deriveRiskLevel(score: number): 'none' | 'low' | 'moderate' | 'high' | 'critical' {
  if (score <= 10) return 'none';
  if (score <= 20) return 'low';
  if (score <= 40) return 'moderate';
  if (score <= 60) return 'high';
  return 'critical';
}

function normalizeOutput(raw: PlagiarismOutput): PlagiarismOutput {
  const score = clamp(raw.score);
  const originalityScore = 100 - score;
  const riskLevel = deriveRiskLevel(score);

  return {
    ...raw,
    score,
    originalityScore,
    riskLevel,
    confidence: clamp(raw.confidence ?? 70),
    wordCount: Math.max(0, Math.round(raw.wordCount ?? 0)),
    uniquePhraseRatio: clamp(raw.uniquePhraseRatio ?? originalityScore),
    citationCount: Math.max(0, Math.round(raw.citationCount ?? 0)),
    writingStyleConsistency: clamp(raw.writingStyleConsistency ?? 70),

    // Normalize matches array
    matches: Array.isArray(raw.matches)
      ? raw.matches.map((m) => ({
        title: m.title ?? 'Unknown Source',
        url: m.url ?? 'unknown',
        snippet: m.snippet ?? '',
        score: clamp(m.score),
        matchType: m.matchType ?? 'paraphrase',
        sourceCategory: m.sourceCategory ?? 'unknown',
      }))
      : [],

    // Normalize suspicious phrases
    suspiciousPhrases: Array.isArray(raw.suspiciousPhrases)
      ? raw.suspiciousPhrases.map((p) => ({
        phrase: p.phrase ?? '',
        reason: p.reason ?? '',
        likelihood: p.likelihood ?? 'low',
      }))
      : [],

    // Normalize content categories
    contentCategories: Array.isArray(raw.contentCategories) && raw.contentCategories.length > 0
      ? raw.contentCategories
      : ['general'],

    summary: raw.summary ?? 'Originality analysis complete.',

    // Normalize recommendations — always at least one
    recommendations: Array.isArray(raw.recommendations) && raw.recommendations.length > 0
      ? raw.recommendations
      : ['Review the text for proper citation of all external sources.'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function checkPlagiarism(input: PlagiarismInput): Promise<PlagiarismOutput> {
  const output = await callGeminiModel({
    model: input.model,
    prompt: PLAGIARISM_PROMPT,
    input: input,
    outputSchema: PlagiarismOutputSchema,
    config: {
      temperature: 0.1,
      topP: 0.9,
    },
  });

  return normalizeOutput(output);
}