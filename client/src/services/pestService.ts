import { api } from './api';

export type AnalyzeImageOptions = {
  crop?: string;
  lat?: number;
  lon?: number;
  notes?: string; // Free-text symptoms/context to guide LLM (Gemini)
};

export type PestAnalysis = {
  prediction?: string; // e.g., "Leaf Spot Disease"
  confidence?: number; // 0..1
  likely_causes?: string[];
  recommended_actions?: string[];
  caution?: string[];
  // Optional LLM metadata
  model?: string; // e.g., gemini-1.5-pro
  reasoning?: string; // model chain-of-thought summary (if provided by backend)
  raw?: unknown; // raw backend payload for debugging
};

/**
 * Analyze a crop image by sending FormData to backend.
 * Backend is responsible for invoking Gemini and composing the advisory.
 */
export async function analyzeImage(file: File, opts: AnalyzeImageOptions = {}): Promise<PestAnalysis> {
  const fd = new FormData();
  fd.append('image', file);
  if (opts.crop) fd.append('crop', opts.crop);
  if (typeof opts.lat === 'number') fd.append('lat', String(opts.lat));
  if (typeof opts.lon === 'number') fd.append('lon', String(opts.lon));
  if (opts.notes) fd.append('notes', opts.notes);

  // Use native fetch to preserve FormData boundaries and avoid JSON headers
  const res = await fetch('/api/predict/pest', {
    method: 'POST',
    body: fd,
    headers: {
      // Hint the backend to use Gemini pipeline when available
      'X-Use-LLM': 'gemini',
    },
  });

  if (!res.ok) {
    // Try to parse error JSON; otherwise throw text
    let message = `Analysis failed (${res.status})`;
    try {
      const j = await res.json();
      message = j?.error || message;
    } catch {
      try {
        message = await res.text();
      } catch {}
    }
    throw new Error(message);
  }
  const data = (await res.json()) as PestAnalysis;
  return data;
}
