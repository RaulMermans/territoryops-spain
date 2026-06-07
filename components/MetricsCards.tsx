import { AlertTriangle, CircleDollarSign, Handshake, Telescope, TrendingUp } from "lucide-react";
import { countByStatus, formatCurrency, pipelineValue } from "@/lib/locations";
import { getAttentionItems, attentionReasonLabel } from "@/lib/attention";
import { statusMeta } from "@/lib/status";
import type { RealEstateLocation } from "@/types/location";

interface MetricsCardsProps {
  locations: RealEstateLocation[];
  onSelectLocation?: (id: string) => void;
}

export function MetricsCards({ locations, onSelectLocation }: MetricsCardsProps) {
  const attentionItems = getAttentionItems(locations);

  const metrics = [
    {
      label: "Interested",
      value: countByStatus(locations, "interested").toString(),
      icon: Telescope
    },
    {
      label: "Evaluating",
      value: countByStatus(locations, "evaluating").toString(),
      icon: TrendingUp
    },
    {
      label: "Negotiating",
      value: countByStatus(locations, "negotiating").toString(),
      icon: Handshake
    },
    {
      label: "Controlled",
      value: countByStatus(locations, "controlled").toString(),
      icon: CircleDollarSign
    }
  ];

  return (
    <section aria-label="Portfolio metrics" className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-md border border-white/10 bg-white/[0.04] p-3"
            >
              <div className="mb-3 flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase text-slate-500">
                  {metric.label}
                </span>
                <Icon size={15} aria-hidden="true" />
              </div>
              <p className="font-mono text-2xl font-semibold text-white">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>
      <div className="rounded-md border border-teal-300/20 bg-teal-300/[0.07] p-3">
        <p className="text-xs uppercase text-teal-100/70">Pipeline value</p>
        <p className="mt-2 font-mono text-xl font-semibold text-teal-100">
          {formatCurrency(pipelineValue(locations))}
        </p>
      </div>
      {attentionItems.length > 0 ? (
        <div className="rounded-md border border-amber-300/25 bg-amber-300/[0.07] p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-300" aria-hidden="true" />
            <p className="text-xs uppercase text-amber-300/80">Needs attention</p>
            <span className="ml-auto font-mono text-lg font-semibold text-amber-100">
              {attentionItems.length}
            </span>
          </div>
          <p className="mb-2 mt-1 text-xs text-amber-100/60">
            overdue actions, missing next steps, or negotiating without contact
          </p>
          <div className="space-y-1">
            {attentionItems.slice(0, 3).map(({ location, reasons }) => (
              <button
                key={location.id}
                type="button"
                onClick={() => onSelectLocation?.(location.id)}
                className="flex w-full cursor-pointer items-start justify-between gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-amber-300/10 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-white">
                    {location.name}
                  </span>
                  <span className="text-[11px] text-amber-100/60">
                    {reasons.map((r) => attentionReasonLabel[r]).join(" · ")}
                  </span>
                </span>
                <span
                  className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${statusMeta[location.status].chipClass}`}
                >
                  {statusMeta[location.status].label}
                </span>
              </button>
            ))}
            {attentionItems.length > 3 && (
              <p className="px-2 text-[11px] text-amber-100/50">
                +{attentionItems.length - 3} more
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
