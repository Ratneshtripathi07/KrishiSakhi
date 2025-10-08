import { api } from './api';

export type Scheme = {
  id: number;
  title: string;
  description?: string | null;
  eligibility?: string | null;
  link?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  active: boolean;
  created_at: string;
};

export async function getSchemes(): Promise<{ schemes: Scheme[] }>{
  const { data } = await api.get('/schemes');
  return data;
}

export async function adminListSchemes(): Promise<{ schemes: Scheme[] }>{
  const { data } = await api.get('/admin/schemes');
  return data;
}

export async function adminCreateScheme(payload: Partial<Scheme> & { target_state?: string; target_city?: string; target_constituency?: string; image?: File | null }) {
  // Use multipart to support optional image
  const fd = new FormData();
  if (payload.title) fd.append('title', payload.title);
  if (payload.description ?? '') fd.append('description', String(payload.description));
  if (payload.eligibility ?? '') fd.append('eligibility', String(payload.eligibility));
  if (payload.link ?? '') fd.append('link', String(payload.link));
  if (payload.start_date ?? '') fd.append('start_date', String(payload.start_date));
  if (payload.end_date ?? '') fd.append('end_date', String(payload.end_date));
  if (typeof payload.active === 'boolean') fd.append('active', String(payload.active));
  if (payload.target_state ?? '') fd.append('target_state', String(payload.target_state));
  if (payload.target_city ?? '') fd.append('target_city', String(payload.target_city));
  if (payload.target_constituency ?? '') fd.append('target_constituency', String(payload.target_constituency));
  if (payload.image instanceof File) fd.append('image', payload.image);
  const { data } = await api.post('/admin/schemes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}

export async function adminDeleteScheme(id: number) {
  const { data } = await api.delete(`/admin/schemes/${id}`);
  return data;
}
