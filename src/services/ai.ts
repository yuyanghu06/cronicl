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

function logRequest(endpoint: string, model: string, prompt: string) {
  console.log(`[Gemini API] Request to ${endpoint}`);
  console.log(`[Gemini API] Model: ${model}`);
  console.log(`[Gemini API] Prompt length: ${prompt.length} chars`);
  console.log(`[Gemini API] Prompt preview: ${prompt.slice(0, 200)}...`);
}

function logResponse(endpoint: string, status: number, body?: string) {
  console.log(`[Gemini API] Response from ${endpoint}: ${status}`);
  if (body) {
    console.log(`[Gemini API] Response body preview: ${body.slice(0, 500)}`);
  }
}

function logError(endpoint: string, error: unknown) {
  console.error(`[Gemini API] Error from ${endpoint}:`, error);
}

export async function generateImage(req: GenerateImageRequest): Promise<GenerateImageResponse> {
  if (!env.GEMINI_API_KEY) {
    console.error('[Gemini API] GEMINI_API_KEY not configured');
    throw new Error('AI provider not configured');
  }

  const model = req.model ?? 'gemini-2.5-flash-image';
  const endpoint = `generateContent (image)`;
  
  logRequest(endpoint, model, req.prompt);

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

  const responseText = await response.text();
  logResponse(endpoint, response.status, responseText);

  if (!response.ok) {
    logError(endpoint, responseText);
    throw new Error(`Image generation failed: ${responseText}`);
  }

  const data = JSON.parse(responseText);
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
    logError(endpoint, 'No image returned from model');
    throw new Error('No image returned from model');
  }

  console.log(`[Gemini API] Image generated successfully, mimeType: ${mimeType}`);
  return { image, mimeType, text, model };
}

// ---------- Structured JSON Generation ----------

export interface GenerateStructuredTextRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface GenerateStructuredTextResponse<T> {
  data: T;
  raw: string;
  model: string;
}

export async function generateStructuredText<T>(
  req: GenerateStructuredTextRequest
): Promise<GenerateStructuredTextResponse<T>> {
  if (!env.GEMINI_API_KEY) {
    console.error('[Gemini API] GEMINI_API_KEY not configured');
    throw new Error('AI provider not configured');
  }

  const model = req.model ?? 'gemini-2.0-flash';
  const endpoint = `generateContent (structured)`;
  
  logRequest(endpoint, model, req.prompt);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: req.prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: req.maxTokens ?? 4096,
        },
      }),
    }
  );

  const responseText = await response.text();
  logResponse(endpoint, response.status, responseText);

  if (!response.ok) {
    logError(endpoint, responseText);
    throw new Error(`AI generation failed: ${responseText}`);
  }

  const responseData = JSON.parse(responseText);
  const raw = responseData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  console.log(`[Gemini API] Raw response text: ${raw.slice(0, 300)}...`);

  // Parse JSON with fallback chain
  let data: T;
  try {
    data = JSON.parse(raw);
    console.log(`[Gemini API] Successfully parsed JSON response`);
  } catch (parseError) {
    console.error(`[Gemini API] JSON parse error:`, parseError);
    // Fallback: extract JSON from markdown fences
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        data = JSON.parse(fenceMatch[1].trim());
        console.log(`[Gemini API] Successfully parsed JSON from markdown fence`);
      } catch (fenceParseError) {
        console.error(`[Gemini API] Fence JSON parse error:`, fenceParseError);
        throw new Error(`Failed to parse AI response as JSON. Raw output: ${raw.slice(0, 500)}`);
      }
    } else {
      throw new Error(`Failed to parse AI response as JSON. Raw output: ${raw.slice(0, 500)}`);
    }
  }

  return { data, raw, model };
}

// ---------- Plain Text Generation ----------

export async function generateText(req: GenerateTextRequest): Promise<GenerateTextResponse> {
  if (!env.GEMINI_API_KEY) {
    console.error('[Gemini API] GEMINI_API_KEY not configured');
    throw new Error('AI provider not configured');
  }

  const model = req.model ?? 'gemini-pro';
  const endpoint = `generateContent (text)`;
  
  logRequest(endpoint, model, req.prompt);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
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

  const responseText = await response.text();
  logResponse(endpoint, response.status, responseText);

  if (!response.ok) {
    logError(endpoint, responseText);
    throw new Error(`AI generation failed: ${responseText}`);
  }

  const data = JSON.parse(responseText);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  console.log(`[Gemini API] Text generated successfully, length: ${text.length} chars`);

  return {
    text,
    model,
  };
}
