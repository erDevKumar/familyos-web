import { api, type UserDto } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthState = {
  user: UserDto | null;
  loading: boolean;
  ready: boolean;
};

const AuthContext = createContext<
  | (AuthState & {
      login: (token: string, user: UserDto) => void;
      logout: () => void;
      refresh: () => Promise<void>;
    })
  | null
>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      setReady(true);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onAuth = () => {
      setUser(null);
    };
    window.addEventListener("familyos:auth", onAuth);
    return () => window.removeEventListener("familyos:auth", onAuth);
  }, []);

  const login = useCallback((token: string, u: UserDto) => {
    setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      ready,
      login,
      logout,
      refresh,
    }),
    [user, loading, ready, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
