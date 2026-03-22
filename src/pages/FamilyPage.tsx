import { api } from "@/lib/api";
import { useFamily } from "@/context/FamilyContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function FamilyPage() {
  const { selectedFamilyId } = useFamily();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");

  const members = useQuery({
    queryKey: ["members", selectedFamilyId],
    queryFn: () => api.members(selectedFamilyId!),
    enabled: !!selectedFamilyId,
  });

  const add = useMutation({
    mutationFn: () =>
      api.addMember(selectedFamilyId!, {
        displayName: name.trim(),
        relationship: rel.trim() || undefined,
      }),
    onSuccess: async () => {
      setName("");
      setRel("");
      await qc.invalidateQueries({ queryKey: ["members", selectedFamilyId] });
    },
  });

  if (!selectedFamilyId) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Create or select a family first.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-base font-semibold">Family</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Members linked to this family. Graph visualization comes next; for now
          use a simple list.
        </p>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h2 className="text-sm font-medium">Add member</h2>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) add.mutate();
          }}
        >
          <input
            className="min-w-[160px] flex-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="min-w-[120px] rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm"
            placeholder="Relationship"
            value={rel}
            onChange={(e) => setRel(e.target.value)}
          />
          <button
            type="submit"
            disabled={add.isPending || !name.trim()}
            className="rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-medium">Members</h2>
        {members.isLoading && (
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Loading…
          </p>
        )}
        <ul className="mt-3 divide-y divide-[hsl(var(--border))] rounded-xl border border-[hsl(var(--border))]">
          {(members.data ?? []).map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-medium">{m.displayName}</span>
              <span className="text-[hsl(var(--muted-foreground))]">
                {m.relationship ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        React Flow graph (pan/zoom, edges) — planned in next iteration.
      </div>
    </div>
  );
}
