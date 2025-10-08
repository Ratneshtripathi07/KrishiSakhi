import { api, setAuthToken } from './api';

export type AdminLoginResponse = {
  token: string;
  admin: { id: number; email: string; name?: string | null; role: string };
};

export function isAllowedGovEmail(email: string): boolean {
  const allowed = ['kerala.gov.in', 'punjab.gov.in', 'up.gov.in'];
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return allowed.includes(domain);
}

export async function adminLoginPassword(email: string, password: string): Promise<AdminLoginResponse> {
  const { data } = await api.post<AdminLoginResponse>('/admin/login', { email, password });
  setAuthToken(data.token);
  return data;
}

export async function adminLoginOtp(email: string, otp: string): Promise<AdminLoginResponse> {
  const { data } = await api.post<AdminLoginResponse>('/admin/login', { email, otp });
  setAuthToken(data.token);
  return data;
}
