"use client";

import { useEffect, useRef, useState } from "react";
import { statusMeta } from "@/lib/status";
import type { RealEstateLocation } from "@/types/location";

interface MapViewProps {
  locations: RealEstateLocation[];
  selectedId: string | null;
  onSelect: (location: RealEstateLocation) => void;
}

export function MapView({ locations, selectedId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const lastFitSignatureRef = useRef("");
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current || mapRef.current) {
        return;
      }

      const map = leafletModule
        .map(containerRef.current, {
          zoomControl: true,
          attributionControl: true
        })
        .setView([40.2, -3.7], 6);

      leafletModule
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        })
        .addTo(map);

      markerLayerRef.current = leafletModule.layerGroup().addTo(map);
      mapRef.current = map;
      setLeaflet(leafletModule);

      setTimeout(() => map.invalidateSize(), 120);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leaflet || !markerLayerRef.current) {
      return;
    }

    markerLayerRef.current.clearLayers();

    locations.forEach((location) => {
      const isSelected = selectedId === location.id;
      const marker = leaflet.marker([location.latitude, location.longitude], {
        icon: leaflet.divIcon({
          className: "",
          html: `<div class="marker-dot ${isSelected ? "marker-selected" : ""}" style="background:${statusMeta[location.status].color}"></div>`,
          iconSize: isSelected ? [24, 24] : [18, 18],
          iconAnchor: isSelected ? [12, 12] : [9, 9]
        })
      });

      marker.bindTooltip(
        `${location.name} - ${statusMeta[location.status].label}`,
        { direction: "top", offset: [0, -12] }
      );
      marker.on("click", () => onSelect(location));
      marker.addTo(markerLayerRef.current!);
    });

    const fitSignature = locations.map((location) => location.id).join("|");

    if (locations.length > 0 && fitSignature !== lastFitSignatureRef.current) {
      const points: [number, number][] = locations.map((location) => [
        location.latitude,
        location.longitude
      ]);
      const bounds = leaflet.latLngBounds(points);
      mapRef.current?.fitBounds(bounds.pad(0.18), { maxZoom: 7 });
      lastFitSignatureRef.current = fitSignature;
    }
  }, [leaflet, locations, onSelect, selectedId]);

  return (
    <section className="relative min-h-[520px] overflow-hidden bg-ink-950 lg:min-h-0">
      <div ref={containerRef} className="h-full min-h-[520px] lg:min-h-0" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-white/10 bg-ink-950/85 px-3 py-2 text-xs text-slate-300 shadow-panel backdrop-blur">
        Spain operational map
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-white/10 bg-ink-950/85 p-3 text-xs text-slate-300 shadow-panel backdrop-blur">
        <p className="mb-2 font-semibold text-white">Marker legend</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {(["watchlist", "interested", "evaluating", "negotiating", "controlled", "passed"] as const).map(
            (status) => (
              <span key={status} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: statusMeta[status].color }}
                  aria-hidden="true"
                />
                {statusMeta[status].label}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}
