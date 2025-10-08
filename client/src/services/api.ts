import axios, { AxiosError, AxiosInstance } from 'axios';

// Token storage key
const TOKEN_KEY = 'km_token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export type ApiProblem = {
  status: number;
  message: string;
  details?: unknown;
};

// Determine API base URL. Prefer NEXT_PUBLIC_API_BASE to bypass Next.js rewrites if needed.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

// Primary Axios (can point to ngrok) and a same-origin fallback client (/api -> Next dev rewrite)
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const fallbackApi: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if we have a token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Try a one-shot fallback to same-origin /api when primary base (e.g., ngrok) is blocked by CORS/network
    const config: any = error.config || {};
    const status = error.response?.status || 0;
    const isNetwork = error.code === 'ERR_NETWORK' || status === 0;
    const canFallback = typeof window !== 'undefined' && api.defaults.baseURL !== '/api' && !config.__retriedWithFallback;

    if (isNetwork && canFallback) {
      try {
        const retryCfg = { ...config, baseURL: undefined };
        retryCfg.__retriedWithFallback = true;
        const method = (retryCfg.method || 'get').toLowerCase();
        const url = retryCfg.url as string;
        // send via fallback client
        const resp = await (fallbackApi as any)[method](url, retryCfg.data, { params: retryCfg.params, headers: retryCfg.headers });
        return resp;
      } catch (e) {
        // continue to normalize below
      }
    }

    const problem: ApiProblem = {
      status,
      message:
        (error.response?.data as any)?.error ||
        error.message ||
        'Network error. Please try again.',
      details: error.response?.data,
    };
    return Promise.reject(problem);
  },
);

export { api, TOKEN_KEY };
