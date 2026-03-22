import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await api.register({ email, password, displayName });
      login(res.token, res.user);
      navigate("/", { replace: true });
    } catch {
      setError("Could not register. Email may already be in use.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div>
          <h1 className="text-lg font-semibold">Create account</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Start managing your family records securely.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Display name
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
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
              Password (min 8 characters)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
              type="password"
              autoComplete="new-password"
              minLength={8}
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
            {pending ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          Already have an account?{" "}
          <Link className="text-[hsl(var(--primary))]" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
