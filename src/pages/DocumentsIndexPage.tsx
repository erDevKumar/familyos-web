import { api, type DocumentType } from "@/lib/api";
import { useFamily } from "@/context/FamilyContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export function DocumentsIndexPage() {
  const { selectedFamilyId } = useFamily();
  const q = useQuery({
    queryKey: ["document-types"],
    queryFn: () => api.documentTypes(false),
  });

  const activeTypes =
    q.data?.filter((t: DocumentType) => t.isActive) ?? [];

  if (!selectedFamilyId) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Create or select a family from the header to manage documents.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-semibold">Documents</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Choose a category to open the sheet view (MVP: Insurance, Vehicle,
          Banking, Loans).
        </p>
      </div>
      {q.isLoading && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      )}
      {q.isError && (
        <p className="text-sm text-[hsl(var(--destructive))]">
          Could not load document types.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeTypes.map((t) => (
          <Link
            key={t.id}
            to={`/documents/${t.code}`}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-colors hover:border-[hsl(var(--primary))]"
          >
            <div className="font-medium">{t.name}</div>
            <div className="mt-1 font-mono text-xs text-[hsl(var(--muted-foreground))]">
              {t.code}
            </div>
            <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              {t.fields.length} fields
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
