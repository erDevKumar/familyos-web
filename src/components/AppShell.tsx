import {
  CalendarDays,
  FileSpreadsheet,
  Home,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useFamily } from "@/context/FamilyContext";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/documents", label: "Documents", icon: FileSpreadsheet },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/family", label: "Family", icon: Network },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { families, selectedFamilyId, setSelectedFamilyId } = useFamily();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <aside className="hidden w-64 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-[hsl(var(--border))] px-4">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-[hsl(var(--primary))]" aria-hidden />
            <span className="font-semibold tracking-tight">FamilyOS</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-l-[3px] border-[hsl(var(--primary))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                ].join(" ")
              }
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4">
          <div className="flex min-w-0 items-center gap-3">
            {families.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                Family
                <select
                  className="max-w-[200px] rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm text-[hsl(var(--foreground))]"
                  value={selectedFamilyId ?? ""}
                  onChange={(e) => setSelectedFamilyId(e.target.value || null)}
                >
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.role})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden truncate text-xs text-[hsl(var(--muted-foreground))] sm:inline">
              {user?.displayName}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-2 py-1 text-xs font-medium hover:bg-[hsl(var(--muted))]"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
