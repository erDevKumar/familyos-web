import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, ready } = useAuth();
  const loc = useLocation();

  if (!ready || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}
