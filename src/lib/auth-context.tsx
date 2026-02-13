'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, me as meApi, type UserProfile, type TokenPair } from './api';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<string | null>;
  getToken: () => Promise<string | null>;
  setUser: (u: UserProfile) => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'badbuddy_auth';

function saveTokens(tokens: TokenPair) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }
}

function loadTokens(): TokenPair | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now() - 30000; // 30s buffer
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    const stored = loadTokens();
    const rt = refreshToken || stored?.refreshToken;
    if (!rt) return null;
    try {
      const tokens = await authApi.refresh(rt);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      saveTokens(tokens);
      return tokens.accessToken;
    } catch {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      clearTokens();
      return null;
    }
  }, [refreshToken]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (accessToken && !isTokenExpired(accessToken)) return accessToken;
    return refreshTokens();
  }, [accessToken, refreshTokens]);

  useEffect(() => {
    const init = async () => {
      const stored = loadTokens();
      if (!stored) {
        setIsLoading(false);
        return;
      }
      setRefreshToken(stored.refreshToken);
      try {
        let at = stored.accessToken;
        if (isTokenExpired(at)) {
          const tokens = await authApi.refresh(stored.refreshToken);
          at = tokens.accessToken;
          setRefreshToken(tokens.refreshToken);
          saveTokens(tokens);
        }
        setAccessToken(at);
        const profile = await meApi.get(at);
        setUser(profile);
      } catch {
        clearTokens();
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (phone: string, code: string) => {
    const res = await authApi.verifyOtp(phone, code);
    setAccessToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    saveTokens(res);
    try {
      const profile = await meApi.get(res.accessToken);
      setUser(profile);
    } catch {
      setUser({ id: res.me.id, phone: res.me.phone, email: res.me.email, firstName: res.me.firstName, lastName: res.me.lastName });
    }
  };

  const logout = async () => {
    const rt = refreshToken;
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    clearTokens();
    if (rt) {
      try { await authApi.logout(rt); } catch { /* ignore */ }
    }
  };

  return (
    <AuthContext.Provider value={{
      accessToken,
      refreshToken,
      user,
      isLoading,
      isAuthenticated: !!accessToken && !!user,
      login,
      logout,
      refreshTokens,
      getToken,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
