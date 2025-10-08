import { api, setAuthToken } from './api';

export type RequestOtpResponse = {
  success: boolean;
  message?: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    phone_number: string;
    email?: string | null;
    name?: string | null;
    language_preference: string;
  };
};

export async function requestOtp(phoneNumber: string): Promise<RequestOtpResponse> {
  const { data } = await api.post<RequestOtpResponse>('/auth/otp', { phoneNumber });
  return data;
}

export async function login(phoneNumber: string, otp: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { phoneNumber, otp });
  // Persist JWT for subsequent requests
  setAuthToken(data.token);
  return data;
}

export async function loginWithPassword(params: { phoneNumber?: string; email?: string; password: string }): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login/password', params);
  setAuthToken(data.token);
  return data;
}

export async function signupFarmer(params: { name: string; phoneNumber: string; password: string; email?: string }): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/signup', params);
  // Optionally set token immediately after signup (can be used for auto-login)
  setAuthToken(data.token);
  return data;
}
