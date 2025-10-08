// server/src/services/ChatService.ts
import { env } from '../config/environment';
import { GoogleGenAI } from '@google/genai';

export type ChatQuery = { text: string; crop?: string; lat?: number; lon?: number; context?: any };
export type ChatAnswer = { answer: string; model?: string; facts?: string[]; caution?: string[]; raw?: unknown };

export class ChatService {
  private static ai: GoogleGenAI | null = null;
  private static resolvedModel: string | null = null;

  private getClient(): GoogleGenAI {
    if (!ChatService.ai) {
      const key = env.GEMINI_API_KEY || env.GEN_AI_API_KEY;
      if (!key) {
        throw Object.assign(new Error('GEMINI_API_KEY not set'), { status: 503 });
      }
      // New Gemini API SDK picks up the key from constructor options
      ChatService.ai = new GoogleGenAI({ apiKey: key });
    }
    return ChatService.ai;
  }

  private async resolveModel(): Promise<string> {
    const envModel = (env.GEN_AI_MODEL || '').trim();
    if (envModel) {
      // Allow both "gemini-..." and "models/gemini-..." from env
      return envModel.startsWith('models/') ? envModel.slice('models/'.length) : envModel;
    }
    if (ChatService.resolvedModel) return ChatService.resolvedModel;
    // Discover available models and pick a stable one
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEN_AI_API_KEY}`;
      const r = await fetch(listUrl);
      if (r.ok) {
        const j = await r.json();
        const models: { name?: string }[] = Array.isArray(j?.models) ? j.models : [];
        const names = models.map((m) => (m.name || '')).filter(Boolean);
        const pickFull =
          names.find((n) => n.includes('gemini-1.5-pro')) ||
          names.find((n) => n.includes('gemini-1.5-flash')) ||
          names.find((n) => n.includes('gemini-1.0-pro')) ||
          '';
        const id = pickFull ? (pickFull.startsWith('models/') ? pickFull.slice('models/'.length) : pickFull) : 'gemini-1.5-pro';
        ChatService.resolvedModel = id;
        return id;
      }
    } catch {}
    // Fallback if discovery fails
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
      // Retry once with re-discovered model on 404
      if (String(e?.message || '').includes('404') || String(e?.error?.status || '').includes('NOT_FOUND')) {
        ChatService.resolvedModel = null;
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

  async ask(q: ChatQuery): Promise<ChatAnswer> {
    // Require LLM configuration; no demo fallback
    if (!env.GEN_AI_API_KEY) {
      throw Object.assign(new Error('LLM not configured'), { status: 503 });
    }

    // Compose prompt
    const contextBits: string[] = [];
    if (q.crop) contextBits.push(`Crop: ${q.crop}`);
    if (typeof q.lat === 'number' && typeof q.lon === 'number') contextBits.push(`Location: ${q.lat}, ${q.lon}`);
    const contextLine = contextBits.length ? `\nContext: ${contextBits.join(' | ')}` : '';
    const prompt = `Answer concisely for an Indian farmer. Avoid brand names. Provide practical steps. Question: ${q.text}${contextLine}`;

    const data = await this.callGemini([{ text: prompt }]);
    // SDK returns { text } directly
    const text = (data as any)?.text || (data as any)?.response?.text || 'No answer';

    const facts: string[] = [];
    if (q.crop) facts.push(`Crop: ${q.crop}`);
    if (typeof q.lat === 'number' && typeof q.lon === 'number') facts.push(`Location: ${q.lat.toFixed(2)},${q.lon.toFixed(2)}`);

    return {
      answer: text.trim(),
      model: 'gemini',
      facts,
    };
  }
}
