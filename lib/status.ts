import type { AssetType, LocationStatus } from "@/types/location";

export const statuses: LocationStatus[] = [
  "potential",
  "in_review",
  "negotiating",
  "owned",
  "rejected",
  "archived"
];

export const assetTypes: AssetType[] = [
  "retail",
  "residential",
  "hotel",
  "office",
  "land",
  "mixed_use",
  "other"
];

export const statusMeta: Record<
  LocationStatus,
  { label: string; color: string; chipClass: string }
> = {
  potential: {
    label: "Potential location",
    color: "#22c55e",
    chipClass: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
  },
  in_review: {
    label: "In review",
    color: "#14b8a6",
    chipClass: "border-teal-400/30 bg-teal-400/10 text-teal-200"
  },
  negotiating: {
    label: "Negotiating",
    color: "#f59e0b",
    chipClass: "border-amber-400/30 bg-amber-400/10 text-amber-200"
  },
  owned: {
    label: "Owned",
    color: "#10b981",
    chipClass: "border-green-400/30 bg-green-400/10 text-green-200"
  },
  rejected: {
    label: "Rejected",
    color: "#ef4444",
    chipClass: "border-red-400/30 bg-red-400/10 text-red-200"
  },
  archived: {
    label: "Archived",
    color: "#94a3b8",
    chipClass: "border-slate-400/25 bg-slate-400/10 text-slate-300"
  }
};

export function formatStatus(status: LocationStatus) {
  return statusMeta[status].label;
}

export function formatAssetType(assetType: AssetType) {
  return assetType
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
