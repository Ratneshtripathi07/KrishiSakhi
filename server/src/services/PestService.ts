// server/src/services/PestService.ts
import { env } from '../config/environment';
import { GoogleGenAI } from '@google/genai';

export type AnalyzeReq = {
  file: Express.Multer.File;
  crop?: string;
  notes?: string;
  lat?: number;
  lon?: number;
};

export type PestAnalysis = {
  prediction?: string;
  confidence?: number;
  likely_causes?: string[];
  recommended_actions?: string[];
  caution?: string[];
  model?: string;
  raw?: unknown;
};

export class PestService {
  private static ai: GoogleGenAI | null = null;
  private static resolvedModel: string | null = null;

  private getClient(): GoogleGenAI {
    if (!PestService.ai) {
      const key = env.GEMINI_API_KEY || env.GEN_AI_API_KEY;
      if (!key) {
        throw Object.assign(new Error('GEMINI_API_KEY not set'), { status: 503 });
      }
      PestService.ai = new GoogleGenAI({ apiKey: key });
    }
    return PestService.ai;
  }

  private async resolveModel(): Promise<string> {
    const envModel = (env.GEN_AI_MODEL || '').trim();
    if (envModel) return envModel.startsWith('models/') ? envModel.slice('models/'.length) : envModel;
    if (PestService.resolvedModel) return PestService.resolvedModel;
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEN_AI_API_KEY}`;
      const r = await fetch(listUrl);
      if (r.ok) {
        const j = await r.json();
        const models: { name?: string }[] = Array.isArray(j?.models) ? j.models : [];
        const names = models.map((m) => m.name || '').filter(Boolean);
        const pickFull =
          names.find((n) => n.includes('gemini-1.5-pro')) ||
          names.find((n) => n.includes('gemini-1.5-flash')) ||
          names.find((n) => n.includes('gemini-1.0-pro')) ||
          '';
        const id = pickFull ? (pickFull.startsWith('models/') ? pickFull.slice('models/'.length) : pickFull) : 'gemini-1.5-pro';
        PestService.resolvedModel = id;
        return id;
      }
    } catch {}
    return 'gemini-1.5-pro';
  }

  private async callGemini(parts: any[]): Promise<any> {
    const ai = this.getClient();
    let model = await this.resolveModel();
    try {
      const is25 = /2\.5/.test(model);
      const req: any = { model, contents: [{ role: 'user', parts }] };
      if (is25) req.config = { thinkingConfig: { thinkingBudget: 0 } };
      const resp = await ai.models.generateContent(req);
      return resp;
    } catch (e: any) {
      if (String(e?.message || '').includes('404') || String(e?.error?.status || '').includes('NOT_FOUND')) {
        PestService.resolvedModel = null;
        model = await this.resolveModel();
        const is25b = /2\.5/.test(model);
        const req2: any = { model, contents: [{ role: 'user', parts }] };
        if (is25b) req2.config = { thinkingConfig: { thinkingBudget: 0 } };
        const resp = await ai.models.generateContent(req2);
        return resp;
      }
      throw e;
    }
  }

  async analyze({ file, crop, notes, lat, lon }: AnalyzeReq): Promise<PestAnalysis> {
    // Require LLM configuration; no demo fallback
    if (!env.GEN_AI_API_KEY) {
      throw Object.assign(new Error('LLM not configured'), { status: 503 });
    }

    // Real provider path (Gemini multimodal via inline image)
    const base64 = file.buffer.toString('base64');
    const instruction = `You are an agronomy assistant. Analyze the plant image and return a concise JSON with fields: prediction, confidence(0..1), likely_causes[], recommended_actions[], caution[]. Avoid extra text.`;
    const parts = [
      { text: instruction },
      ...(crop ? [{ text: `\nCrop: ${crop}` }] : []),
      ...(notes ? [{ text: `\nNotes: ${notes}` }] : []),
      ...(typeof lat === 'number' && typeof lon === 'number' ? [{ text: `\nLocation: ${lat}, ${lon}` }] : []),
      { inlineData: { mimeType: file.mimetype || 'image/jpeg', data: base64 } },
    ];
    const data = await this.callGemini(parts);
    const rawText: string = (data as any)?.text || (data as any)?.response?.text || '';

    // Attempt to parse JSON from model output
    let parsed: any = null;
    try {
      const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
      parsed = JSON.parse(cleaned);
    } catch {}

    if (parsed && typeof parsed === 'object') {
      return {
        prediction: parsed.prediction,
        confidence: parsed.confidence,
        likely_causes: parsed.likely_causes,
        recommended_actions: parsed.recommended_actions,
        caution: parsed.caution,
        model: 'gemini',
        raw: data,
      };
    }

    // Fallback: return the raw text as a single advisory
    return {
      prediction: 'See analysis notes',
      confidence: undefined,
      recommended_actions: undefined,
      caution: [rawText || 'Model returned no structured output'],
      model: 'gemini',
      raw: data,
    };
  }
}
