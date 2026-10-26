"use client";

import { MapViewUpdater } from "@/components/map/MapViewUpdater";
import { configureLeafletIcons, OSM_ATTRIBUTION, OSM_TILE_URL } from "@/components/map/leaflet-setup";
import {
  MOROCCO_BOUNDS,
  MOROCCO_MAP_DEFAULT,
  MOROCCO_MAP_MIN_ZOOM,
} from "@/lib/map/morocco";
import type { DeliveryZone } from "@/types";
import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type ZoneMapEditorProps = {
  zones: DeliveryZone[];
  selectedZoneId?: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  onMapClick: (lat: number, lng: number) => void;
  /** Crosshair + clicks update coordinates (create / edit form) */
  pickMode?: boolean;
  /** Draw marker and radius preview at centerLat / centerLng */
  showDraft?: boolean;
};

function ClickHandler({
  onMapClick,
  enabled,
}: {
  onMapClick: (lat: number, lng: number) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click(event) {
      if (enabled) {
        onMapClick(event.latlng.lat, event.latlng.lng);
      }
    },
  });
  return null;
}

function PickModeCursor({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = enabled ? "crosshair" : "";
    return () => {
      container.style.cursor = "";
    };
  }, [enabled, map]);

  return null;
}

function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
}

export default function ZoneMapEditor({
  zones,
  selectedZoneId,
  centerLat,
  centerLng,
  radiusKm,
  onMapClick,
  pickMode = false,
  showDraft = false,
}: ZoneMapEditorProps) {
  const showCenterPreview = pickMode || showDraft;
  useEffect(() => {
    configureLeafletIcons();
  }, []);

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={MOROCCO_MAP_DEFAULT.zoom}
      minZoom={MOROCCO_MAP_MIN_ZOOM}
      maxBounds={MOROCCO_BOUNDS}
      maxBoundsViscosity={0.85}
      className="h-full min-h-[280px] w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <MapViewUpdater lat={centerLat} lng={centerLng} zoom={pickMode ? 13 : undefined} />
      {pickMode && <MapInvalidateSize />}
      <PickModeCursor enabled={pickMode} />
      <ClickHandler onMapClick={onMapClick} enabled={pickMode} />
      {showCenterPreview && (
        <>
          <Marker position={[centerLat, centerLng]} />
          {radiusKm > 0 && (
            <Circle
              center={[centerLat, centerLng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: pickMode ? "#5292ad" : "#2563eb",
                fillColor: pickMode ? "#97bece" : "#3b82f6",
                fillOpacity: pickMode ? 0.25 : 0.15,
                weight: pickMode ? 3 : 2,
              }}
            />
          )}
        </>
      )}
      {zones.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.center_lat, zone.center_lng]}
          radius={zone.radius_km * 1000}
          pathOptions={{
            color: zone.id === selectedZoneId ? "#0f766e" : zone.is_active ? "#64748b" : "#cbd5e1",
            fillColor: zone.is_active ? "#94a3b8" : "#e2e8f0",
            fillOpacity: zone.is_active ? 0.12 : 0.05,
            dashArray: zone.is_active ? undefined : "6 6",
          }}
        />
      ))}
    </MapContainer>
  );
}
