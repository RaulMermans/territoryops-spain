import { MapPinned, Plus, RadioTower } from "lucide-react";

interface TopBarProps {
  totalLocations: number;
  onAddClick: () => void;
}

export function TopBar({ totalLocations, onAddClick }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/5 bg-[#0b1118] px-6 py-4 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded border border-teal-500/20 bg-teal-500/10 text-teal-400">
          <MapPinned size={20} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              TerritoryOps Spain
            </h1>
            <span className="rounded bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.2 text-[8px] font-bold tracking-wider text-teal-300 uppercase">
              Console
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-slate-500">
            Local-first real estate control console
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-9 items-center gap-2 rounded border border-white/5 bg-white/[0.02] px-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <RadioTower size={14} className="text-teal-400" aria-hidden="true" />
          <span className="font-bold text-slate-200">{totalLocations}</span>
          <span className="text-slate-500">locations</span>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded bg-teal-500 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-950 transition hover:bg-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:ring-offset-1 focus:ring-offset-ink-950"
        >
          <Plus size={14} aria-hidden="true" />
          Add Location
        </button>
      </div>
    </header>
  );
}

