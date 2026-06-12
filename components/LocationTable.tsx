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
  if (priority === "high") return "text-red-400 font-bold";
  if (priority === "medium") return "text-amber-400 font-semibold";
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
    <ChevronUp size={10} className="ml-1 inline text-teal-400" />
  ) : (
    <ChevronDown size={10} className="ml-1 inline text-teal-400" />
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
      className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 transition hover:text-slate-300 border-b border-white/5"
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
      <div className="flex flex-1 items-center justify-center p-12 text-center bg-[#070b10]">
        <div className="font-mono max-w-sm rounded border border-white/5 bg-[#0b1118]/30 p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No records found</p>
          <p className="mt-2 text-[10px] text-slate-600 font-sans leading-relaxed">
            No locations match the current filters. Adjust your search or filters to display records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#070b10]">
      {/* Summary bar */}
      <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-1.5 border-b border-white/5 bg-[#0b1118]/50 px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
        <span>
          <span className="font-bold text-slate-300">{locations.length}</span> visible
        </span>
        {needsAttentionCt > 0 && (
          <span className="text-amber-400 font-medium">
            ⚠ <span className="font-bold">{needsAttentionCt}</span> needs attention
          </span>
        )}
        {negotiatingCt > 0 && (
          <span>
            <span className="font-bold text-slate-300">{negotiatingCt}</span> negotiating
          </span>
        )}
        {controlledCt > 0 && (
          <span className="text-teal-400 font-medium">
            <span className="font-bold">{controlledCt}</span> controlled
          </span>
        )}
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left text-xs font-sans">
          <thead className="sticky top-0 z-10 bg-[#0b1118] border-b border-white/5 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                Name
              </th>
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                City
              </th>
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                Province
              </th>
              <SortTh label="Status" colKey="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh label="Priority" colKey="priority" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                Interest
              </th>
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                Control
              </th>
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                Next action
              </th>
              <SortTh label="Due" colKey="nextActionDate" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh label="Est. value" colKey="estimatedValue" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                Asking
              </th>
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                Target
              </th>
              <th className="px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
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
                  className={`cursor-pointer border-b border-white/[0.02] transition-colors hover:bg-white/[0.02] ${
                    isSelected ? "bg-teal-500/[0.04] text-teal-300" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span>{loc.name}</span>
                      {loc.priority === "high" && (
                        <span className="rounded bg-red-950/20 border border-red-500/20 px-1 text-[8px] font-bold tracking-wider text-red-400 font-mono">
                          HIGH
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{loc.city}</td>
                  <td className="px-4 py-3 text-slate-400">{loc.province}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider font-mono ${statusMeta[loc.status].chipClass.replace("border-", "border-0 bg-transparent text-")}`}
                    >
                      {statusMeta[loc.status].label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-mono text-[9px] uppercase tracking-wider ${priorityClass(loc.priority)}`}>
                    {loc.priority}
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{loc.interestLevel ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{loc.controlType ?? "—"}</td>
                  <td className="max-w-[200px] px-4 py-3 text-slate-300 truncate" title={loc.nextAction}>
                    {loc.nextAction ?? "—"}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 font-mono text-[10px] ${
                      overdue ? "text-red-400 font-semibold" : "text-slate-400"
                    }`}
                  >
                    {loc.nextActionDate ?? "—"}
                    {overdue && <span className="ml-1 text-red-400" title="Action Overdue">⚠</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-semibold text-slate-200">
                    {loc.estimatedValue !== undefined
                      ? formatCurrency(loc.estimatedValue)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-slate-400">
                    {loc.askingPrice !== undefined ? formatCurrency(loc.askingPrice) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-slate-400">
                    {loc.targetPrice !== undefined ? formatCurrency(loc.targetPrice) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {noContact ? (
                      <span className="text-amber-400 font-medium font-mono text-[10px]">⚠ NO CONTACT</span>
                    ) : (
                      (loc.contactName ?? "—")
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-slate-500">
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

