import { api } from "@/lib/api";
import { useFamily } from "@/context/FamilyContext";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

function monthRange(year: number, month: number) {
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 0));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function CalendarPage() {
  const { selectedFamilyId } = useFamily();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());

  const { from, to } = useMemo(() => monthRange(y, m), [y, m]);

  const events = useQuery({
    queryKey: ["calendar", selectedFamilyId, from, to],
    queryFn: () => api.calendar(selectedFamilyId!, from, to),
    enabled: !!selectedFamilyId,
  });

  const byDay = useMemo(() => {
    const map = new Map<string, typeof events.data>();
    for (const e of events.data ?? []) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events.data]);

  if (!selectedFamilyId) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Select a family to view the calendar.
      </p>
    );
  }

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startPad = (new Date(y, m, 1).getDay() + 6) % 7; // Monday=0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold">Calendar</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Due dates and EMI-style fields from documents, plus custom events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-[hsl(var(--border))] px-2 py-1 text-sm"
            onClick={() => {
              if (m === 0) {
                setM(11);
                setY((x) => x - 1);
              } else setM(m - 1);
            }}
          >
            Prev
          </button>
          <span className="text-sm font-medium tabular-nums">
            {new Date(y, m).toLocaleString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            type="button"
            className="rounded-lg border border-[hsl(var(--border))] px-2 py-1 text-sm"
            onClick={() => {
              if (m === 11) {
                setM(0);
                setY((x) => x + 1);
              } else setM(m + 1);
            }}
          >
            Next
          </button>
        </div>
      </div>

      {events.isLoading && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      )}
      {events.isError && (
        <p className="text-sm text-[hsl(var(--destructive))]">
          Could not load events.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
        <div className="grid grid-cols-7 gap-px bg-[hsl(var(--border))] text-center text-xs font-medium">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-[hsl(var(--muted))] py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-[hsl(var(--border))]">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[88px] bg-[hsl(var(--card))]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const list = byDay.get(key) ?? [];
            return (
              <div
                key={key}
                className="min-h-[88px] bg-[hsl(var(--card))] p-1 text-left text-xs"
              >
                <div className="font-medium tabular-nums text-[hsl(var(--muted-foreground))]">
                  {day}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {list.slice(0, 3).map((ev, j) => (
                    <li
                      key={`${ev.title}-${j}`}
                      className="truncate rounded bg-[hsl(var(--muted))] px-1 py-0.5"
                      title={ev.title}
                    >
                      {ev.title}
                    </li>
                  ))}
                  {list.length > 3 && (
                    <li className="text-[hsl(var(--muted-foreground))]">
                      +{list.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
