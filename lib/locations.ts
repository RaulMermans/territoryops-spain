import type { LocationStatus, RealEstateLocation } from "@/types/location";
import { assetTypes, statuses } from "@/lib/status";

export const csvColumns = [
  "id",
  "name",
  "address",
  "city",
  "province",
  "autonomousCommunity",
  "country",
  "latitude",
  "longitude",
  "googleMapsUrl",
  "status",
  "assetType",
  "priority",
  "estimatedValue",
  "surfaceAreaM2",
  "source",
  "owner",
  "notes",
  "createdAt",
  "updatedAt"
] as const;

const duplicateCoordinateThreshold = 0.0002;

export function createLocationId() {
  return `loc_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function formatCurrency(value?: number) {
  if (!value) {
    return "Not estimated";
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatArea(value?: number) {
  if (!value) {
    return "Not recorded";
  }

  return `${new Intl.NumberFormat("es-ES").format(value)} m2`;
}

export function countByStatus(
  locations: RealEstateLocation[],
  status: LocationStatus
) {
  return locations.filter((location) => location.status === status).length;
}

export function pipelineValue(locations: RealEstateLocation[]) {
  return locations
    .filter((location) =>
      ["potential", "in_review", "negotiating"].includes(
        location.status
      )
    )
    .reduce((total, location) => total + (location.estimatedValue ?? 0), 0);
}

export function isArchived(location: RealEstateLocation) {
  return location.status === "archived";
}

export function hasValidCoordinates(location: RealEstateLocation) {
  return (
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

export function matchesLocationSearch(
  location: RealEstateLocation,
  searchTerm: string
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    location.name,
    location.city,
    location.province,
    location.address,
    location.notes
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedSearch));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStatus(value: unknown): LocationStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  if (statuses.includes(value as LocationStatus)) {
    return value as LocationStatus;
  }

  const legacyStatusMap: Record<string, LocationStatus> = {
    scouted: "potential",
    contacted: "in_review",
    under_review: "in_review",
    closed_lost: "rejected"
  };

  return legacyStatusMap[value] ?? null;
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isOptionalNumber(value: unknown) {
  return value === undefined || (typeof value === "number" && Number.isFinite(value));
}

export function isRealEstateLocation(
  value: unknown
): value is RealEstateLocation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim() !== "" &&
    typeof value.name === "string" &&
    value.name.trim() !== "" &&
    typeof value.city === "string" &&
    value.city.trim() !== "" &&
    typeof value.province === "string" &&
    value.province.trim() !== "" &&
    value.country === "Spain" &&
    typeof value.latitude === "number" &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === "number" &&
    value.longitude >= -180 &&
    value.longitude <= 180 &&
    normalizeStatus(value.status) !== null &&
    typeof value.assetType === "string" &&
    assetTypes.includes(value.assetType as RealEstateLocation["assetType"]) &&
    ["low", "medium", "high"].includes(String(value.priority)) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isOptionalString(value.address) &&
    isOptionalString(value.autonomousCommunity) &&
    isOptionalString(value.googleMapsUrl) &&
    isOptionalString(value.source) &&
    isOptionalString(value.owner) &&
    isOptionalString(value.notes) &&
    isOptionalNumber(value.estimatedValue) &&
    isOptionalNumber(value.surfaceAreaM2)
  );
}

export function parseLocationsImport(value: unknown) {
  const records = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.locations)
      ? value.locations
      : null;

  if (!records || records.length === 0) {
    return null;
  }

  const validLocations = records
    .map(normalizeLocationRecord)
    .filter((location): location is RealEstateLocation => Boolean(location));

  return validLocations.length === records.length ? validLocations : null;
}

function normalizeLocationRecord(value: unknown): RealEstateLocation | null {
  if (!isRecord(value)) {
    return null;
  }

  const status = normalizeStatus(value.status);
  const candidate = {
    ...value,
    status
  };

  return status && isRealEstateLocation(candidate) ? candidate : null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function coordinatesAreClose(
  location: RealEstateLocation,
  candidate: RealEstateLocation
) {
  return (
    hasValidCoordinates(location) &&
    hasValidCoordinates(candidate) &&
    Math.abs(location.latitude - candidate.latitude) <=
      duplicateCoordinateThreshold &&
    Math.abs(location.longitude - candidate.longitude) <=
      duplicateCoordinateThreshold
  );
}

export function findPotentialDuplicates(locations: RealEstateLocation[]) {
  const duplicateIds = new Set<string>();
  const pairs: Array<{
    first: RealEstateLocation;
    second: RealEstateLocation;
    reason: string;
  }> = [];

  for (let index = 0; index < locations.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < locations.length; nextIndex += 1) {
      const first = locations[index];
      const second = locations[nextIndex];
      const sameNameAndCity =
        normalizeText(first.name) === normalizeText(second.name) &&
        normalizeText(first.city) === normalizeText(second.city);
      const sameUrl =
        Boolean(first.googleMapsUrl?.trim()) &&
        normalizeText(first.googleMapsUrl ?? "") ===
          normalizeText(second.googleMapsUrl ?? "");
      const closeCoordinates = coordinatesAreClose(first, second);

      if (sameNameAndCity || sameUrl || closeCoordinates) {
        duplicateIds.add(first.id);
        duplicateIds.add(second.id);
        pairs.push({
          first,
          second,
          reason: sameUrl
            ? "same Google Maps URL"
            : sameNameAndCity
              ? "same name and city"
              : "near-identical coordinates"
        });
      }
    }
  }

  return { duplicateIds, pairs };
}

export function getDuplicateWarningsForLocation(
  location: RealEstateLocation,
  locations: RealEstateLocation[]
) {
  return locations
    .filter((candidate) => candidate.id !== location.id)
    .filter((candidate) => {
      const sameNameAndCity =
        normalizeText(location.name) === normalizeText(candidate.name) &&
        normalizeText(location.city) === normalizeText(candidate.city);
      const sameUrl =
        Boolean(location.googleMapsUrl?.trim()) &&
        normalizeText(location.googleMapsUrl ?? "") ===
          normalizeText(candidate.googleMapsUrl ?? "");

      return sameNameAndCity || sameUrl || coordinatesAreClose(location, candidate);
    });
}

export function getDataHealth(locations: RealEstateLocation[]) {
  const duplicates = findPotentialDuplicates(locations);

  return {
    totalRecords: locations.length,
    activeRecords: locations.filter((location) => !isArchived(location)).length,
    archivedRecords: locations.filter(isArchived).length,
    missingGoogleMapsUrl: locations.filter(
      (location) => !location.googleMapsUrl?.trim()
    ).length,
    missingEstimatedValue: locations.filter(
      (location) => location.estimatedValue === undefined
    ).length,
    missingNotes: locations.filter((location) => !location.notes?.trim()).length,
    invalidCoordinates: locations.filter((location) => !hasValidCoordinates(location))
      .length,
    potentialDuplicates: duplicates.duplicateIds.size,
    duplicatePairs: duplicates.pairs
  };
}

export function getProvinceSummaries(locations: RealEstateLocation[]) {
  const summaries = new Map<
    string,
    {
      province: string;
      totalLocations: number;
      activeLocations: number;
      archivedLocations: number;
      potentialCount: number;
      negotiatingCount: number;
      ownedCount: number;
      estimatedPipelineValue: number;
    }
  >();

  locations.forEach((location) => {
    const province = location.province.trim() || "Unknown";
    const summary =
      summaries.get(province) ??
      {
        province,
        totalLocations: 0,
        activeLocations: 0,
        archivedLocations: 0,
        potentialCount: 0,
        negotiatingCount: 0,
        ownedCount: 0,
        estimatedPipelineValue: 0
      };

    summary.totalLocations += 1;
    summary.activeLocations += isArchived(location) ? 0 : 1;
    summary.archivedLocations += isArchived(location) ? 1 : 0;
    summary.potentialCount += location.status === "potential" ? 1 : 0;
    summary.negotiatingCount += location.status === "negotiating" ? 1 : 0;
    summary.ownedCount += location.status === "owned" ? 1 : 0;

    if (
      ["potential", "in_review", "negotiating"].includes(
        location.status
      )
    ) {
      summary.estimatedPipelineValue += location.estimatedValue ?? 0;
    }

    summaries.set(province, summary);
  });

  return Array.from(summaries.values());
}

function escapeCsvValue(value: unknown) {
  const stringValue = value === undefined || value === null ? "" : String(value);

  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function exportLocationsToCsv(locations: RealEstateLocation[]) {
  const rows = locations.map((location) =>
    csvColumns
      .map((column) => escapeCsvValue(location[column as keyof RealEstateLocation]))
      .join(",")
  );

  return [csvColumns.join(","), ...rows].join("\r\n");
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else {
      field += char;
    }
  }

  if (inQuotes) {
    return null;
  }

  row.push(field);
  rows.push(row);

  return rows.filter((csvRow) => csvRow.some((value) => value.trim() !== ""));
}

function optionalCsvString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalCsvNumber(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function requiredCsvNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function parseLocationsCsv(csv: string) {
  const rows = parseCsvRows(csv.trim());

  if (!rows || rows.length < 2) {
    return null;
  }

  const header = rows[0].map((column) => column.trim());

  if (!csvColumns.every((column) => header.includes(column))) {
    return null;
  }

  const locations = rows.slice(1).map((row) => {
    const record = new Map<string, string>();

    header.forEach((column, index) => {
      record.set(column, row[index] ?? "");
    });

    const location: RealEstateLocation = {
      id: record.get("id")?.trim() ?? "",
      name: record.get("name")?.trim() ?? "",
      address: optionalCsvString(record.get("address")),
      city: record.get("city")?.trim() ?? "",
      province: record.get("province")?.trim() ?? "",
      autonomousCommunity: optionalCsvString(record.get("autonomousCommunity")),
      country: record.get("country")?.trim() as RealEstateLocation["country"],
      latitude: requiredCsvNumber(record.get("latitude")),
      longitude: requiredCsvNumber(record.get("longitude")),
      googleMapsUrl: optionalCsvString(record.get("googleMapsUrl")),
      status: normalizeStatus(record.get("status")?.trim()) as RealEstateLocation["status"],
      assetType: record.get("assetType")?.trim() as RealEstateLocation["assetType"],
      priority: record.get("priority")?.trim() as RealEstateLocation["priority"],
      estimatedValue: optionalCsvNumber(record.get("estimatedValue")),
      surfaceAreaM2: optionalCsvNumber(record.get("surfaceAreaM2")),
      source: optionalCsvString(record.get("source")),
      owner: optionalCsvString(record.get("owner")),
      notes: optionalCsvString(record.get("notes")),
      createdAt: record.get("createdAt")?.trim() ?? "",
      updatedAt: record.get("updatedAt")?.trim() ?? ""
    };

    return location;
  });

  return locations.every(isRealEstateLocation) ? locations : null;
}
