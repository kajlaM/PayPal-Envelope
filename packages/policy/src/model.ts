import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// The LLMs the compiler tries, in order. If one fails (no credits, overloaded, out of free quota),
// the next one is used.
//   CLAUDE_MODEL  (needs ANTHROPIC_API_KEY with credits)           default: claude-sonnet-5-5
//   GEMINI_MODEL  (needs GOOGLE_GENERATIVE_AI_API_KEY), comma list  default: below
const DEFAULT_GEMINI = 'gemini-3.5-flash,gemini-3.6-flash,gemini-3.5-flash-lite';

export function policyModels() {
  const list = (value: string) => value.split(',').map((n) => n.trim()).filter(Boolean);
  const models = [];
  if (process.env.ANTHROPIC_API_KEY) {
    models.push(...list(process.env.CLAUDE_MODEL || 'claude-sonnet-5-5').map((n) => anthropic(n)));
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    models.push(...list(process.env.GEMINI_MODEL || DEFAULT_GEMINI).map((n) => google(n)));
  }
  if (models.length === 0) throw new Error('Set ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env');
  return models;
}
