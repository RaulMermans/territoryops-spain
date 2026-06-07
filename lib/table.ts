import type { RealEstateLocation } from "@/types/location";

export type TableSortKey =
  | "status"
  | "priority"
  | "nextActionDate"
  | "estimatedValue"
  | "updatedAt";

export type SortDir = "asc" | "desc";

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
const statusOrder: Record<string, number> = {
  negotiating: 0,
  evaluating: 1,
  interested: 2,
  watchlist: 3,
  controlled: 4,
  passed: 5,
  archived: 6
};

export function sortLocations(
  locations: RealEstateLocation[],
  key: TableSortKey,
  dir: SortDir
): RealEstateLocation[] {
  return [...locations].sort((a, b) => {
    let cmp = 0;

    if (key === "status") {
      cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    } else if (key === "priority") {
      cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    } else if (key === "nextActionDate") {
      const aDate = a.nextActionDate ?? null;
      const bDate = b.nextActionDate ?? null;
      if (!aDate && !bDate) cmp = 0;
      else if (!aDate) cmp = 1;
      else if (!bDate) cmp = -1;
      else cmp = aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
    } else if (key === "estimatedValue") {
      const aVal = a.estimatedValue;
      const bVal = b.estimatedValue;
      if (aVal === bVal) cmp = 0;
      else if (aVal === undefined) cmp = 1;
      else if (bVal === undefined) cmp = -1;
      else cmp = aVal - bVal;
    } else if (key === "updatedAt") {
      cmp = a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0;
    }

    return dir === "asc" ? cmp : -cmp;
  });
}
