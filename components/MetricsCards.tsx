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
    <section aria-label="Portfolio metrics" className="space-y-3 font-mono">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded border border-white/5 bg-[#0b1118] p-3 transition hover:border-white/10"
            >
              <div className="mb-2 flex items-center justify-between text-slate-500">
                <span className="text-[9px] uppercase tracking-wider font-bold">
                  {metric.label}
                </span>
                <Icon size={12} className="text-slate-600" aria-hidden="true" />
              </div>
              <p className="text-xl font-bold text-slate-100">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pipeline Value Instrumentation Panel */}
      <div className="rounded border border-teal-500/20 bg-teal-950/20 p-3.5 shadow-sm">
        <p className="text-[9px] font-bold uppercase tracking-widest text-teal-400">Pipeline total value</p>
        <p className="mt-1.5 text-lg font-bold text-teal-200">
          {formatCurrency(pipelineValue(locations))}
        </p>
      </div>

      {/* Needs Attention Alert Dossier */}
      {attentionItems.length > 0 ? (
        <div className="rounded border border-amber-500/20 bg-amber-950/10 p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-400" aria-hidden="true" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400">Needs attention</p>
            <span className="ml-auto text-xs font-bold text-amber-300">
              {attentionItems.length}
            </span>
          </div>
          <p className="mt-1 text-[9px] text-slate-500 font-sans leading-normal">
            Actions overdue, missing next steps, or missing contacts during negotiation.
          </p>
          <div className="mt-3.5 space-y-1.5">
            {attentionItems.slice(0, 3).map(({ location, reasons }) => (
              <button
                key={location.id}
                type="button"
                onClick={() => onSelectLocation?.(location.id)}
                className="flex w-full cursor-pointer items-start justify-between gap-3 rounded border border-white/5 bg-[#0b1118] p-2 text-left transition hover:border-amber-500/30 hover:bg-amber-950/20 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-sans text-xs font-semibold text-slate-200">
                    {location.name}
                  </span>
                  <span className="block text-[8px] tracking-wide text-slate-500 uppercase mt-0.5">
                    {reasons.map((r) => attentionReasonLabel[r]).join(" · ")}
                  </span>
                </span>
                <span
                  className={`mt-0.5 shrink-0 rounded px-1 text-[8px] font-bold tracking-wider uppercase ${statusMeta[location.status].chipClass.replace("border-", "border-0 bg-transparent text-")}`}
                >
                  {statusMeta[location.status].label}
                </span>
              </button>
            ))}
            {attentionItems.length > 3 && (
              <p className="px-2 text-[9px] uppercase tracking-wider text-slate-600 text-right">
                +{attentionItems.length - 3} additional
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

