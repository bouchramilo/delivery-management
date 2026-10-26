import { requireUser } from "@/lib/api/auth";
import { apiError, handleApiError } from "@/lib/api/response";
import { assertZonesOwnedByUser, syncProductZones } from "@/lib/api/zones";
import { createClient } from "@/lib/supabase/server";
import { productPatchSchema } from "@/lib/validations/product";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = productPatchSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid product data",
        400
      );
    }

    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }
    if (!existing) {
      return apiError("NOT_FOUND", "Product not found.", 404);
    }

    const { zoneIds, ...updates } = parsed.data;
    const patch: Record<string, unknown> = { ...updates };
    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase
        .from("products")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id);
      if (updateError) {
        throw updateError;
      }
    }

    if (zoneIds !== undefined) {
      const zoneCheck = await assertZonesOwnedByUser(supabase, user.id, zoneIds);
      if (!zoneCheck.ok) {
        return apiError("VALIDATION_ERROR", zoneCheck.message, 400);
      }
      await syncProductZones(supabase, id, zoneIds);
    }

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_zones (
          delivery_zones ( id, name, is_active )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !product) {
      throw error ?? new Error("Failed to load product");
    }

    const zones =
      product.product_zones?.map(
        (pz: { delivery_zones: { id: string; name: string; is_active: boolean } }) =>
          pz.delivery_zones
      ) ?? [];

    const { product_zones, ...rest } = product;
    void product_zones;

    return NextResponse.json({
      product: { ...rest, price: Number(rest.price), zones },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
