import { generate } from '../llm';

/** Generic escape hatch: run any prompt with any inputs and save the text. */
export interface LlmPromptInput {
  system?: string;
  prompt: string;
  variables?: Record<string, string | number>;
  search?: boolean;
}

export async function runLlmPrompt(input: LlmPromptInput): Promise<{ text: string; provider: string; model: string }> {
  let prompt = input.prompt;
  for (const [k, v] of Object.entries(input.variables || {})) {
    prompt = prompt.replaceAll(`{{${k}}}`, String(v));
  }
  const res = await generate({
    system: input.system || 'You are a careful, concise assistant for a small marketing business. Do not invent facts.',
    prompt,
    search: !!input.search,
  });
  return { text: res.text, provider: res.provider, model: res.model };
}
