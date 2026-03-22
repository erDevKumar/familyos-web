import { api, type DocumentDto, type DocumentType } from "@/lib/api";
import { useFamily } from "@/context/FamilyContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

const helper = createColumnHelper<DocumentDto>();

export function DocumentSheetPage() {
  const { typeCode } = useParams<{ typeCode: string }>();
  const { selectedFamilyId } = useFamily();
  const qc = useQueryClient();

  const types = useQuery({
    queryKey: ["document-types"],
    queryFn: () => api.documentTypes(false),
  });

  const docType: DocumentType | undefined = types.data?.find(
    (t) => t.code === typeCode,
  );

  const rows = useQuery({
    queryKey: ["documents", selectedFamilyId, typeCode],
    queryFn: () => api.documents(selectedFamilyId!, typeCode),
    enabled: !!selectedFamilyId && !!typeCode,
  });

  const columns = useMemo(() => {
    if (!docType) return [];
    const sorted = [...docType.fields].sort((a, b) => a.sortOrder - b.sortOrder);
    const cols = [
      helper.accessor("id", {
        header: "ID",
        cell: (c) => (
          <span className="font-mono text-xs">{c.getValue().slice(0, 8)}…</span>
        ),
      }),
      ...sorted.map((f) =>
        helper.accessor(
          (row) => row.fields[f.fieldKey] ?? "",
          {
            id: f.fieldKey,
            header: f.label,
            cell: (c) => {
              const v = c.getValue();
              if (f.sensitive && v) {
                return (
                  <span className="font-mono text-xs">••••{String(v).slice(-4)}</span>
                );
              }
              return <span className="text-sm">{v || "—"}</span>;
            },
          },
        ),
      ),
      helper.display({
        id: "actions",
        header: "",
        cell: (c) => (
          <Link
            className="text-sm text-[hsl(var(--primary))]"
            to={`/documents/${typeCode}/${c.row.original.id}/edit`}
          >
            Edit
          </Link>
        ),
      }),
    ];
    return cols;
  }, [docType, typeCode]);

  const table = useReactTable({
    data: rows.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!selectedFamilyId) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Select a family in the header.
      </p>
    );
  }

  if (!typeCode || !docType) {
    return (
      <p className="text-sm text-[hsl(var(--destructive))]">
        Unknown document type.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold">{docType.name}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Sheet view — inline editing comes next; use Edit to update rows.
          </p>
        </div>
        <Link
          to={`/documents/${typeCode}/new`}
          className="rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
        >
          Add document
        </Link>
      </div>

      {rows.isLoading && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      )}
      {rows.isError && (
        <p className="text-sm text-[hsl(var(--destructive))]">
          Failed to load documents.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="whitespace-nowrap border-b border-[hsl(var(--border))] px-3 py-2 font-medium"
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && !rows.isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-[hsl(var(--muted-foreground))]"
                >
                  No rows yet.{" "}
                  <Link
                    className="text-[hsl(var(--primary))]"
                    to={`/documents/${typeCode}/new`}
                  >
                    Add your first document
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[hsl(var(--muted))]/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="border-b border-[hsl(var(--border))] px-3 py-2 align-top"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        <button
          type="button"
          className="text-[hsl(var(--primary))]"
          onClick={() =>
            qc.invalidateQueries({
              queryKey: ["documents", selectedFamilyId, typeCode],
            })
          }
        >
          Refresh
        </button>
      </p>
    </div>
  );
}
