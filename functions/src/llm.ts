import { z } from 'zod';

export interface GenerateOptions {
  system: string;
  prompt: string;
  /** Let the model search the web (Gemini: Google Search grounding; Anthropic: web_search tool). */
  search?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  provider: 'gemini' | 'anthropic';
  model: string;
}

function provider(): 'gemini' | 'anthropic' {
  const p = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
  return p === 'gemini' ? 'gemini' : 'anthropic';
}

// ---------------------------------------------------------------------------

async function generateGemini(opts: GenerateOptions): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in functions/.env');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxTokens ?? 8192,
      ...(opts.search ? { tools: [{ googleSearch: {} }] } : {}),
    },
  });

  const text = response.text ?? '';
  if (!text) throw new Error('Gemini returned an empty response');
  return { text, provider: 'gemini', model };
}

async function generateAnthropic(opts: GenerateOptions): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in functions/.env');
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 8192,
    temperature: opts.temperature ?? 0.3,
    system: opts.system,
    messages: [{ role: 'user', content: opts.prompt }],
    ...(opts.search
      ? { tools: [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 8 }] }
      : {}),
  });

  const text = message.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  if (!text) throw new Error('Anthropic returned an empty response');
  return { text, provider: 'anthropic', model };
}

export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  return provider() === 'anthropic' ? generateAnthropic(opts) : generateGemini(opts);
}

// ---------------------------------------------------------------------------
// Structured output: ask for JSON, strip fences, parse, validate. One retry with
// the validation error fed back, because models occasionally drop a field.
// ---------------------------------------------------------------------------

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

export async function generateJson<T>(
  schema: z.ZodType<T>,
  opts: GenerateOptions,
): Promise<{ data: T; meta: Omit<GenerateResult, 'text'> }> {
  const jsonSystem =
    `${opts.system}\n\nRespond with a single JSON object only — no prose before or after, no markdown fences. ` +
    `The object must match this shape exactly (all keys required):\n${schemaHint(schema)}`;

  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = attempt === 0
      ? opts.prompt
      : `${opts.prompt}\n\nYour previous answer failed validation:\n${lastError}\nReturn corrected JSON only.`;
    const res = await generate({ ...opts, system: jsonSystem, prompt });
    try {
      const parsed = JSON.parse(extractJson(res.text));
      const data = schema.parse(parsed);
      return { data, meta: { provider: res.provider, model: res.model } };
    } catch (err) {
      lastError = err instanceof Error ? err.message.slice(0, 2000) : String(err);
    }
  }
  throw new Error(`Model output failed validation after retry: ${lastError}`);
}

/** Cheap human-readable description of a zod schema for the prompt. */
function schemaHint(schema: z.ZodTypeAny): string {
  const walk = (s: z.ZodTypeAny, depth = 0): string => {
    const pad = '  '.repeat(depth);
    if (s instanceof z.ZodObject) {
      const shape = s.shape as Record<string, z.ZodTypeAny>;
      const lines = Object.entries(shape).map(([k, v]) => {
        const desc = v.description ? `  // ${v.description}` : '';
        return `${pad}  "${k}": ${walk(v, depth + 1)}${desc}`;
      });
      return `{\n${lines.join(',\n')}\n${pad}}`;
    }
    if (s instanceof z.ZodArray) return `[${walk(s.element, depth)}]`;
    if (s instanceof z.ZodString) return '"string"';
    if (s instanceof z.ZodNumber) return 'number';
    if (s instanceof z.ZodBoolean) return 'boolean';
    if (s instanceof z.ZodEnum) return (s.options as string[]).map((o) => `"${o}"`).join(' | ');
    if (s instanceof z.ZodNullable) return `${walk(s.unwrap(), depth)} | null`;
    if (s instanceof z.ZodOptional) return `${walk(s.unwrap(), depth)} (optional)`;
    if (s instanceof z.ZodUnion) return (s.options as z.ZodTypeAny[]).map((o) => walk(o, depth)).join(' | ');
    if (s instanceof z.ZodLiteral) return JSON.stringify(s.value);
    return 'any';
  };
  return walk(schema);
}
