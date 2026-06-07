"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/locations";
import { groupByPipelineStatus, pipelineStatuses } from "@/lib/pipeline";
import { statusMeta } from "@/lib/status";
import type { LocationStatus, RealEstateLocation } from "@/types/location";

interface LocationPipelineProps {
  locations: RealEstateLocation[];
  selectedId: string | null;
  onSelect: (location: RealEstateLocation) => void;
}

function priorityClass(priority: RealEstateLocation["priority"]) {
  if (priority === "high") return "text-red-300";
  if (priority === "medium") return "text-amber-300";
  return "text-slate-500";
}

function PipelineCard({
  location,
  isSelected,
  today,
  onSelect
}: {
  location: RealEstateLocation;
  isSelected: boolean;
  today: string;
  onSelect: (loc: RealEstateLocation) => void;
}) {
  const overdue = Boolean(location.nextActionDate && location.nextActionDate < today);
  const noContact =
    location.status === "negotiating" && !location.contactName?.trim();

  return (
    <button
      type="button"
      onClick={() => onSelect(location)}
      className={`w-full rounded-md border p-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-200 ${
        isSelected
          ? "border-teal-300/40 bg-teal-300/10"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-xs font-semibold leading-snug text-white">
          {location.name}
        </span>
        <span className={`shrink-0 text-[10px] font-bold ${priorityClass(location.priority)}`}>
          {location.priority.toUpperCase()}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">
        {location.city}, {location.province}
      </p>
      {location.interestLevel && (
        <p className="mt-1 text-[11px] capitalize text-slate-500">
          Interest: {location.interestLevel}
        </p>
      )}
      {location.estimatedValue !== undefined && (
        <p className="mt-1 font-mono text-[11px] text-slate-300">
          {formatCurrency(location.estimatedValue)}
        </p>
      )}
      {location.nextAction && (
        <p className="mt-1.5 truncate text-[11px] text-slate-400">
          {location.nextAction}
        </p>
      )}
      {(overdue || noContact) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {overdue && (
            <span className="rounded-sm bg-red-400/15 px-1 py-0.5 text-[10px] font-semibold text-red-300">
              ⚠ Overdue
            </span>
          )}
          {noContact && (
            <span className="rounded-sm bg-amber-400/15 px-1 py-0.5 text-[10px] font-semibold text-amber-300">
              ⚠ No contact
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function PipelineColumn({
  status,
  locations,
  selectedId,
  today,
  onSelect
}: {
  status: LocationStatus;
  locations: RealEstateLocation[];
  selectedId: string | null;
  today: string;
  onSelect: (loc: RealEstateLocation) => void;
}) {
  const meta = statusMeta[status];

  return (
    <div className="flex w-56 shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chipClass}`}
        >
          {meta.label}
        </span>
        <span className="font-mono text-xs text-slate-500">{locations.length}</span>
      </div>
      <div className="space-y-2">
        {locations.length === 0 ? (
          <p className="rounded-md border border-white/5 bg-white/[0.015] px-3 py-4 text-center text-xs text-slate-600">
            No records
          </p>
        ) : (
          locations.map((loc) => (
            <PipelineCard
              key={loc.id}
              location={loc}
              isSelected={selectedId === loc.id}
              today={today}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function LocationPipeline({
  locations,
  selectedId,
  onSelect
}: LocationPipelineProps) {
  const today = new Date().toISOString().slice(0, 10);
  const pipelineLocations = useMemo(
    () => locations.filter((l) => l.status !== "archived"),
    [locations]
  );
  const grouped = useMemo(
    () => groupByPipelineStatus(pipelineLocations),
    [pipelineLocations]
  );

  const activeOpportunities = pipelineLocations.filter((l) =>
    ["interested", "evaluating", "negotiating"].includes(l.status)
  ).length;
  const negotiatingCt = pipelineLocations.filter((l) => l.status === "negotiating").length;
  const controlledCt = pipelineLocations.filter((l) => l.status === "controlled").length;
  const needsAttentionCt = pipelineLocations.filter((loc) => {
    return (
      (loc.nextActionDate && loc.nextActionDate < today) ||
      !loc.nextAction?.trim() ||
      (loc.status === "negotiating" && !loc.contactName?.trim())
    );
  }).length;

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
          <span className="font-mono font-semibold text-white">{pipelineLocations.length}</span> visible
        </span>
        <span>
          <span className="font-mono font-semibold text-white">{activeOpportunities}</span> active
        </span>
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
        {needsAttentionCt > 0 && (
          <span className="text-amber-300">
            <span className="font-mono font-semibold">{needsAttentionCt}</span> needs attention
          </span>
        )}
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full gap-3 p-4">
          {pipelineStatuses.map((status) => (
            <PipelineColumn
              key={status}
              status={status}
              locations={grouped[status] ?? []}
              selectedId={selectedId}
              today={today}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
