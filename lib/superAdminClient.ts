const PROD_API_FALLBACK = 'https://api.gorizontnews.uz';

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? PROD_API_FALLBACK : '');

const API_BASE_URL = rawBaseUrl
  ? `${rawBaseUrl.replace(/\/+$/, '')}/api`
  : '/api';

const ACCESS_TOKEN_KEY = 'super_admin_access_token';
const REFRESH_TOKEN_KEY = 'super_admin_refresh_token';
const USERNAME_KEY = 'super_admin_username';

export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(status: number | undefined, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

function getStoredAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

// Берём accessToken супер-админа, а если его нет — обычный auth_token из основного клиента
function getAnyAccessToken(): string | null {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
    window.localStorage.getItem('auth_token')
  );
}

function getStoredRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getAnyRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem(REFRESH_TOKEN_KEY) ||
    window.localStorage.getItem('refreshToken')
  );
}

function getStoredUsername(): string | null {
  if (!isBrowser()) return null;
  // Сначала пробуем отдельный ключ супер-админа, затем общий username из основного логина
  return (
    window.localStorage.getItem(USERNAME_KEY) ||
    window.localStorage.getItem('username')
  );
}

function saveAuthTokens(accessToken: string, refreshToken: string, username: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  window.localStorage.setItem(USERNAME_KEY, username);
}

export function clearAuthTokens() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USERNAME_KEY);
}

export function getCurrentUsername(): string | null {
  const stored = getStoredUsername();
  if (stored) return stored;

  const token = getAnyAccessToken();
  if (!token) return null;

  const payload = decodeJwtPayload<{ username?: string; sub?: string }>(token);
  return payload?.username || payload?.sub || null;
}

export function isSuperAdmin(): boolean {
  const username = getCurrentUsername();
  return username === 'ergashjon';
}

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAnyAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    const message = data?.message || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return res;
}

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  username?: string;
  [key: string]: any;
};

export async function loginSuperAdmin(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  let data: LoginResponse;
  try {
    data = await res.json();
  } catch {
    data = {} as any;
  }

  if (!res.ok) {
    const msg = (data as any)?.message || 'Ошибка авторизации';
    throw new ApiError(res.status, msg, data);
  }

  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken;

  if (!accessToken || !refreshToken) {
    throw new Error('Не удалось получить токены авторизации');
  }

  let tokenUsername = data.username;
  if (!tokenUsername) {
    const payload = decodeJwtPayload<{ username?: string; sub?: string }>(accessToken);
    tokenUsername = payload?.username || payload?.sub || '';
  }

  if (tokenUsername !== 'ergashjon') {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
    throw new ApiError(403, 'Нет прав доступа', { code: 'NOT_SUPER_ADMIN' });
  }

  saveAuthTokens(accessToken, refreshToken, tokenUsername);
  return { accessToken, refreshToken, username: tokenUsername };
}

export async function logoutSuperAdmin() {
  const refreshToken = getAnyRefreshToken();
  clearAuthTokens();

  if (!refreshToken) return;

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {}
}

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
};

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await apiFetch('/admin/users', {
    method: 'GET',
  });
  const users = (await res.json()) as AdminUser[];
  return users.filter((u) => u.role === 'ROLE_ADMIN');
}

export async function registerAdmin(input: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateAdminPassword(id: number, newPassword: string) {
  await apiFetch(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ password: newPassword }),
  });
}
