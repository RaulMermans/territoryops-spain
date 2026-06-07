"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/locations";
import { sortLocations, type SortDir, type TableSortKey } from "@/lib/table";
import { statusMeta } from "@/lib/status";
import type { RealEstateLocation } from "@/types/location";

interface LocationTableProps {
  locations: RealEstateLocation[];
  selectedId: string | null;
  onSelect: (location: RealEstateLocation) => void;
}

function priorityClass(priority: RealEstateLocation["priority"]) {
  if (priority === "high") return "text-red-300";
  if (priority === "medium") return "text-amber-300";
  return "text-slate-500";
}

function SortIcon({
  active,
  dir
}: {
  active: boolean;
  dir: SortDir;
}) {
  if (!active) {
    return <span className="ml-1 text-slate-700">↕</span>;
  }
  return dir === "asc" ? (
    <ChevronUp size={11} className="ml-0.5 inline text-teal-400" />
  ) : (
    <ChevronDown size={11} className="ml-0.5 inline text-teal-400" />
  );
}

function SortTh({
  label,
  colKey,
  sortKey,
  sortDir,
  onSort
}: {
  label: string;
  colKey: TableSortKey;
  sortKey: TableSortKey;
  sortDir: SortDir;
  onSort: (key: TableSortKey) => void;
}) {
  return (
    <th
      onClick={() => onSort(colKey)}
      className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-300"
    >
      {label}
      <SortIcon active={sortKey === colKey} dir={sortDir} />
    </th>
  );
}

export function LocationTable({ locations, selectedId, onSelect }: LocationTableProps) {
  const [sortKey, setSortKey] = useState<TableSortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const today = new Date().toISOString().slice(0, 10);
  const sorted = useMemo(
    () => sortLocations(locations, sortKey, sortDir),
    [locations, sortKey, sortDir]
  );

  const needsAttentionCt = locations.filter((loc) => {
    if (loc.status === "archived") return false;
    return (
      (loc.nextActionDate && loc.nextActionDate < today) ||
      !loc.nextAction?.trim() ||
      (loc.status === "negotiating" && !loc.contactName?.trim())
    );
  }).length;

  const negotiatingCt = locations.filter((l) => l.status === "negotiating").length;
  const controlledCt = locations.filter((l) => l.status === "controlled").length;

  function handleSort(key: TableSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (locations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-center">
        <div>
          <p className="text-sm font-medium text-slate-300">No records match the current filters.</p>
          <p className="mt-1 text-xs text-slate-500">Clear search, status, or province filters to see locations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Summary bar */}
      <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 border-b border-white/10 bg-ink-900/40 px-4 py-2 text-xs text-slate-400">
        <span>
          <span className="font-mono font-semibold text-white">{locations.length}</span> visible
        </span>
        {needsAttentionCt > 0 && (
          <span className="text-amber-300">
            <span className="font-mono font-semibold">{needsAttentionCt}</span> needs attention
          </span>
        )}
        {negotiatingCt > 0 && (
          <span>
            <span className="font-mono font-semibold text-white">{negotiatingCt}</span> negotiating
          </span>
        )}
        {controlledCt > 0 && (
          <span>
            <span className="font-mono font-semibold text-white">{controlledCt}</span> controlled
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-ink-900">
            <tr className="border-b border-white/10">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                City
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Province
              </th>
              <SortTh label="Status" colKey="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh label="Priority" colKey="priority" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Interest
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Control
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Next action
              </th>
              <SortTh label="Due" colKey="nextActionDate" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh label="Est. value" colKey="estimatedValue" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Asking
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Target
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Contact
              </th>
              <SortTh label="Updated" colKey="updatedAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((loc) => {
              const overdue = Boolean(loc.nextActionDate && loc.nextActionDate < today);
              const noContact =
                loc.status === "negotiating" && !loc.contactName?.trim();
              const isSelected = selectedId === loc.id;

              return (
                <tr
                  key={loc.id}
                  onClick={() => onSelect(loc)}
                  className={`cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.04] ${
                    isSelected ? "bg-teal-300/[0.06]" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-white">
                    <span className="flex items-center gap-1.5">
                      <span>{loc.name}</span>
                      {loc.priority === "high" && (
                        <span className="rounded-sm bg-red-400/15 px-1 text-[10px] font-bold text-red-300">
                          HIGH
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{loc.city}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">{loc.province}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusMeta[loc.status].chipClass}`}
                    >
                      {statusMeta[loc.status].label}
                    </span>
                  </td>
                  <td className={`px-3 py-2 text-xs font-semibold ${priorityClass(loc.priority)}`}>
                    {loc.priority.toUpperCase()}
                  </td>
                  <td className="px-3 py-2 text-xs capitalize text-slate-400">
                    {loc.interestLevel ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs capitalize text-slate-400">
                    {loc.controlType ?? "—"}
                  </td>
                  <td className="max-w-[180px] px-3 py-2 text-xs text-slate-300">
                    <span className="block truncate">{loc.nextAction ?? "—"}</span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 font-mono text-xs ${
                      overdue ? "text-red-300" : "text-slate-400"
                    }`}
                  >
                    {loc.nextActionDate ?? "—"}
                    {overdue && <span className="ml-1 text-red-400">⚠</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-300">
                    {loc.estimatedValue !== undefined
                      ? formatCurrency(loc.estimatedValue)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                    {loc.askingPrice !== undefined ? formatCurrency(loc.askingPrice) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                    {loc.targetPrice !== undefined ? formatCurrency(loc.targetPrice) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {noContact ? (
                      <span className="text-amber-300">⚠ No contact</span>
                    ) : (
                      (loc.contactName ?? "—")
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                    {loc.updatedAt.slice(0, 10)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
