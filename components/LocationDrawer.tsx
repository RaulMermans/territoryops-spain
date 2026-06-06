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
      <aside className="flex min-h-64 flex-col justify-center border-t border-white/10 bg-ink-900 p-5 lg:border-l lg:border-t-0">
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <MapPin size={22} className="mb-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-base font-semibold text-white">No location selected</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Select a marker or a list item to inspect asset details, notes, and
            the stored Google Maps link.
          </p>
        </div>
      </aside>
    );
  }

  const hasContact =
    location.contactName ||
    location.contactRole ||
    location.contactPhone ||
    location.contactEmail;

  const hasDealInfo =
    location.askingPrice !== undefined ||
    location.targetPrice !== undefined ||
    location.monthlyRent !== undefined ||
    location.expectedCapex !== undefined ||
    location.probability !== undefined;

  return (
    <aside className="border-t border-white/10 bg-ink-900 p-5 lg:border-l lg:border-t-0 lg:overflow-y-auto lg:max-h-[calc(100dvh-81px)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusMeta[location.status].chipClass}`}
          >
            {statusMeta[location.status].label}
          </span>
          <span
            className={`ml-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${priorityClass(location.priority)}`}
          >
            {location.priority.toUpperCase()}
          </span>
          <h2 className="mt-3 text-xl font-semibold leading-tight text-white">
            {location.name}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {[location.address, location.city, location.province]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-white/10 text-slate-300 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
          aria-label="Close location drawer"
        >
          <PanelRightClose size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <DetailRow label="Asset type" value={formatAssetType(location.assetType)} />
        <DetailRow label="Estimated value" value={formatCurrency(location.estimatedValue)} />
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

      {hasDealInfo ? (
        <section className="mt-5 rounded-md border border-white/10 bg-white/[0.035] p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Deal info</h3>
          <div className="space-y-2">
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

      {location.nextAction || location.nextActionDate ? (
        <section className="mt-5 rounded-md border border-amber-300/20 bg-amber-300/[0.05] p-4">
          <h3 className="mb-2 text-sm font-semibold text-white">Next action</h3>
          {location.nextAction ? (
            <p className="text-sm text-amber-100">{location.nextAction}</p>
          ) : null}
          {location.nextActionDate ? (
            <p className="mt-1 text-xs text-slate-400">
              Due {location.nextActionDate}
            </p>
          ) : null}
        </section>
      ) : null}

      {hasContact ? (
        <section className="mt-5 rounded-md border border-white/10 bg-white/[0.035] p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Contact</h3>
          <div className="space-y-2">
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

      <section className="mt-5 rounded-md border border-white/10 bg-white/[0.035] p-4">
        <h3 className="text-sm font-semibold text-white">Notes</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {location.notes || "No notes recorded."}
        </p>
        {location.decisionReason ? (
          <>
            <h3 className="mt-4 text-sm font-semibold text-white">Decision reason</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {location.decisionReason}
            </p>
          </>
        ) : null}
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(location)}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
        >
          <Pencil size={16} aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onArchive(location)}
          disabled={location.status === "archived"}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-amber-300/20 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/10 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-600 disabled:hover:bg-transparent"
        >
          <Archive size={16} aria-hidden="true" />
          Archive
        </button>
      </div>

      {location.googleMapsUrl ? (
        <a
          href={location.googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-ink-950 transition hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-2 focus:ring-offset-ink-900"
        >
          <ExternalLink size={16} aria-hidden="true" />
          Open in Google Maps
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-2 h-11 w-full rounded-md border border-white/10 text-sm text-slate-600"
        >
          No Google Maps URL stored
        </button>
      )}
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-2">
      <span className="text-xs uppercase text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-200">{value}</span>
    </div>
  );
}

function priorityClass(priority: RealEstateLocation["priority"]) {
  if (priority === "high") {
    return "border-red-300/25 bg-red-300/10 text-red-100";
  }
  if (priority === "medium") {
    return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  }

  return "border-slate-300/20 bg-slate-300/10 text-slate-300";
}
