"use client";

import "@ant-design/v5-patch-for-react-19";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken } from "./api";
import type { CurrentUser } from "./types";

const SESSION_MARKER_COOKIE = "hris_session";
const SESSION_MARKER_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, mirrors backend refresh-token TTL

function markSessionActive() {
  document.cookie = `${SESSION_MARKER_COOKIE}=1; path=/; max-age=${SESSION_MARKER_MAX_AGE}; samesite=lax`;
}

function clearSessionMarker() {
  document.cookie = `${SESSION_MARKER_COOKIE}=; path=/; max-age=0`;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshRes = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (!refreshRes.ok) throw new Error("no session");
        const { accessToken } = await refreshRes.json();
        setAccessToken(accessToken);
        const me = await api.get<CurrentUser>("/auth/me");
        if (!cancelled) {
          setUser(me);
          markSessionActive();
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
          clearSessionMarker();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ accessToken: string; user: CurrentUser }>(
      "/auth/login",
      { email, password },
    );
    setAccessToken(result.accessToken);
    setUser(result.user);
    markSessionActive();
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
      clearSessionMarker();
      router.replace("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
