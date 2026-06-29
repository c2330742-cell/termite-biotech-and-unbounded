import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  googleSignIn as apiGoogleSignIn,
  getStoredUser,
  clearAuth,
  setAuth,
  apiFetch,
} from '../lib/auth';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  hasCredentials: boolean | null;
  credentialsLoading: boolean;
  checkCredentials: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  googleSignIn: (credential: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  const checkCredentials = useCallback(async () => {
    if (!user) return;
    setCredentialsLoading(true);
    try {
      const result = await apiFetch<{
        email_address: string | null;
        telegram_bot_token_preview: string | null;
        email_app_password_preview: string | null;
        twilio_account_sid_preview: string | null;
        twilio_auth_token_preview: string | null;
      }>('/api/v1/settings');
      if (result.success && result.data) {
        const d = result.data;
        const configured =
          !!d.email_address ||
          !!d.telegram_bot_token_preview ||
          !!d.email_app_password_preview ||
          !!d.twilio_account_sid_preview ||
          !!d.twilio_auth_token_preview;
        setHasCredentials(configured);
      }
    } catch {
      // Silently fail — credentials check is non-critical
    } finally {
      setCredentialsLoading(false);
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await apiLogin(email, password);
      if (result.success && result.data) {
        const u = result.data.user;
        setUser(u);
        return { success: true };
      }
      return { success: false, error: result.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await apiRegister(email, password);
      if (result.success && result.data) {
        const u = result.data.user;
        setUser(u);
        return { success: true };
      }
      return { success: false, error: result.error || 'Registration failed' };
    } catch {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, []);

  const googleSignIn = useCallback(async (credential: string) => {
    setLoading(true);
    try {
      const result = await apiGoogleSignIn(credential);
      if (result.success && result.data) {
        const u = result.data.user;
        setUser(u);
        return { success: true };
      }
      return { success: false, error: result.error || 'Google sign-in failed' };
    } catch {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    clearAuth();
    setHasCredentials(null);
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    if (u) setUser(u);
  }, []);

  useEffect(() => {
    if (user) checkCredentials();
  }, [user, checkCredentials]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        hasCredentials,
        credentialsLoading,
        checkCredentials,
        login,
        register,
        googleSignIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
