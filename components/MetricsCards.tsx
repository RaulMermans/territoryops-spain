import { AlertTriangle, CircleDollarSign, Handshake, Telescope, TrendingUp } from "lucide-react";
import { countByStatus, formatCurrency, needsAttentionCount, pipelineValue } from "@/lib/locations";
import type { RealEstateLocation } from "@/types/location";

interface MetricsCardsProps {
  locations: RealEstateLocation[];
}

export function MetricsCards({ locations }: MetricsCardsProps) {
  const attention = needsAttentionCount(locations);

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
      {attention > 0 ? (
        <div className="rounded-md border border-amber-300/25 bg-amber-300/[0.07] p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-300" aria-hidden="true" />
            <p className="text-xs uppercase text-amber-300/80">Needs attention</p>
          </div>
          <p className="mt-2 font-mono text-xl font-semibold text-amber-100">
            {attention}
          </p>
          <p className="mt-1 text-xs text-amber-100/60">
            overdue actions, missing next steps, or negotiating without contact
          </p>
        </div>
      ) : null}
    </section>
  );
}
