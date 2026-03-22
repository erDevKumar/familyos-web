import { api } from "@/lib/api";
import { useFamily } from "@/context/FamilyContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const { selectedFamilyId, families, refreshFamilies } = useFamily();
  const qc = useQueryClient();
  const [familyName, setFamilyName] = useState("");

  const createFamily = useMutation({
    mutationFn: (name: string) => api.createFamily(name),
    onSuccess: async () => {
      setFamilyName("");
      await refreshFamilies();
      await qc.invalidateQueries();
    },
  });

  const dashboard = useQuery({
    queryKey: ["dashboard", selectedFamilyId],
    queryFn: () => api.dashboard(selectedFamilyId!),
    enabled: !!selectedFamilyId,
  });

  const health = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-base font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Today’s priorities, upcoming work, and API status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            API
          </div>
          <div className="mt-2 font-mono text-sm">
            {health.isLoading && "Checking…"}
            {health.isError && "Offline"}
            {health.isSuccess &&
              `${health.data.service}: ${health.data.status}`}
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Documents in family
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {selectedFamilyId && dashboard.data
              ? dashboard.data.documentCount
              : "—"}
          </div>
        </div>
      </div>

      {families.length === 0 && (
        <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <h2 className="text-sm font-medium">Create your first family</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            A family groups members, documents, and reminders together.
          </p>
          <form
            className="mt-4 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (familyName.trim()) {
                createFamily.mutate(familyName.trim());
              }
            }}
          >
            <input
              className="min-w-[200px] flex-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm"
              placeholder="Family name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
            <button
              type="submit"
              disabled={createFamily.isPending || !familyName.trim()}
              className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
            >
              {createFamily.isPending ? "Creating…" : "Create family"}
            </button>
          </form>
          {createFamily.isError && (
            <p className="mt-2 text-sm text-[hsl(var(--destructive))]">
              Could not create family.
            </p>
          )}
        </div>
      )}

      {selectedFamilyId && dashboard.data && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Priority queue</h2>
          {dashboard.data.items.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              No dated fields yet. Add documents with dates (e.g. next due
              date, EMI) to see items here.
            </p>
          ) : (
            <ul className="divide-y divide-[hsl(var(--border))] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              {dashboard.data.items.slice(0, 20).map((item, i) => (
                <li
                  key={`${item.documentId}-${item.fieldKey}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <span
                      className={
                        item.band === "CRITICAL"
                          ? "text-[hsl(var(--destructive))]"
                          : item.band === "HIGH"
                            ? "text-amber-700 dark:text-amber-400"
                            : ""
                      }
                    >
                      [{item.band}]
                    </span>{" "}
                    {item.title}
                  </div>
                  <div className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
                    {item.dueDate}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm">
            <Link
              className="text-[hsl(var(--primary))] underline"
              to="/documents"
            >
              Manage documents
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
