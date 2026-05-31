"use client";

import { useMemo, useState } from "react";
import { ClipboardPaste, Save, X } from "lucide-react";
import { extractCoordinatesFromGoogleMapsUrl } from "@/lib/googleMaps";
import { getDuplicateWarningsForLocation } from "@/lib/locations";
import { assetTypes, statuses, statusMeta, formatAssetType } from "@/lib/status";
import type { RealEstateLocation } from "@/types/location";

export type NewLocationInput = Omit<
  RealEstateLocation,
  "id" | "country" | "createdAt" | "updatedAt"
>;

interface AddLocationFormProps {
  isOpen: boolean;
  location?: RealEstateLocation | null;
  existingLocations?: RealEstateLocation[];
  onSubmit: (location: NewLocationInput) => void;
  onClose: () => void;
}

type FormState = {
  name: string;
  googleMapsUrl: string;
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  province: string;
  assetType: RealEstateLocation["assetType"];
  status: RealEstateLocation["status"];
  priority: RealEstateLocation["priority"];
  estimatedValue: string;
  surfaceAreaM2: string;
  notes: string;
};

const initialForm: FormState = {
  name: "",
  googleMapsUrl: "",
  latitude: "",
  longitude: "",
  address: "",
  city: "",
  province: "",
  assetType: "retail",
  status: "potential",
  priority: "medium",
  estimatedValue: "",
  surfaceAreaM2: "",
  notes: ""
};

function formFromLocation(location: RealEstateLocation | null): FormState {
  if (!location) {
    return initialForm;
  }

  return {
    name: location.name,
    googleMapsUrl: location.googleMapsUrl ?? "",
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    address: location.address ?? "",
    city: location.city,
    province: location.province,
    assetType: location.assetType,
    status: location.status,
    priority: location.priority,
    estimatedValue: location.estimatedValue ? String(location.estimatedValue) : "",
    surfaceAreaM2: location.surfaceAreaM2 ? String(location.surfaceAreaM2) : "",
    notes: location.notes ?? ""
  };
}

function toOptionalNumber(value: string) {
  const parsed = Number(value);
  return value.trim() === "" || Number.isNaN(parsed) ? undefined : parsed;
}

function toDraftNumber(value: string) {
  return value.trim() === "" ? Number.NaN : Number(value);
}

