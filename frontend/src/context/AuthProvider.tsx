import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import type { User, LoginPayload } from "@/types";
import { AuthContext } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { setAccessToken } from "@/services/api";

interface AuthResponse {
  accessToken: string;
  user: User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [accessToken, setToken]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSession = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToken(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  // Stored in a ref so it can self-reference without circular deps
  const scheduleRefreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    scheduleRefreshRef.current = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        authService
          .refresh()
          .then((r: AuthResponse) => {
            setToken(r.accessToken);
            setAccessToken(r.accessToken);
            setUser(r.user);
            scheduleRefreshRef.current();
          })
          .catch(clearSession);
      }, 14 * 60 * 1000);
    };
  }, [clearSession]);

const applySession = useCallback((token: string, me: User) => {
    setToken(token);
    setAccessToken(token);
    setUser(me);
    scheduleRefreshRef.current();
  }, []);

  useEffect(() => {
    authService
      .refresh()
      .then((r: AuthResponse) => applySession(r.accessToken, r.user))
      .catch(() => {})
      .finally(() => setIsLoading(false));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [applySession]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const r: AuthResponse = await authService.login(payload);
      applySession(r.accessToken, r.user);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshAuth = useCallback(async () => {
    const r: AuthResponse = await authService.refresh();
    applySession(r.accessToken, r.user);
  }, [applySession]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}