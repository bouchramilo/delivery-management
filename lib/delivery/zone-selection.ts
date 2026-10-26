import { haversineKm } from "@/lib/delivery/haversine";

export type DeliveryZoneCandidate = {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  is_active: boolean;
};

const DISTANCE_EPSILON_KM = 1e-9;

/**
 * Pick the eligible active zone with the shortest center distance.
 * Tie-break: lexicographically smallest zone id.
 */
export function selectBestDeliveryZone(
  customerLat: number,
  customerLng: number,
  zones: DeliveryZoneCandidate[]
): { zone: DeliveryZoneCandidate; distanceKm: number } | null {
  const eligible = zones
    .filter((z) => z.is_active)
    .map((z) => ({
      zone: z,
      distanceKm: haversineKm(
        customerLat,
        customerLng,
        z.center_lat,
        z.center_lng
      ),
    }))
    .filter(({ zone, distanceKm }) => distanceKm <= zone.radius_km);

  if (eligible.length === 0) {
    return null;
  }

  eligible.sort((a, b) => {
    if (Math.abs(a.distanceKm - b.distanceKm) > DISTANCE_EPSILON_KM) {
      return a.distanceKm - b.distanceKm;
    }
    return a.zone.id.localeCompare(b.zone.id);
  });

  return eligible[0];
}

export function isInsideZone(
  customerLat: number,
  customerLng: number,
  zone: Pick<DeliveryZoneCandidate, "center_lat" | "center_lng" | "radius_km">
): boolean {
  return (
    haversineKm(
      customerLat,
      customerLng,
      zone.center_lat,
      zone.center_lng
    ) <= zone.radius_km
  );
}
