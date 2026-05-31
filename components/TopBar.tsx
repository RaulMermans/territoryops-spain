import { MapPinned, Plus, RadioTower } from "lucide-react";

interface TopBarProps {
  totalLocations: number;
  onAddClick: () => void;
}

export function TopBar({ totalLocations, onAddClick }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 bg-ink-950/95 px-4 py-4 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-teal-300/25 bg-teal-400/10 text-teal-200">
          <MapPinned size={22} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-normal text-white">
            TerritoryOps Spain
          </h1>
          <p className="text-sm text-slate-400">
            Internal geospatial console for real estate operations
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-300">
          <RadioTower size={16} className="text-teal-200" aria-hidden="true" />
          <span className="font-mono text-white">{totalLocations}</span>
          locations tracked
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-teal-500 px-4 text-sm font-semibold text-ink-950 transition hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-2 focus:ring-offset-ink-950"
        >
          <Plus size={16} aria-hidden="true" />
          Add Location
        </button>
      </div>
    </header>
  );
}
