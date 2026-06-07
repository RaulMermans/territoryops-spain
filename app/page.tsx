"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Database,
  Download,
  FilterX,
  Search,
  Trash2,
  Upload
} from "lucide-react";
import { AddLocationForm, type NewLocationInput } from "@/components/AddLocationForm";
import { LocationDrawer } from "@/components/LocationDrawer";
import { LocationPipeline } from "@/components/LocationPipeline";
import { LocationTable } from "@/components/LocationTable";
import { MapView } from "@/components/MapView";
import { MetricsCards } from "@/components/MetricsCards";
import { StatusFilter, type StatusFilterValue } from "@/components/StatusFilter";
import { TopBar } from "@/components/TopBar";
import { mockLocations } from "@/data/mockLocations";
import {
  createLocationId,
  exportLocationsToCsv,
  formatCurrency,
  getDataHealth,
  getProvinceSummaries,
  isArchived,
  matchesLocationSearch,
  parseLocationsCsv,
  parseLocationsImport
} from "@/lib/locations";
import { formatAssetType, statusMeta } from "@/lib/status";
import type { RealEstateLocation } from "@/types/location";

const STORAGE_KEY = "territoryops-spain.locations.v1";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [locations, setLocations] =
    useState<RealEstateLocation[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null);
  const [activeHealthDrilldown, setActiveHealthDrilldown] =
    useState<HealthDrilldownKey | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"map" | "table" | "pipeline">("map");
  const [isAdding, setIsAdding] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<RealEstateLocation | null>(null);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);

  useEffect(() => {
    const storageTimer = window.setTimeout(() => {
      try {
        const savedLocations = window.localStorage.getItem(STORAGE_KEY);

        if (savedLocations) {
          const parsedLocations = parseLocationsImport(JSON.parse(savedLocations));

          if (parsedLocations) {
            setLocations(parsedLocations);
            setSelectedId(
              parsedLocations.find((location) => !isArchived(location))?.id ??
                parsedLocations[0]?.id ??
                null
            );
          }
        }
      } catch {
        setImportError("Saved local data could not be loaded. Starting empty.");
      } finally {
        setHasLoadedStorage(true);
      }
    }, 0);

    return () => window.clearTimeout(storageTimer);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  }, [hasLoadedStorage, locations]);

  const filteredLocations = useMemo(
    () => {
      const statusFiltered =
        statusFilter === "all"
          ? locations.filter((location) => !isArchived(location))
          : locations.filter((location) => location.status === statusFilter);

      return statusFiltered.filter((location) =>
        matchesLocationSearch(location, searchTerm) &&
        (!provinceFilter || location.province === provinceFilter)
      );
    },
    [locations, provinceFilter, searchTerm, statusFilter]
  );

  const selectedLocation =
    locations.find((location) => location.id === selectedId) ?? null;
  const activeLocations = useMemo(
    () => locations.filter((location) => !isArchived(location)),
    [locations]
  );
  const dataHealth = useMemo(() => getDataHealth(locations), [locations]);
  const provinceSummaries = useMemo(
    () => getProvinceSummaries(locations),
    [locations]
  );
  const topActiveProvinces = useMemo(
    () =>
      [...provinceSummaries]
        .sort((first, second) => second.activeLocations - first.activeLocations)
        .slice(0, 4),
    [provinceSummaries]
  );
  const topPipelineProvinces = useMemo(
    () =>
      [...provinceSummaries]
        .sort(
          (first, second) =>
            second.estimatedPipelineValue - first.estimatedPipelineValue
        )
        .slice(0, 4),
    [provinceSummaries]
  );
  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();

    dataHealth.duplicatePairs.forEach((pair) => {
      ids.add(pair.first.id);
      ids.add(pair.second.id);
    });

    return ids;
  }, [dataHealth.duplicatePairs]);
  const healthDrilldownRecords = useMemo(() => {
    if (!activeHealthDrilldown) {
      return [];
    }

    return locations.filter((location) => {
      if (activeHealthDrilldown === "missingGoogleMapsUrl") {
        return !location.googleMapsUrl?.trim();
      }
      if (activeHealthDrilldown === "missingEstimatedValue") {
        return location.estimatedValue === undefined;
      }
      if (activeHealthDrilldown === "missingNotes") {
        return !location.notes?.trim();
      }
      if (activeHealthDrilldown === "invalidCoordinates") {
        return !Number.isFinite(location.latitude) ||
          !Number.isFinite(location.longitude) ||
          location.latitude < -90 ||
          location.latitude > 90 ||
          location.longitude < -180 ||
          location.longitude > 180;
      }

      return duplicateIds.has(location.id);
    });
  }, [activeHealthDrilldown, duplicateIds, locations]);
  const activeHealthLabel = activeHealthDrilldown
    ? healthDrilldownMeta[activeHealthDrilldown]
    : null;

  const handleAddLocation = (input: NewLocationInput) => {
    const now = new Date().toISOString();
    const location: RealEstateLocation = {
      ...input,
      id: createLocationId(),
      country: "Spain",
      createdAt: now,
      updatedAt: now
    };

    setLocations((current) => [location, ...current]);
    setSelectedId(location.id);
    setIsAdding(false);
    setImportError(null);
    setOperationMessage("Location saved locally.");
  };

  const handleEditLocation = (input: NewLocationInput) => {
    if (!editingLocation) {
      return;
    }

    const updatedLocation: RealEstateLocation = {
      ...editingLocation,
      ...input,
      country: "Spain",
      updatedAt: new Date().toISOString()
    };

    setLocations((current) =>
      current.map((location) =>
        location.id === editingLocation.id ? updatedLocation : location
      )
    );
    setSelectedId(updatedLocation.id);
    setEditingLocation(null);
    setImportError(null);
    setOperationMessage("Location changes saved locally.");
  };

  const openEditLocation = (location: RealEstateLocation) => {
    setIsAdding(false);
    setEditingLocation(location);
  };

  const handleArchiveLocation = (location: RealEstateLocation) => {
    if (location.status === "archived") {
      return;
    }

    const confirmed = window.confirm(`Archive "${location.name}"?`);

    if (!confirmed) {
      return;
    }

    const now = new Date().toISOString();

    setLocations((current) =>
      current.map((currentLocation) =>
        currentLocation.id === location.id
          ? { ...currentLocation, status: "archived", updatedAt: now }
          : currentLocation
      )
    );
    setImportError(null);
    setOperationMessage("Location archived.");
  };

  const loadDemoData = () => {
    const confirmed = window.confirm(
      "Load sample demo locations? This replaces your current local dataset."
    );

    if (!confirmed) {
      return;
    }

    setLocations(mockLocations);
    setSelectedId(mockLocations[0]?.id ?? null);
    setStatusFilter("all");
    setSearchTerm("");
    setProvinceFilter(null);
    setActiveHealthDrilldown(null);
    setIsAdding(false);
    setEditingLocation(null);
    setImportError(null);
    setOperationMessage("Sample demo data loaded.");
  };

  const clearAllLocalData = () => {
    const confirmed = window.confirm(
      "Clear all local locations from this browser?"
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setLocations([]);
    setSelectedId(null);
    setStatusFilter("all");
    setSearchTerm("");
    setProvinceFilter(null);
    setActiveHealthDrilldown(null);
    setIsAdding(false);
    setEditingLocation(null);
    setImportError(null);
    setOperationMessage("All local locations cleared.");
  };

  const exportJson = () => {
    const payload = JSON.stringify({ locations }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `territoryops-spain-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setOperationMessage("JSON export created.");
  };

  const exportCsv = () => {
    const payload = exportLocationsToCsv(locations);
    const blob = new Blob([payload], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "territoryops-spain-locations.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setOperationMessage("CSV export created.");
  };

  const importDataset = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const fileText = await file.text();
      const isCsvFile =
        file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
      const importedLocations = isCsvFile
        ? parseLocationsCsv(fileText)
        : parseLocationsImport(JSON.parse(fileText));

      if (!importedLocations) {
        setImportError("Import failed. Choose a valid JSON or CSV location file.");
        setOperationMessage(null);
        return;
      }

      setLocations(importedLocations);
      setSelectedId(
        importedLocations.find((location) => !isArchived(location))?.id ??
          importedLocations[0]?.id ??
          null
      );
      setStatusFilter("all");
      setSearchTerm("");
      setProvinceFilter(null);
      setActiveHealthDrilldown(null);
      setEditingLocation(null);
      setImportError(null);
      setOperationMessage("Imported locations replaced the local dataset.");
    } catch {
      setImportError("Import failed. The selected file could not be parsed.");
      setOperationMessage(null);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <main className="min-h-dvh bg-ink-950 text-slate-100">
      <TopBar
        totalLocations={locations.length}
        onAddClick={() => {
          setEditingLocation(null);
          setIsAdding((current) => !current);
        }}
      />

      <div className="grid min-h-[calc(100dvh-81px)] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_360px]">
        <aside className="space-y-5 border-b border-white/10 bg-ink-900 p-4 lg:max-h-[calc(100dvh-81px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <MetricsCards
            locations={activeLocations}
            onSelectLocation={(id) => setSelectedId(id)}
          />
          <section className="space-y-3" aria-label="Search and local data actions">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-400">
                Search locations
              </span>
              <span className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="input pl-9"
                  placeholder="Name, city, province, address, notes"
                />
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,text/csv,.json,.csv"
              className="hidden"
              onChange={(event) => {
                void importDataset(event.target.files?.[0]);
              }}
            />

            {importError ? (
              <p className="rounded-md border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm text-red-100">
                {importError}
              </p>
            ) : null}
            {operationMessage ? (
              <p className="rounded-md border border-teal-300/20 bg-teal-300/10 px-3 py-2 text-sm text-teal-100">
                {operationMessage}
              </p>
            ) : null}
          </section>
          <StatusFilter
            locations={locations}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <AddLocationForm
            key={isAdding ? "add-open" : "add-closed"}
            isOpen={isAdding}
            existingLocations={locations}
            onSubmit={handleAddLocation}
            onClose={() => setIsAdding(false)}
          />
          <AddLocationForm
            key={editingLocation?.id ?? "edit-closed"}
            isOpen={Boolean(editingLocation)}
            location={editingLocation}
            existingLocations={locations}
            onSubmit={handleEditLocation}
            onClose={() => setEditingLocation(null)}
          />
          {locations.length > 0 ? (
          <section className="space-y-3" aria-label="Province summary">
            <div>
              <h2 className="text-sm font-semibold text-white">Province summary</h2>
              <p className="text-xs text-slate-500">Ranked local portfolio view.</p>
            </div>
            <ProvinceList
              title="Top active"
              provinces={topActiveProvinces}
              metric="active"
              onProvinceClick={(province) => {
                setProvinceFilter(province);
                setStatusFilter("all");
                setOperationMessage(`Province filter set to ${province}.`);
              }}
            />
            <ProvinceList
              title="Top pipeline"
              provinces={topPipelineProvinces}
              metric="pipeline"
              onProvinceClick={(province) => {
                setProvinceFilter(province);
                setStatusFilter("all");
                setOperationMessage(`Province filter set to ${province}.`);
              }}
            />
            {provinceFilter ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-teal-300/25 bg-teal-300/10 px-3 py-2">
                <div>
                  <p className="text-xs uppercase text-teal-100/70">
                    Province filter
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {provinceFilter}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProvinceFilter(null)}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-teal-100/20 px-3 text-xs font-semibold text-teal-100 transition hover:bg-teal-100/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                  <FilterX size={14} aria-hidden="true" />
                  Clear
                </button>
              </div>
            ) : null}
          </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Locations</h2>
                <p className="text-xs text-slate-500">
                  {filteredLocations.length} visible on map
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {locations.length === 0 ? (
                <div className="rounded-md border border-teal-300/20 bg-teal-300/10 p-4 text-sm text-teal-50">
                  <p className="font-semibold text-white">
                    Start by adding your first real estate location.
                  </p>
                  <p className="mt-2 leading-6 text-teal-50/80">
                    Paste a Google Maps link or enter coordinates manually. Your
                    locations stay in this browser unless you export them.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLocation(null);
                      setIsAdding(true);
                    }}
                    className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-md bg-teal-500 px-4 text-sm font-semibold text-ink-950 transition hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  >
                    Add first location
                  </button>
                </div>
              ) : filteredLocations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setSelectedId(location.id)}
                  className={`w-full cursor-pointer rounded-md border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    selectedId === location.id
                      ? "border-teal-300/40 bg-teal-300/10"
                      : "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {location.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {location.city}, {location.province}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta[location.status].chipClass}`}
                    >
                      {statusMeta[location.status].label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{formatAssetType(location.assetType)}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityChipClass(location.priority)}`}
                      >
                        {location.priority.toUpperCase()}
                      </span>
                    </span>
                    <span className="font-mono">
                      {formatCurrency(location.estimatedValue)}
                    </span>
                  </div>
                </button>
              ))}

              {locations.length > 0 && filteredLocations.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-400">
                  <p className="font-medium text-slate-200">No locations match these filters.</p>
                  <p className="mt-1">
                    Clear search, province, or status filters to widen the map.
                  </p>
                  {provinceFilter || searchTerm || statusFilter !== "all" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setProvinceFilter(null);
                        setStatusFilter("all");
                      }}
                      className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-md border border-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
          <details className="rounded-md border border-white/10 bg-white/[0.025] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-white">
              Data tools
            </summary>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={exportJson}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                <Download size={15} aria-hidden="true" />
                JSON
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                <Download size={15} aria-hidden="true" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                <Upload size={15} aria-hidden="true" />
                Import
              </button>
              <button
                type="button"
                onClick={loadDemoData}
                className="col-span-3 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                <Database size={15} aria-hidden="true" />
                Load sample demo data
              </button>
              <button
                type="button"
                onClick={clearAllLocalData}
                className="col-span-3 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-300/20 px-3 text-xs font-semibold text-red-100 transition hover:bg-red-300/10 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <Trash2 size={15} aria-hidden="true" />
                Clear all local data
              </button>
            </div>
          </details>
          <details className="rounded-md border border-white/10 bg-white/[0.025] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-white">
              Data health
            </summary>
            <div className="mt-3 space-y-3">
              <p className="text-xs text-slate-500">Local records audit.</p>
              <div className="grid grid-cols-2 gap-2">
                <HealthStat label="Total" value={dataHealth.totalRecords} />
                <HealthStat label="Active" value={dataHealth.activeRecords} />
                <HealthStat label="Archived" value={dataHealth.archivedRecords} />
                <HealthStat
                  label="No Maps URL"
                  value={dataHealth.missingGoogleMapsUrl}
                  active={activeHealthDrilldown === "missingGoogleMapsUrl"}
                  onClick={() => setActiveHealthDrilldown("missingGoogleMapsUrl")}
                />
                <HealthStat
                  label="No value"
                  value={dataHealth.missingEstimatedValue}
                  active={activeHealthDrilldown === "missingEstimatedValue"}
                  onClick={() => setActiveHealthDrilldown("missingEstimatedValue")}
                />
                <HealthStat
                  label="No notes"
                  value={dataHealth.missingNotes}
                  active={activeHealthDrilldown === "missingNotes"}
                  onClick={() => setActiveHealthDrilldown("missingNotes")}
                />
                <HealthStat
                  label="Bad coords"
                  value={dataHealth.invalidCoordinates}
                  active={activeHealthDrilldown === "invalidCoordinates"}
                  onClick={() => setActiveHealthDrilldown("invalidCoordinates")}
                />
                <HealthStat
                  label="Duplicates"
                  value={dataHealth.potentialDuplicates}
                  active={activeHealthDrilldown === "duplicates"}
                  onClick={() => setActiveHealthDrilldown("duplicates")}
                />
              </div>
              {activeHealthLabel ? (
                <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      {activeHealthLabel}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveHealthDrilldown(null)}
                      className="cursor-pointer text-xs font-medium text-slate-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-200"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {healthDrilldownRecords.length > 0 ? (
                      healthDrilldownRecords.slice(0, 5).map((location) => (
                        <button
                          key={`${activeHealthDrilldown}-${location.id}`}
                          type="button"
                          onClick={() => setSelectedId(location.id)}
                          className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left text-sm transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-teal-200"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-white">
                              {location.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {location.city}, {location.province}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta[location.status].chipClass}`}
                          >
                            {statusMeta[location.status].label}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-md border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-400">
                        No matching records for this health check.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
              {dataHealth.duplicatePairs.length > 0 ? (
                <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">
                  <p className="font-semibold">Possible duplicate pairs</p>
                  <p className="mt-1 text-amber-100/80">
                    {dataHealth.duplicatePairs
                      .slice(0, 2)
                      .map(
                        (pair) =>
                          `${pair.first.name} / ${pair.second.name} (${pair.reason})`
                      )
                      .join("; ")}
                  </p>
                </div>
              ) : null}
            </div>
          </details>
        </aside>

        <div className="flex flex-col border-b border-white/10 lg:border-b-0">
          <div className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-ink-900 p-2">
            {(["map", "table", "pipeline"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`inline-flex h-8 cursor-pointer items-center rounded px-3 text-xs font-semibold capitalize transition focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                  viewMode === mode
                    ? "border border-teal-500/30 bg-teal-500/15 text-teal-100"
                    : "border border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          {viewMode === "map" && (
            <MapView
              locations={filteredLocations}
              selectedId={selectedId}
              onSelect={(location) => setSelectedId(location.id)}
            />
          )}
          {viewMode === "table" && (
            <LocationTable
              locations={filteredLocations}
              selectedId={selectedId}
              onSelect={(location) => setSelectedId(location.id)}
            />
          )}
          {viewMode === "pipeline" && (
            <LocationPipeline
              locations={filteredLocations}
              selectedId={selectedId}
              onSelect={(location) => setSelectedId(location.id)}
            />
          )}
        </div>

        <LocationDrawer
          location={selectedLocation}
          onClose={() => setSelectedId(null)}
          onEdit={openEditLocation}
          onArchive={handleArchiveLocation}
        />
      </div>
    </main>
  );
}

type HealthDrilldownKey =
  | "missingGoogleMapsUrl"
  | "missingEstimatedValue"
  | "missingNotes"
  | "invalidCoordinates"
  | "duplicates";

const healthDrilldownMeta: Record<HealthDrilldownKey, string> = {
  missingGoogleMapsUrl: "Missing Google Maps URL",
  missingEstimatedValue: "Missing estimated value",
  missingNotes: "Missing notes",
  invalidCoordinates: "Invalid coordinates",
  duplicates: "Possible duplicates"
};

function HealthStat({
  label,
  value,
  active,
  onClick
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const flagged = value > 0 && !["Total", "Active"].includes(label);
  const className = `rounded-md border p-3 text-left ${
    active
      ? "border-teal-300/40 bg-teal-300/10"
      : flagged
        ? "border-amber-300/20 bg-amber-300/10"
        : "border-white/10 bg-white/[0.025]"
  }`;

  const content = (
    <>
      <p className="text-[11px] uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-white">{value}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={value === 0}
        className={`${className} cursor-pointer transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white/[0.025]`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className}>{content}</div>
  );
}

function ProvinceList({
  title,
  provinces,
  metric,
  onProvinceClick
}: {
  title: string;
  provinces: ReturnType<typeof getProvinceSummaries>;
  metric: "active" | "pipeline";
  onProvinceClick: (province: string) => void;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
        {title}
      </p>
      <div className="space-y-1">
        {provinces.length > 0 ? provinces.map((province) => (
          <button
            key={`${title}-${province.province}`}
            type="button"
            onClick={() => onProvinceClick(province.province)}
            className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left text-sm transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-white">
                {province.province}
              </span>
              <span className="text-xs text-slate-500">
                {province.totalLocations} total / A {province.archivedLocations} / I{" "}
                {province.interestedCount} / N {province.negotiatingCount} / C{" "}
                {province.controlledCount}
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs text-slate-300">
              {metric === "active"
                ? province.activeLocations
                : formatCurrency(province.estimatedPipelineValue)}
            </span>
          </button>
        )) : (
          <p className="rounded-md border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-400">
            No province data available.
          </p>
        )}
      </div>
    </div>
  );
}

function priorityChipClass(priority: RealEstateLocation["priority"]) {
  if (priority === "high") {
    return "border-red-300/25 bg-red-300/10 text-red-100";
  }
  if (priority === "medium") {
    return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  }

  return "border-slate-300/20 bg-slate-300/10 text-slate-300";
}
