import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string })?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await api.login({ email, password });
      login(res.token, res.user);
      navigate(from, { replace: true });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div>
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            FamilyOS — FamVault
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Password
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          No account?{" "}
          <Link className="text-[hsl(var(--primary))]" to="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
