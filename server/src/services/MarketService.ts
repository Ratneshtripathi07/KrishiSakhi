// server/src/services/MarketService.ts

export type MarketPoint = { date: string; minPrice: number; maxPrice: number; avgPrice: number };

const crops = ['Rice', 'Coconut', 'Banana', 'Pepper'] as const;
export type CropName = typeof crops[number];

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

export class MarketService {
  listCrops(): CropName[] { return crops.slice() as CropName[]; }

  getTrends(params: { crop?: string; state?: string; city?: string }): { crop: string; points: MarketPoint[] } {
    const crop = (params.crop && crops.find(c => c.toLowerCase() === params.crop!.toLowerCase())) || 'Rice';

    // Seed baseline per crop
    const baseMap: Record<string, number> = { Rice: 28, Coconut: 35, Banana: 24, Pepper: 520 };
    const base = baseMap[crop] ?? 30;

    // Simple pseudo-random variation influenced by city/state names
    const seedStr = `${params.state || ''}|${params.city || ''}|${crop}`;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    function rand() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 0xffffffff; }

    const days = 30;
    const points: MarketPoint[] = [];
    let trend = base * (0.95 + rand() * 0.1);
    for (let d = days - 1; d >= 0; d--) {
      // Date d days ago
      const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      // Add small random walk + weekly oscillation
      const weekly = Math.sin((2 * Math.PI * (days - d)) / 7) * (base * 0.01);
      trend = trend + (rand() - 0.5) * (base * 0.02) + weekly;
      const minPrice = clamp(trend - base * 0.03 - rand() * (base * 0.02), base * 0.5, base * 5);
      const maxPrice = clamp(trend + base * 0.03 + rand() * (base * 0.03), base * 0.6, base * 6);
      const avgPrice = clamp((minPrice + maxPrice) / 2, base * 0.55, base * 5.5);
      points.push({ date: date.toISOString().slice(0, 10), minPrice, maxPrice, avgPrice });
    }

    return { crop, points };
  }
}