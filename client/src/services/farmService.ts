import { api } from './api';

export type FarmListItem = {
  id: number;
  name: string | null;
  area_acres: number | null;
  crop: string | null;
  status: string;
};

export type FarmsSummary = {
  totalAreaAcres: number;
  cropsCount: number;
  pendingTasks: number;
};

export async function getFarms(): Promise<{ farms: FarmListItem[]; summary: FarmsSummary }>{
  const { data } = await api.get('/farms');
  return data;
}

export async function getFarmDetails(farmId: number): Promise<{ farm: any; metrics: any; tasks: any[] }>{
  const { data } = await api.get(`/farms/${farmId}`);
  return data;
}

export async function updateTaskStatus(farmId: number, taskId: number, status: 'pending' | 'done') {
  const { data } = await api.patch(`/farms/${farmId}/tasks/${taskId}`, { status });
  return data;
}

export async function updateFarm(farmId: number, body: any) {
  const { data } = await api.patch(`/farms/${farmId}`, body);
  return data;
}

export async function uploadFarmPhotos(farmId: number, files: FileList | File[]) {
  const fd = new FormData();
  const arr = (files instanceof FileList) ? Array.from(files) : Array.from(files);
  for (const f of arr) fd.append('photos', f);
  const { data } = await api.post(`/farms/${farmId}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}

export async function uploadSoilReport(farmId: number, file: File) {
  const fd = new FormData();
  fd.append('report', file);
  const { data } = await api.post(`/farms/${farmId}/soil-report`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}
