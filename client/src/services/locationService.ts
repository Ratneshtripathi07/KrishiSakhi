import { api } from './api';

export async function fetchStates(): Promise<string[]> {
  const { data } = await api.get<{ states: string[] }>('/locations/states');
  return data.states || [];
}

export async function fetchCities(state?: string): Promise<string[]> {
  const { data } = await api.get<{ cities: string[] }>('/locations/cities', { params: state ? { state } : {} });
  return data.cities || [];
}

export async function fetchConstituencies(state?: string, city?: string): Promise<string[]> {
  const params: Record<string, string> = {};
  if (state) params.state = state;
  if (city) params.city = city;
  const { data } = await api.get<{ constituencies: string[] }>('/locations/constituencies', { params });
  return data.constituencies || [];
}
