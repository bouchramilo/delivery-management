import type { LatLngBoundsExpression } from "leaflet";

/** Casablanca — default hub for delivery zone editing in Morocco */
export const MOROCCO_MAP_DEFAULT = {
  lat: 33.5731,
  lng: -7.5898,
  zoom: 11,
} as const;

/** Approximate bounds of Morocco (mainland + common delivery coverage) */
export const MOROCCO_BOUNDS: LatLngBoundsExpression = [
  [27.45, -13.25],
  [35.95, -0.98],
];

export const MOROCCO_MAP_MIN_ZOOM = 5;
