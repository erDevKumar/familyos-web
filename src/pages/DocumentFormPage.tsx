import { api, type DocumentType } from "@/lib/api";
import { useFamily } from "@/context/FamilyContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export function DocumentFormPage() {
  const { typeCode, documentId } = useParams<{
    typeCode: string;
    documentId?: string;
  }>();
  const isNew = !documentId;
  const { selectedFamilyId } = useFamily();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const types = useQuery({
    queryKey: ["document-types"],
    queryFn: () => api.documentTypes(false),
  });

  const docType: DocumentType | undefined = types.data?.find(
    (t) => t.code === typeCode,
  );

  const existing = useQuery({
    queryKey: ["document", selectedFamilyId, documentId],
    queryFn: () => api.document(selectedFamilyId!, documentId!),
    enabled: !!selectedFamilyId && !!documentId && !isNew,
  });

  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  const members = useQuery({
    queryKey: ["members", selectedFamilyId],
    queryFn: () => api.members(selectedFamilyId!),
    enabled: !!selectedFamilyId,
  });

  useEffect(() => {
    if (existing.data) {
      const v: Record<string, string> = {};
      for (const [k, val] of Object.entries(existing.data.fields)) {
        v[k] = val ?? "";
      }
      setValues(v);
      setMemberIds(existing.data.memberIds);
    } else if (isNew && members.data?.length) {
      setMemberIds([members.data[0].id]);
    }
  }, [existing.data, isNew, members.data]);

  const sortedFields = useMemo(() => {
    if (!docType) return [];
    return [...docType.fields].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [docType]);

  const save = useMutation({
    mutationFn: async () => {
      if (!selectedFamilyId || !docType) throw new Error("missing");
      const fieldValues: Record<string, unknown> = {};
      for (const f of sortedFields) {
        const raw = values[f.fieldKey]?.trim() ?? "";
        if (!raw && !f.required) continue;
        if (f.fieldType === "NUMBER" || f.fieldType === "CURRENCY" || f.fieldType === "PERCENT") {
          fieldValues[f.fieldKey] = raw ? Number(raw) : null;
        } else if (f.fieldType === "BOOLEAN") {
          fieldValues[f.fieldKey] = raw === "true" || raw === "yes";
        } else {
          fieldValues[f.fieldKey] = raw;
        }
      }
      if (isNew) {
        return api.createDocument(selectedFamilyId, {
          documentTypeId: docType.id,
          fieldValues,
          memberIds,
        });
      }
      return api.updateDocument(selectedFamilyId, documentId!, {
        fieldValues,
        memberIds,
      });
    },
    onSuccess: (doc) => {
      void qc.invalidateQueries({ queryKey: ["documents"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/documents/${doc.documentTypeCode}`);
    },
  });

  if (!selectedFamilyId) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Select a family in the header.
      </p>
    );
  }

  if (!docType || !typeCode) {
    return (
      <p className="text-sm text-[hsl(var(--destructive))]">Unknown type.</p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to={`/documents/${typeCode}`}
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ← Back to sheet
        </Link>
        <h1 className="mt-2 text-base font-semibold">
          {isNew ? "New" : "Edit"} {docType.name}
        </h1>
      </div>

      {existing.isLoading && !isNew && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      )}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {sortedFields.map((f) => (
          <div key={f.id}>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              {f.label}
              {f.required && <span className="text-[hsl(var(--destructive))]"> *</span>}
            </label>
            {f.fieldType === "DROPDOWN" && f.dropdownValues ? (
              <select
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                required={f.required}
                value={values[f.fieldKey] ?? ""}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [f.fieldKey]: e.target.value }))
                }
              >
                <option value="">Select…</option>
                {(() => {
                  try {
                    return (JSON.parse(f.dropdownValues!) as string[]).map(
                      (opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ),
                    );
                  } catch {
                    return null;
                  }
                })()}
              </select>
            ) : f.fieldType === "DATE" ? (
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm"
                required={f.required}
                value={values[f.fieldKey] ?? ""}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [f.fieldKey]: e.target.value }))
                }
              />
            ) : f.fieldType === "BOOLEAN" ? (
              <select
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm"
                value={values[f.fieldKey] ?? ""}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [f.fieldKey]: e.target.value }))
                }
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm"
                type={
                  f.fieldType === "NUMBER" || f.fieldType === "CURRENCY" || f.fieldType === "PERCENT"
                    ? "number"
                    : "text"
                }
                required={f.required}
                value={values[f.fieldKey] ?? ""}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [f.fieldKey]: e.target.value }))
                }
                autoComplete="off"
              />
            )}
          </div>
        ))}

        {members.data && members.data.length > 0 && (
          <div>
            <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Linked members
            </div>
            <div className="mt-2 space-y-2">
              {members.data.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={memberIds.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMemberIds((s) => [...s, m.id]);
                      } else {
                        setMemberIds((s) => s.filter((id) => id !== m.id));
                      }
                    }}
                  />
                  {m.displayName}
                </label>
              ))}
            </div>
          </div>
        )}

        {save.isError && (
          <p className="text-sm text-[hsl(var(--destructive))]">
            Save failed. Check required fields.
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
          <Link
            to={`/documents/${typeCode}`}
            className="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
