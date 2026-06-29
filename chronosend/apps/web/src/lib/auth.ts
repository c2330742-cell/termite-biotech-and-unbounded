import { API_BASE } from '@chronosend/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AuthTokens {
  accessToken: string;
}

interface StoredAuth {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

let currentAuth: StoredAuth | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setAuth(auth: StoredAuth): void {
  currentAuth = auth;
  // Store user info in session (access token stays in memory only)
  sessionStorage.setItem('chronosend_user', JSON.stringify(auth.user));
}

export function clearAuth(): void {
  currentAuth = null;
  sessionStorage.removeItem('chronosend_user');
}

export function getAccessToken(): string | null {
  return currentAuth?.accessToken ?? null;
}

export function getStoredUser(): { id: string; email: string; role: string } | null {
  const stored = sessionStorage.getItem('chronosend_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return currentAuth?.user ?? null;
}

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const json = await res.json();
      if (json.success) {
        const user = getStoredUser();
        if (user) {
          setAuth({ accessToken: json.data.accessToken, user });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string; details?: unknown }> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  // If 401, try refreshing the token
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      res = await fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  const json = await res.json();
  return json;
}

export async function login(email: string, password: string) {
  const result = await apiFetch<{ accessToken: string; user: { id: string; email: string; role: string } }>(
    `${API_BASE}/auth/login`,
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  );

  if (result.success && result.data) {
    setAuth({ accessToken: result.data.accessToken, user: result.data.user });
  }

  return result;
}

export async function googleSignIn(credential: string) {
  const result = await apiFetch<{ accessToken: string; user: { id: string; email: string; role: string } }>(
    `${API_BASE}/auth/google`,
    {
      method: 'POST',
      body: JSON.stringify({ credential }),
    },
  );

  if (result.success && result.data) {
    setAuth({ accessToken: result.data.accessToken, user: result.data.user });
  }

  return result;
}

export async function register(email: string, password: string) {
  const result = await apiFetch<{ accessToken: string; user: { id: string; email: string; role: string } }>(
    `${API_BASE}/auth/register`,
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  );

  if (result.success && result.data) {
    setAuth({ accessToken: result.data.accessToken, user: result.data.user });
  }

  return result;
}

export async function logout(): Promise<void> {
  await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  clearAuth();
}
