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
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

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

      const tiles = leafletModule
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });

      tiles.on("tileerror", () => {
        setTileError(true);
      });

      tiles.addTo(map);

      markerLayerRef.current = leafletModule.layerGroup().addTo(map);
      mapRef.current = map;
      setLeaflet(leafletModule);

      // Handle dynamic resize behavior cleanly via ResizeObserver
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);

      map.invalidateSize();
    });

    return () => {
      cancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
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

  const isLoading = !leaflet;

  return (
    <section className="relative w-full min-h-[520px] flex-1 overflow-hidden bg-[#070b10] lg:min-h-0">
      {/* Dynamic Sizing Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Cartographic Loading Skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070b10] backdrop-blur-sm"
          style={{
            backgroundImage: `
              radial-gradient(circle at center, transparent 35%, #070b10 100%),
              linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px'
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-500/20 border-t-teal-400" />
            <p className="text-[10px] tracking-[0.2em] font-semibold text-slate-400 uppercase font-mono animate-pulse">
              Initializing Atlas Grid
            </p>
          </div>
        </div>
      )}

      {/* Tile load error indicator */}
      {tileError && (
        <div className="absolute right-4 top-4 z-20 rounded border border-red-500/20 bg-red-950/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-red-200 shadow-panel backdrop-blur">
          ⚠ Map tiles unavailable
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 rounded border border-white/5 bg-[#0b1118]/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 shadow-panel backdrop-blur-md">
        Spain operational grid
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded border border-white/5 bg-[#0b1118]/95 p-3 font-mono text-[10px] text-slate-400 shadow-panel backdrop-blur-md">
        <p className="mb-2 font-semibold uppercase tracking-wider text-slate-200">Marker legend</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {(["watchlist", "interested", "evaluating", "negotiating", "controlled", "passed"] as const).map(
            (status) => (
              <span key={status} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusMeta[status].color }}
                  aria-hidden="true"
                />
                <span className="uppercase text-[9px] tracking-wide">{statusMeta[status].label}</span>
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}

