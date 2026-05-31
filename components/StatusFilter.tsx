import { statuses, statusMeta } from "@/lib/status";
import { isArchived } from "@/lib/locations";
import type { LocationStatus, RealEstateLocation } from "@/types/location";

export type StatusFilterValue = "all" | LocationStatus;

interface StatusFilterProps {
  locations: RealEstateLocation[];
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

export function StatusFilter({ locations, value, onChange }: StatusFilterProps) {
  const countFor = (status: StatusFilterValue) =>
    status === "all"
      ? locations.filter((location) => !isArchived(location)).length
      : locations.filter((location) => location.status === status).length;

  return (
    <section aria-label="Status filters" className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-white">Status filters</h2>
        <p className="text-xs text-slate-500">Segment the active map layer.</p>
      </div>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`flex min-h-11 w-full cursor-pointer items-center justify-between rounded-md border px-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-teal-200 ${
            value === "all"
              ? "border-teal-300/40 bg-teal-300/10 text-white"
              : "border-white/10 bg-white/[0.025] text-slate-300 hover:bg-white/[0.06]"
          }`}
        >
          <span>All statuses</span>
          <span className="font-mono text-xs text-slate-400">
            {countFor("all")}
          </span>
        </button>

        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`flex min-h-11 w-full cursor-pointer items-center justify-between rounded-md border px-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-teal-200 ${
              value === status
                ? "border-teal-300/40 bg-teal-300/10 text-white"
                : "border-white/10 bg-white/[0.025] text-slate-300 hover:bg-white/[0.06]"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: statusMeta[status].color }}
                aria-hidden="true"
              />
              {statusMeta[status].label}
            </span>
            <span className="font-mono text-xs text-slate-400">
              {countFor(status)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
