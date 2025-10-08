import { api } from './api';

export type AdminStats = {
  users: number;
  farms: number;
  cycles: number;
};

export type WeeklyIssue = {
  type: string;
  count: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>('/admin/analytics/stats');
  return data;
}

export async function getWeeklyIssues(): Promise<{ since: string; issues: WeeklyIssue[] }> {
  const { data } = await api.get<{ since: string; issues: WeeklyIssue[] }>('/admin/analytics/weekly-issues');
  return data;
}

export async function broadcastAdvisory(
  message: string,
  title_key?: string,
  filters?: { state?: string; city?: string; constituency?: string },
): Promise<{ delivered: number }> {
  const payload: any = { message, title_key };
  if (filters?.state) payload.state = filters.state;
  if (filters?.city) payload.city = filters.city;
  if (filters?.constituency) payload.constituency = filters.constituency;
  const { data } = await api.post<{ delivered: number }>('/admin/broadcast', payload);
  return data;
}
