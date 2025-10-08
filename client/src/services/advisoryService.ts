export type Advisory = {
  key: string;
  text: string;
  severity: 'info' | 'warning' | 'critical';
};

export async function fetchAdvisories(params: { lat?: number; lon?: number; state?: string; city?: string; crop?: string }): Promise<{ advisories: Advisory[] }> {
  const qs = new URLSearchParams();
  if (typeof params.lat === 'number') qs.set('lat', String(params.lat));
  if (typeof params.lon === 'number') qs.set('lon', String(params.lon));
  if (params.state) qs.set('state', params.state);
  if (params.city) qs.set('city', params.city);
  if (params.crop) qs.set('crop', params.crop);
  const url = `/api/advisory${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `Failed to fetch advisories (${res.status})`;
    try { const j = await res.json(); msg = j?.error || msg; } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  return { advisories: Array.isArray(data?.advisories) ? data.advisories : [] };
}