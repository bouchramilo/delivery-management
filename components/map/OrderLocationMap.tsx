"use client";

import { MapViewUpdater } from "@/components/map/MapViewUpdater";
import { configureLeafletIcons, OSM_ATTRIBUTION, OSM_TILE_URL } from "@/components/map/leaflet-setup";
import type { DeliveryZoneCandidate } from "@/lib/delivery/zone-selection";
import {
  MOROCCO_BOUNDS,
  MOROCCO_MAP_DEFAULT,
  MOROCCO_MAP_MIN_ZOOM,
} from "@/lib/map/morocco";
import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

type OrderLocationMapProps = {
  lat: number;
  lng: number;
  zones: DeliveryZoneCandidate[];
  selectedZoneId?: string | null;
  onMapClick: (lat: number, lng: number) => void;
};

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function OrderLocationMap({
  lat,
  lng,
  zones,
  selectedZoneId,
  onMapClick,
}: OrderLocationMapProps) {
  useEffect(() => {
    configureLeafletIcons();
  }, []);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={MOROCCO_MAP_DEFAULT.zoom}
      minZoom={MOROCCO_MAP_MIN_ZOOM}
      maxBounds={MOROCCO_BOUNDS}
      maxBoundsViscosity={0.85}
      className="h-full min-h-[280px] w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <MapViewUpdater lat={lat} lng={lng} />
      <ClickHandler onMapClick={onMapClick} />
      <Marker position={[lat, lng]} />
      {zones.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.center_lat, zone.center_lng]}
          radius={zone.radius_km * 1000}
          pathOptions={{
            color: zone.id === selectedZoneId ? "#059669" : "#64748b",
            fillColor: zone.id === selectedZoneId ? "#10b981" : "#94a3b8",
            fillOpacity: 0.1,
          }}
        />
      ))}
    </MapContainer>
  );
}