export function AddLocationForm({
  isOpen,
  location = null,
  existingLocations = [],
  onSubmit,
  onClose
}: AddLocationFormProps) {
  const [form, setForm] = useState(() => formFromLocation(location));
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(location);

  const duplicateWarnings = useMemo(() => {
    const draft: RealEstateLocation = {
      id: location?.id ?? "__draft__",
      name: form.name,
      address: form.address || undefined,
      city: form.city,
      province: form.province,
      country: "Spain",
      latitude: toDraftNumber(form.latitude),
      longitude: toDraftNumber(form.longitude),
      googleMapsUrl: form.googleMapsUrl || undefined,
      status: form.status,
      assetType: form.assetType,
      priority: form.priority,
      estimatedValue: undefined,
      surfaceAreaM2: undefined,
      notes: form.notes || undefined,
      createdAt: location?.createdAt ?? "",
      updatedAt: location?.updatedAt ?? ""
    };

    if (!form.name.trim() && !form.googleMapsUrl.trim()) {
      return [];
    }

    return getDuplicateWarningsForLocation(draft, existingLocations);
  }, [existingLocations, form, location]);

  if (!isOpen) {
    return null;
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const autofillCoordinates = () => {
    const extracted = extractCoordinatesFromGoogleMapsUrl(form.googleMapsUrl);

    if (!extracted) {
      setError("No coordinates found in that Google Maps URL.");
      return;
    }

    setForm((current) => ({
      ...current,
      latitude: String(extracted.latitude),
      longitude: String(extracted.longitude)
    }));
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedFromUrl = form.googleMapsUrl
      ? extractCoordinatesFromGoogleMapsUrl(form.googleMapsUrl)
      : null;
    const latitude = toOptionalNumber(form.latitude) ?? parsedFromUrl?.latitude;
    const longitude =
      toOptionalNumber(form.longitude) ?? parsedFromUrl?.longitude;

    if (latitude === undefined || longitude === undefined) {
      setError("Add latitude and longitude manually, or paste a URL with coordinates.");
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Coordinates are outside valid latitude or longitude ranges.");
      return;
    }

    onSubmit({
      name: form.name.trim(),
      googleMapsUrl: form.googleMapsUrl.trim() || undefined,
      latitude,
      longitude,
      address: form.address.trim() || undefined,
      city: form.city.trim(),
      province: form.province.trim(),
      assetType: form.assetType as NewLocationInput["assetType"],
      status: form.status as NewLocationInput["status"],
      priority: form.priority as NewLocationInput["priority"],
      estimatedValue: toOptionalNumber(form.estimatedValue),
      surfaceAreaM2: toOptionalNumber(form.surfaceAreaM2),
      notes: form.notes.trim() || undefined
    });

    setForm(initialForm);
    setError(null);
  };

  return (
    <section className="rounded-md border border-teal-300/20 bg-ink-850 p-3 shadow-panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {isEditing ? "Edit location" : "New location"}
          </h2>
          <p className="text-xs text-slate-500">
            Google Maps URL is optional. Enter coordinates manually or extract
            them from a supported link.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-white/10 text-slate-300 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
          aria-label="Close add location form"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name" required>
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="input"
          />
        </Field>

        <Field label="Google Maps URL">
          <div className="flex gap-2">
            <input
              value={form.googleMapsUrl}
              onChange={(event) =>
                updateField("googleMapsUrl", event.target.value)
              }
              className="input min-w-0 flex-1"
              placeholder="https://www.google.com/maps..."
            />
            <button
              type="button"
              onClick={autofillCoordinates}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-white/10 text-slate-300 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-200"
              aria-label="Extract coordinates from Google Maps URL"
              title="Extract coordinates"
            >
              <ClipboardPaste size={16} aria-hidden="true" />
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Latitude" required>
            <input
              inputMode="decimal"
              value={form.latitude}
              onChange={(event) => updateField("latitude", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Longitude" required>
            <input
              inputMode="decimal"
              value={form.longitude}
              onChange={(event) => updateField("longitude", event.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Address">
          <input
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="City" required>
            <input
              required
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Province" required>
            <input
              required
              value={form.province}
              onChange={(event) => updateField("province", event.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Asset type">
            <select
              value={form.assetType}
              onChange={(event) => updateField("assetType", event.target.value)}
              className="input"
            >
              {assetTypes.map((assetType) => (
                <option key={assetType} value={assetType}>
                  {formatAssetType(assetType)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" required>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="input"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusMeta[status].label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Field label="Priority">
            <select
              value={form.priority}
              onChange={(event) => updateField("priority", event.target.value)}
              className="input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Value">
            <input
              inputMode="numeric"
              value={form.estimatedValue}
              onChange={(event) =>
                updateField("estimatedValue", event.target.value)
              }
              className="input"
            />
          </Field>
          <Field label="m2">
            <input
              inputMode="numeric"
              value={form.surfaceAreaM2}
              onChange={(event) =>
                updateField("surfaceAreaM2", event.target.value)
              }
              className="input"
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className="input min-h-20 resize-y"
          />
        </Field>

        {error ? (
          <p className="rounded-md border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        {duplicateWarnings.length > 0 ? (
          <div className="rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            <p className="font-medium">Potential duplicate found.</p>
            <p className="mt-1 text-amber-100/80">
              Similar to {duplicateWarnings.slice(0, 2).map((item) => item.name).join(", ")}.
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-teal-500 px-4 text-sm font-semibold text-ink-950 transition hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-2 focus:ring-offset-ink-850"
        >
          <Save size={16} aria-hidden="true" />
          {isEditing ? "Save changes" : "Save location"}
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-400">
        {label}
        {required ? <span className="text-teal-200"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
