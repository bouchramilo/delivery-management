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
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

type ZoneMapEditorProps = {
  zones: DeliveryZone[];
  selectedZoneId?: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  onMapClick: (lat: number, lng: number) => void;
  onSelectZone?: (zoneId: string) => void;
};

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function ZoneMapEditor({
  zones,
  selectedZoneId,
  centerLat,
  centerLng,
  radiusKm,
  onMapClick,
}: ZoneMapEditorProps) {
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
      <MapViewUpdater lat={centerLat} lng={centerLng} />
      <ClickHandler onMapClick={onMapClick} />
      <Marker position={[centerLat, centerLng]} />
      <Circle
        center={[centerLat, centerLng]}
        radius={radiusKm * 1000}
        pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.15 }}
      />
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
