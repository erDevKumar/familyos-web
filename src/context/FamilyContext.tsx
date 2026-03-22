import { api, type FamilySummary } from "@/lib/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "familyos_family_id";

const FamilyContext = createContext<
  | {
      families: FamilySummary[];
      selectedFamilyId: string | null;
      setSelectedFamilyId: (id: string | null) => void;
      refreshFamilies: () => Promise<void>;
      loading: boolean;
    }
  | null
>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [selectedFamilyId, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshFamilies = useCallback(async () => {
    if (!user) {
      setFamilies([]);
      setSelectedState(null);
      return;
    }
    setLoading(true);
    try {
      const list = await api.families();
      setFamilies(list);
      const stored = localStorage.getItem(STORAGE_KEY);
      const valid =
        stored && list.some((f) => f.id === stored) ? stored : list[0]?.id ?? null;
      setSelectedState(valid);
      if (valid) localStorage.setItem(STORAGE_KEY, valid);
      else localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user) void refreshFamilies();
    if (ready && !user) {
      setFamilies([]);
      setSelectedState(null);
    }
  }, [ready, user, refreshFamilies]);

  const setSelectedFamilyId = useCallback((id: string | null) => {
    setSelectedState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      families,
      selectedFamilyId,
      setSelectedFamilyId,
      refreshFamilies,
      loading,
    }),
    [families, selectedFamilyId, setSelectedFamilyId, refreshFamilies, loading],
  );

  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily outside FamilyProvider");
  return ctx;
}
