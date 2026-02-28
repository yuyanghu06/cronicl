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

export interface GenerateImageRequest {
  prompt: string;
  model?: string;
}

export interface GenerateImageResponse {
  image: string; // base64-encoded PNG
  mimeType: string;
  text?: string; // optional description returned by the model
  model: string;
}

export async function generateImage(req: GenerateImageRequest): Promise<GenerateImageResponse> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('AI provider not configured');
  }

  const model = req.model ?? 'gemini-2.0-flash-preview-image-generation';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: req.prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image generation failed: ${error}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  let image = '';
  let mimeType = 'image/png';
  let text: string | undefined;

  for (const part of parts) {
    if (part.inlineData) {
      image = part.inlineData.data;
      mimeType = part.inlineData.mimeType ?? 'image/png';
    } else if (part.text) {
      text = part.text;
    }
  }

  if (!image) {
    throw new Error('No image returned from model');
  }

  return { image, mimeType, text, model };
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
