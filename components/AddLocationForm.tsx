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
  interestLevel: string;
  controlType: string;
  askingPrice: string;
  targetPrice: string;
  monthlyRent: string;
  expectedCapex: string;
  probability: string;
  nextAction: string;
  nextActionDate: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail: string;
  lastContactedAt: string;
  decisionReason: string;
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
  status: "interested",
  priority: "medium",
  estimatedValue: "",
  surfaceAreaM2: "",
  notes: "",
  interestLevel: "",
  controlType: "",
  askingPrice: "",
  targetPrice: "",
  monthlyRent: "",
  expectedCapex: "",
  probability: "",
  nextAction: "",
  nextActionDate: "",
  contactName: "",
  contactRole: "",
  contactPhone: "",
  contactEmail: "",
  lastContactedAt: "",
  decisionReason: ""
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
    notes: location.notes ?? "",
    interestLevel: location.interestLevel ?? "",
    controlType: location.controlType ?? "",
    askingPrice: location.askingPrice ? String(location.askingPrice) : "",
    targetPrice: location.targetPrice ? String(location.targetPrice) : "",
    monthlyRent: location.monthlyRent ? String(location.monthlyRent) : "",
    expectedCapex: location.expectedCapex ? String(location.expectedCapex) : "",
    probability: location.probability !== undefined ? String(location.probability) : "",
    nextAction: location.nextAction ?? "",
    nextActionDate: location.nextActionDate ?? "",
    contactName: location.contactName ?? "",
    contactRole: location.contactRole ?? "",
    contactPhone: location.contactPhone ?? "",
    contactEmail: location.contactEmail ?? "",
    lastContactedAt: location.lastContactedAt ?? "",
    decisionReason: location.decisionReason ?? ""
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

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.city.trim()) {
      setError("City is required.");
      return;
    }

    if (!form.province.trim()) {
      setError("Province is required.");
      return;
    }

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

    const estimatedValue = toOptionalNumber(form.estimatedValue);
    if (estimatedValue !== undefined && estimatedValue < 0) {
      setError("Estimated value cannot be negative.");
      return;
    }

    const surfaceAreaM2 = toOptionalNumber(form.surfaceAreaM2);
    if (surfaceAreaM2 !== undefined && surfaceAreaM2 < 0) {
      setError("Surface area cannot be negative.");
      return;
    }

    const askingPrice = toOptionalNumber(form.askingPrice);
    if (askingPrice !== undefined && askingPrice < 0) {
      setError("Asking price cannot be negative.");
      return;
    }

    const targetPrice = toOptionalNumber(form.targetPrice);
    if (targetPrice !== undefined && targetPrice < 0) {
      setError("Target price cannot be negative.");
      return;
    }

    const monthlyRent = toOptionalNumber(form.monthlyRent);
    if (monthlyRent !== undefined && monthlyRent < 0) {
      setError("Monthly rent cannot be negative.");
      return;
    }

    const expectedCapex = toOptionalNumber(form.expectedCapex);
    if (expectedCapex !== undefined && expectedCapex < 0) {
      setError("Expected capex cannot be negative.");
      return;
    }

    const probability = toOptionalNumber(form.probability);
    if (probability !== undefined && (probability < 0 || probability > 100)) {
      setError("Probability must be between 0 and 100.");
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
      estimatedValue,
      surfaceAreaM2,
      source: undefined,
      owner: undefined,
      notes: form.notes.trim() || undefined,
      interestLevel: (form.interestLevel as RealEstateLocation["interestLevel"]) || undefined,
      controlType: (form.controlType as RealEstateLocation["controlType"]) || undefined,
      askingPrice,
      targetPrice,
      monthlyRent,
      expectedCapex,
      probability,
      nextAction: form.nextAction.trim() || undefined,
      nextActionDate: form.nextActionDate.trim() || undefined,
      contactName: form.contactName.trim() || undefined,
      contactRole: form.contactRole.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      lastContactedAt: form.lastContactedAt.trim() || undefined,
      decisionReason: form.decisionReason.trim() || undefined
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
            Required: name, city, province, coordinates or Maps URL.
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
        {/* Quick Capture */}
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

        {/* Section A: Deal details */}
        <details className="rounded-md border border-white/10">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase text-slate-400 hover:text-white">
            Deal details
          </summary>
          <div className="space-y-3 border-t border-white/10 p-3">
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
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Interest level">
                <select
                  value={form.interestLevel}
                  onChange={(event) => updateField("interestLevel", event.target.value)}
                  className="input"
                >
                  <option value="">— not set —</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <Field label="Control type">
                <select
                  value={form.controlType}
                  onChange={(event) => updateField("controlType", event.target.value)}
                  className="input"
                >
                  <option value="">— not set —</option>
                  <option value="none">None</option>
                  <option value="watchlist">Watchlist</option>
                  <option value="option">Option</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="leased">Leased</option>
                  <option value="owned">Owned</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Asking price (€)">
                <input
                  inputMode="numeric"
                  value={form.askingPrice}
                  onChange={(event) => updateField("askingPrice", event.target.value)}
                  className="input"
                  placeholder="0"
                />
              </Field>
              <Field label="Target price (€)">
                <input
                  inputMode="numeric"
                  value={form.targetPrice}
                  onChange={(event) => updateField("targetPrice", event.target.value)}
                  className="input"
                  placeholder="0"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Monthly rent (€)">
                <input
                  inputMode="numeric"
                  value={form.monthlyRent}
                  onChange={(event) => updateField("monthlyRent", event.target.value)}
                  className="input"
                  placeholder="0"
                />
              </Field>
              <Field label="Expected capex (€)">
                <input
                  inputMode="numeric"
                  value={form.expectedCapex}
                  onChange={(event) => updateField("expectedCapex", event.target.value)}
                  className="input"
                  placeholder="0"
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Field label="Est. value (€)">
                <input
                  inputMode="numeric"
                  value={form.estimatedValue}
                  onChange={(event) =>
                    updateField("estimatedValue", event.target.value)
                  }
                  className="input"
                  placeholder="0"
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
                  placeholder="0"
                />
              </Field>
              <Field label="Probability %">
                <input
                  inputMode="numeric"
                  value={form.probability}
                  onChange={(event) => updateField("probability", event.target.value)}
                  className="input"
                  placeholder="0–100"
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
          </div>
        </details>

        {/* Section B: Contact / follow-up */}
        <details className="rounded-md border border-white/10">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase text-slate-400 hover:text-white">
            Contact / follow-up
          </summary>
          <div className="space-y-3 border-t border-white/10 p-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Contact name">
                <input
                  value={form.contactName}
                  onChange={(event) => updateField("contactName", event.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Contact role">
                <input
                  value={form.contactRole}
                  onChange={(event) => updateField("contactRole", event.target.value)}
                  className="input"
                  placeholder="Broker, owner…"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Phone">
                <input
                  inputMode="tel"
                  value={form.contactPhone}
                  onChange={(event) => updateField("contactPhone", event.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Email">
                <input
                  inputMode="email"
                  value={form.contactEmail}
                  onChange={(event) => updateField("contactEmail", event.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Last contacted">
              <input
                type="date"
                value={form.lastContactedAt}
                onChange={(event) => updateField("lastContactedAt", event.target.value)}
                className="input"
              />
            </Field>

            <Field label="Next action">
              <input
                value={form.nextAction}
                onChange={(event) => updateField("nextAction", event.target.value)}
                className="input"
                placeholder="e.g. Submit LOI, Schedule visit"
              />
            </Field>

            <Field label="Next action date">
              <input
                type="date"
                value={form.nextActionDate}
                onChange={(event) => updateField("nextActionDate", event.target.value)}
                className="input"
              />
            </Field>
          </div>
        </details>

        {/* Section C: Notes */}
        <details className="rounded-md border border-white/10">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase text-slate-400 hover:text-white">
            Notes
          </summary>
          <div className="space-y-3 border-t border-white/10 p-3">
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className="input min-h-20 resize-y"
              />
            </Field>

            <Field label="Decision reason">
              <textarea
                value={form.decisionReason}
                onChange={(event) => updateField("decisionReason", event.target.value)}
                className="input min-h-16 resize-y"
                placeholder="Why passed, archived, or controlled"
              />
            </Field>
          </div>
        </details>

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
