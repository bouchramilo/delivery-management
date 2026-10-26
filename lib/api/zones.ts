import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertZonesOwnedByUser(
  supabase: SupabaseClient,
  userId: string,
  zoneIds: string[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (zoneIds.length === 0) {
    return { ok: true };
  }

  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id")
    .eq("user_id", userId)
    .in("id", zoneIds);

  if (error) {
    throw error;
  }

  if ((data?.length ?? 0) !== zoneIds.length) {
    return {
      ok: false,
      message: "One or more delivery zones are invalid or not owned by you.",
    };
  }

  return { ok: true };
}

export async function syncProductZones(
  supabase: SupabaseClient,
  productId: string,
  zoneIds: string[]
) {
  const { error: deleteError } = await supabase
    .from("product_zones")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw deleteError;
  }

  if (zoneIds.length === 0) {
    return;
  }

  const rows = zoneIds.map((zoneId) => ({
    product_id: productId,
    zone_id: zoneId,
  }));

  const { error: insertError } = await supabase.from("product_zones").insert(rows);
  if (insertError) {
    throw insertError;
  }
}
