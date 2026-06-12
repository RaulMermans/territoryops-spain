import {
  Archive,
  ExternalLink,
  MapPin,
  PanelRightClose,
  Pencil
} from "lucide-react";
import { formatArea, formatCurrency } from "@/lib/locations";
import { formatAssetType, statusMeta } from "@/lib/status";
import type { RealEstateLocation } from "@/types/location";

interface LocationDrawerProps {
  location: RealEstateLocation | null;
  onClose: () => void;
  onEdit: (location: RealEstateLocation) => void;
  onArchive: (location: RealEstateLocation) => void;
}

export function LocationDrawer({
  location,
  onClose,
  onEdit,
  onArchive
}: LocationDrawerProps) {
  if (!location) {
    return (
      <aside className="flex min-h-64 flex-col justify-center border-t border-white/5 bg-[#0b1118] p-6 lg:border-l lg:border-t-0 lg:w-[360px] lg:h-full">
        <div className="rounded border border-white/5 bg-[#070b10] p-6 text-center font-mono">
          <MapPin size={18} className="mx-auto mb-4 text-slate-600" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">No selection</h2>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500 font-sans">
            Select a location from the map, table, or pipeline view to examine its full operational profile.
          </p>
        </div>
      </aside>
    );
  }

  const hasContact = Boolean(
    location.contactName ||
    location.contactRole ||
    location.contactPhone ||
    location.contactEmail
  );

  const hasDealInfo = Boolean(
    location.askingPrice !== undefined ||
    location.targetPrice !== undefined ||
    location.monthlyRent !== undefined ||
    location.expectedCapex !== undefined ||
    location.probability !== undefined
  );

  return (
    <aside className="border-t border-white/5 bg-[#0b1118] p-6 lg:border-l lg:border-t-0 lg:h-full lg:overflow-y-auto lg:w-[360px] lg:max-h-full flex flex-col justify-between">
      <div>
        {/* Status / Priority Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            <span
              className={`rounded border px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase font-mono ${statusMeta[location.status].chipClass}`}
            >
              {statusMeta[location.status].label}
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase font-mono ${priorityClass(location.priority)}`}
            >
              {location.priority}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-white/5 text-slate-400 transition hover:bg-white/[0.03] hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            aria-label="Close location drawer"
          >
            <PanelRightClose size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Identity */}
        <div className="mt-4">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white leading-snug">
            {location.name}
          </h2>
          <p className="mt-1 font-sans text-xs text-slate-500">
            {[location.address, location.city, location.province]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>

        {/* Section 1: General Dossier */}
        <section className="mt-6">
          <h3 className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Asset Profile
          </h3>
          <div className="space-y-1.5 border-t border-white/5 pt-2">
            <DetailRow label="Asset type" value={formatAssetType(location.assetType)} />
            <DetailRow label="Surface area" value={formatArea(location.surfaceAreaM2)} />
            <DetailRow
              label="Coordinates"
              value={`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
            />
            {location.controlType ? (
              <DetailRow
                label="Control type"
                value={location.controlType.charAt(0).toUpperCase() + location.controlType.slice(1)}
              />
            ) : null}
            {location.owner ? <DetailRow label="Owner" value={location.owner} /> : null}
            {location.source ? <DetailRow label="Source" value={location.source} /> : null}
          </div>
        </section>

        {/* Section 2: Deal Valuation */}
        {hasDealInfo || location.estimatedValue !== undefined ? (
          <section className="mt-6">
            <h3 className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Deal Valuation
            </h3>
            <div className="space-y-1.5 border-t border-white/5 pt-2">
              {location.estimatedValue !== undefined ? (
                <DetailRow label="Est. value" value={formatCurrency(location.estimatedValue)} isHighlight />
              ) : null}
              {location.askingPrice !== undefined ? (
                <DetailRow label="Asking price" value={formatCurrency(location.askingPrice)} />
              ) : null}
              {location.targetPrice !== undefined ? (
                <DetailRow label="Target price" value={formatCurrency(location.targetPrice)} />
              ) : null}
              {location.monthlyRent !== undefined ? (
                <DetailRow label="Monthly rent" value={formatCurrency(location.monthlyRent)} />
              ) : null}
              {location.expectedCapex !== undefined ? (
                <DetailRow label="Expected capex" value={formatCurrency(location.expectedCapex)} />
              ) : null}
              {location.probability !== undefined ? (
                <DetailRow label="Probability" value={`${location.probability}%`} />
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Section 3: Next Actions */}
        {location.nextAction || location.nextActionDate ? (
          <section className="mt-6 rounded border border-amber-500/25 bg-amber-950/10 p-3">
            <h3 className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-400">
              Next Action Item
            </h3>
            <div className="mt-2 font-sans text-xs text-amber-100/90 leading-relaxed">
              {location.nextAction || "No description recorded."}
            </div>
            {location.nextActionDate ? (
              <p className="mt-1.5 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                Deadline: {location.nextActionDate}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Section 4: Contact follow-up */}
        {hasContact ? (
          <section className="mt-6">
            <h3 className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Key Contact
            </h3>
            <div className="space-y-1.5 border-t border-white/5 pt-2">
              {location.contactName ? (
                <DetailRow label="Name" value={location.contactName} />
              ) : null}
              {location.contactRole ? (
                <DetailRow label="Role" value={location.contactRole} />
              ) : null}
              {location.contactPhone ? (
                <DetailRow label="Phone" value={location.contactPhone} />
              ) : null}
              {location.contactEmail ? (
                <DetailRow label="Email" value={location.contactEmail} />
              ) : null}
              {location.lastContactedAt ? (
                <DetailRow label="Last contact" value={location.lastContactedAt} />
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Section 5: Notes & Narrative */}
        <section className="mt-6">
          <h3 className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Notes & Narrative
          </h3>
          <div className="border-t border-white/5 pt-2 font-sans text-xs text-slate-400 leading-relaxed space-y-3">
            <p>{location.notes || "No notes recorded."}</p>
            {location.decisionReason ? (
              <div className="border-t border-white/5 pt-2">
                <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Decision Rationale
                </p>
                <p>{location.decisionReason}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {/* Action panel footer */}
      <div className="mt-8 pt-4 border-t border-white/5 space-y-2">
        <div className="grid grid-cols-2 gap-2 font-mono text-[9px] uppercase tracking-wider font-bold">
          <button
            type="button"
            onClick={() => onEdit(location)}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded border border-white/5 bg-[#0b1118] text-slate-200 transition hover:bg-white/[0.03] hover:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/50"
          >
            <Pencil size={12} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onArchive(location)}
            disabled={location.status === "archived"}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded border border-amber-500/20 text-amber-200 transition hover:bg-amber-500/10 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-700 disabled:hover:bg-transparent"
          >
            <Archive size={12} aria-hidden="true" />
            Archive
          </button>
        </div>

        {location.googleMapsUrl ? (
          <a
            href={location.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded bg-slate-200 font-mono text-[9px] font-bold uppercase tracking-wider text-[#070b10] transition hover:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:ring-offset-1 focus:ring-offset-ink-900"
          >
            <ExternalLink size={12} aria-hidden="true" />
            Google Maps Link
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="h-9 w-full rounded border border-white/5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-700 cursor-not-allowed"
          >
            No Maps URL Stored
          </button>
        )}
      </div>
    </aside>
  );
}

function DetailRow({ 
  label, 
  value, 
  isHighlight = false 
}: { 
  label: string; 
  value: string; 
  isHighlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-1 text-xs">
      <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`text-right text-[11px] font-medium ${isHighlight ? "text-teal-300 font-mono font-semibold" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}

function priorityClass(priority: RealEstateLocation["priority"]) {
  if (priority === "high") {
    return "border-red-500/20 bg-red-950/15 text-red-400";
  }
  if (priority === "medium") {
    return "border-amber-500/20 bg-amber-950/15 text-amber-400";
  }

  return "border-slate-500/25 bg-slate-500/10 text-slate-400";
}

