import { z } from "zod";

export const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  customerLat: z.coerce
    .number()
    .min(-90)
    .max(90),
  customerLng: z.coerce
    .number()
    .min(-180)
    .max(180),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
