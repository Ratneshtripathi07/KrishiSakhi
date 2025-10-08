import { api } from './api';

export type MarketPoint = { date: string; minPrice: number; maxPrice: number; avgPrice: number };

export async function listCrops(): Promise<string[]> {
  const { data } = await api.get<{ crops: string[] }>('/market/crops');
  return data.crops || [];
}

export async function fetchTrends(params: { crop?: string; state?: string; city?: string }): Promise<{ crop: string; points: MarketPoint[] }> {
  const { data } = await api.get<{ crop: string; points: MarketPoint[] }>('/market/trends', { params });
  return data;
}