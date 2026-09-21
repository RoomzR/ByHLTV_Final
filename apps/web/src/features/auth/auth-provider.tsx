"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { can, hasMinRole, UserRole, type Capability } from "@byhltv/shared";
import {
  apiClient,
  clearLegacyTokens,
  type AuthUser,
} from "@/shared/api/client";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hasMinRole: (role: string) => boolean;
  can: (capability: Capability) => boolean;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const me = await apiClient.me();
    setUser(me);
  }, []);

  useEffect(() => {
    clearLegacyTokens();
    apiClient
      .me()
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.login(email, password);
    setUser(data.user);
    try {
      await refreshMe();
    } catch {
      /* login payload is enough */
    }
  }, [refreshMe]);

  const register = useCallback(
    async (payload: {
      email: string;
      username: string;
      password: string;
      displayName?: string;
    }) => {
      const data = await apiClient.register(payload);
      setUser(data.user);
      try {
        await refreshMe();
      } catch {
        /* register payload is enough */
      }
    },
    [refreshMe],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      /* still clear local session */
    }
    clearLegacyTokens();
    setUser(null);
  }, []);

  const hasMinRoleCb = useCallback(
    (role: string) => {
      if (!user) return false;
      return hasMinRole(user.role as UserRole, role as UserRole);
    },
    [user],
  );

  const canCb = useCallback(
    (capability: Capability) => can(user?.role, capability),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      hasMinRole: hasMinRoleCb,
      can: canCb,
      refreshMe,
    }),
    [user, loading, login, register, logout, hasMinRoleCb, canCb, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
