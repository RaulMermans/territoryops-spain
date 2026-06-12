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
  if (priority === "high") return "text-red-400";
  if (priority === "medium") return "text-amber-400";
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
      className={`w-full cursor-pointer rounded border p-2.5 text-left transition focus:outline-none focus:ring-1 focus:ring-teal-500/50 ${
        isSelected
          ? "border-teal-500/30 bg-teal-500/10"
          : "border-white/5 bg-[#0b1118] hover:border-white/10 hover:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-xs font-semibold leading-snug text-slate-100">
          {location.name}
        </span>
        <span className={`shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider ${priorityClass(location.priority)}`}>
          {location.priority}
        </span>
      </div>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-500">
        {location.city}, {location.province}
      </p>
      {location.interestLevel && (
        <p className="mt-1.5 text-[11px] capitalize text-slate-400">
          Interest: {location.interestLevel}
        </p>
      )}
      {location.estimatedValue !== undefined && (
        <p className="mt-1 font-mono text-[11px] font-semibold text-slate-200">
          {formatCurrency(location.estimatedValue)}
        </p>
      )}
      {location.nextAction && (
        <p className="mt-1.5 truncate text-[11px] text-slate-400">
          {location.nextAction}
        </p>
      )}
      {(overdue || noContact) && (
        <div className="mt-2 flex flex-wrap gap-1 font-mono text-[9px] font-bold uppercase tracking-wider">
          {overdue && (
            <span className="rounded border border-red-500/20 bg-red-950/20 px-1.5 py-0.5 text-red-400">
              ⚠ Overdue
            </span>
          )}
          {noContact && (
            <span className="rounded border border-amber-500/20 bg-amber-950/20 px-1.5 py-0.5 text-amber-400">
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
    <div className="flex w-60 shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-1 pb-2">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: meta.color }}
            aria-hidden="true"
          />
          {meta.label}
        </span>
        <span className="font-mono text-[10px] text-slate-500">{locations.length}</span>
      </div>
      <div className="space-y-2">
        {locations.length === 0 ? (
          <p className="rounded border border-white/5 bg-[#0b1118]/40 px-3 py-4 text-center font-mono text-[9px] uppercase tracking-wider text-slate-600">
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
          <span className="font-bold text-slate-300">{pipelineLocations.length}</span> visible
        </span>
        <span>
          <span className="font-bold text-slate-300">{activeOpportunities}</span> active
        </span>
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
        {needsAttentionCt > 0 && (
          <span className="text-amber-400 font-medium">
            ⚠ <span className="font-bold">{needsAttentionCt}</span> needs attention
          </span>
        )}
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="flex h-full gap-4 p-4">
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
