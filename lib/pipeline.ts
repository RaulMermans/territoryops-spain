import type { LocationStatus, RealEstateLocation } from "@/types/location";

export const pipelineStatuses: LocationStatus[] = [
  "watchlist",
  "interested",
  "evaluating",
  "negotiating",
  "controlled",
  "passed"
];

export function groupByPipelineStatus(
  locations: RealEstateLocation[]
): Record<LocationStatus, RealEstateLocation[]> {
  const groups = Object.fromEntries(
    pipelineStatuses.map((status) => [status, [] as RealEstateLocation[]])
  ) as Record<LocationStatus, RealEstateLocation[]>;

  for (const location of locations) {
    if (location.status in groups) {
      groups[location.status].push(location);
    }
  }

  return groups;
}
