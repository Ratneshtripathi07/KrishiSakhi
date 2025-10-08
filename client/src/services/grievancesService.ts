import { api } from './api';

export type Grievance = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category?: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
};

export async function createGrievance(payload: { title: string; description: string; category?: string }) {
  const { data } = await api.post('/grievances', payload);
  return data;
}

export async function listMyGrievances(): Promise<{ grievances: Grievance[] }>{
  const { data } = await api.get('/grievances/me');
  return data;
}

export async function adminListGrievances(): Promise<{ grievances: (Grievance & { user: { id: number; name?: string | null; phone_number: string } })[] }>{
  const { data } = await api.get('/admin/grievances');
  return data;
}

export async function adminUpdateGrievance(id: number, status: 'open' | 'in_progress' | 'resolved') {
  const { data } = await api.patch(`/admin/grievances/${id}`, { status });
  return data;
}
