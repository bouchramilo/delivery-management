import { z } from "zod";

export const productBodySchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  price: z.coerce.number().min(0, "Price must be zero or greater"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
  zoneIds: z.array(z.string().uuid()).default([]),
});

export const productPatchSchema = productBodySchema.partial();

export type ProductBody = z.infer<typeof productBodySchema>;
