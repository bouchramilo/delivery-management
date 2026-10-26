import { z } from "zod";

export const zoneBodySchema = z.object({
  name: z.string().trim().min(1, "Zone name is required"),
  center_lat: z.coerce
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  center_lng: z.coerce
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  radius_km: z.coerce
    .number()
    .positive("Radius must be greater than zero")
    .max(500, "Radius cannot exceed 500 km"),
  is_active: z.boolean().default(true),
});

export const zonePatchSchema = zoneBodySchema.partial();

export type ZoneBody = z.infer<typeof zoneBodySchema>;
