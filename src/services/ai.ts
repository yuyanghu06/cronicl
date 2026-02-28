import { env } from '../lib/env';

export interface GenerateTextRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface GenerateTextResponse {
  text: string;
  model: string;
}

export async function generateText(req: GenerateTextRequest): Promise<GenerateTextResponse> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('AI provider not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${req.model ?? 'gemini-pro'}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: req.prompt }] }],
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI generation failed: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return {
    text,
    model: req.model ?? 'gemini-pro',
  };
}
