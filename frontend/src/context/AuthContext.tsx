// ═══════════════════════════════════════════════════════════
// reBorn_i — Auth Context
// ═══════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authAPI } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Extract a human-readable error message from an Axios error response.
 * FastAPI returns errors as:
 *   { "detail": "string message" }           — auth/custom errors
 *   { "detail": [{ "msg": "..." }, ...] }    — Pydantic validation errors
 */
function extractError(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.response?.data?.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg || fallback;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setUser(null);
      return null;
    }
    const { data } = await authAPI.me();
    setUser(data);
    return data;
  }, []);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      await refreshUser();
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUser, token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await authAPI.login(email, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      const userRes = await authAPI.me();
      setUser(userRes.data);
    } catch (err: any) {
      throw new Error(extractError(err, 'Login failed. Please try again.'));
    }
  };

  const register = async (email: string, password: string, fullName?: string) => {
    try {
      await authAPI.register(email, password, fullName);
      await login(email, password);
    } catch (err: any) {
      // If it's already a clean Error (from login re-throw), pass it through
      if (err instanceof Error) throw err;
      throw new Error(extractError(err, 'Registration failed. Please try again.'));
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      const { data } = await authAPI.googleLogin(idToken);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      const userRes = await authAPI.me();
      setUser(userRes.data);
    } catch (err: any) {
      throw new Error(extractError(err, 'Google sign-in failed. Please try again.'));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
