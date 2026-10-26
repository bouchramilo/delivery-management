import { requireUser } from "@/lib/api/auth";
import { apiError, handleApiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validations/order";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");
    const status = searchParams.get("status");

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        products ( id, name ),
        delivery_zones ( id, name )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (zoneId) {
      query = query.eq("zone_id", zoneId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: orders, error } = await query;
    if (error) {
      throw error;
    }

    const mapped = (orders ?? []).map((order) => ({
      ...order,
      unit_price: Number(order.unit_price),
      total_price: Number(order.total_price),
      product: order.products,
      zone: order.delivery_zones,
      products: undefined,
      delivery_zones: undefined,
    }));

    return NextResponse.json({ orders: mapped });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid order data",
        400
      );
    }

    const { productId, quantity, customerLat, customerLng } = parsed.data;
    const supabase = await createClient();

    const { data: order, error } = await supabase.rpc("create_order_atomic", {
      p_product_id: productId,
      p_quantity: quantity,
      p_customer_lat: customerLat,
      p_customer_lng: customerLng,
    });

    if (error) {
      throw error;
    }

    const { data: withRelations } = await supabase
      .from("orders")
      .select(
        `
        *,
        products ( id, name ),
        delivery_zones ( id, name )
      `
      )
      .eq("id", order.id)
      .single();

    return NextResponse.json(
      {
        order: withRelations
          ? {
              ...withRelations,
              unit_price: Number(withRelations.unit_price),
              total_price: Number(withRelations.total_price),
              product: withRelations.products,
              zone: withRelations.delivery_zones,
            }
          : order,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
