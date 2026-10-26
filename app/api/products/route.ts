import { requireUser } from "@/lib/api/auth";
import { apiError, handleApiError } from "@/lib/api/response";
import { assertZonesOwnedByUser, syncProductZones } from "@/lib/api/zones";
import { createClient } from "@/lib/supabase/server";
import { productBodySchema } from "@/lib/validations/product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_zones (
          zone_id,
          delivery_zones ( id, name, is_active )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const mapped = (products ?? []).map((row) => {
      const zones =
        row.product_zones?.map(
          (pz: {
            delivery_zones: { id: string; name: string; is_active: boolean } | null;
          }) => pz.delivery_zones
        ) ?? [];
      const { product_zones, ...product } = row;
      void product_zones;
      return {
        ...product,
        price: Number(product.price),
        zones: zones.filter(Boolean),
      };
    });

    return NextResponse.json({ products: mapped });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = productBodySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid product data",
        400
      );
    }

    const { name, price, quantity, zoneIds } = parsed.data;
    const supabase = await createClient();

    const zoneCheck = await assertZonesOwnedByUser(supabase, user.id, zoneIds);
    if (!zoneCheck.ok) {
      return apiError("VALIDATION_ERROR", zoneCheck.message, 400);
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        name,
        price,
        quantity,
      })
      .select()
      .single();

    if (error || !product) {
      throw error ?? new Error("Failed to create product");
    }

    await syncProductZones(supabase, product.id, zoneIds);

    return NextResponse.json(
      {
        product: {
          ...product,
          price: Number(product.price),
          zones: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
