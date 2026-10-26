"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Keeps the map centered when props change (MapContainer only uses center on mount). */
export function MapViewUpdater({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true });
  }, [lat, lng, zoom, map]);

  return null;
}
