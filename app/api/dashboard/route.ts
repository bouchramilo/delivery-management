import { requireUser } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/types";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const [
      zonesRes,
      productsRes,
      ordersRes,
      productZonesRes,
    ] = await Promise.all([
      supabase.from("delivery_zones").select("*").eq("user_id", user.id),
      supabase.from("products").select("*").eq("user_id", user.id),
      supabase
        .from("orders")
        .select("*, delivery_zones ( id, name )")
        .eq("user_id", user.id)
        .eq("status", "accepted"),
      supabase
        .from("product_zones")
        .select(
          `
          product_id,
          zone_id,
          products ( id, name, quantity, user_id ),
          delivery_zones ( id, name, user_id )
        `
        ),
    ]);

    if (zonesRes.error) throw zonesRes.error;
    if (productsRes.error) throw productsRes.error;
    if (ordersRes.error) throw ordersRes.error;
    if (productZonesRes.error) throw productZonesRes.error;

    const zones = zonesRes.data ?? [];
    const products = productsRes.data ?? [];
    const orders = ordersRes.data ?? [];

    const zoneNameById = new Map(zones.map((z) => [z.id, z.name]));

    const productsByZoneMap = new Map<
      string,
      { zoneName: string; products: Map<string, { id: string; name: string; quantity: number }> }
    >();

    for (const row of productZonesRes.data ?? []) {
      const product = row.products as unknown as {
        id: string;
        name: string;
        quantity: number;
        user_id: string;
      } | null;
      const zone = row.delivery_zones as unknown as {
        id: string;
        name: string;
        user_id: string;
      } | null;
      if (!product || !zone || product.user_id !== user.id || zone.user_id !== user.id) {
        continue;
      }
      if (!productsByZoneMap.has(zone.id)) {
        productsByZoneMap.set(zone.id, {
          zoneName: zone.name,
          products: new Map(),
        });
      }
      productsByZoneMap.get(zone.id)!.products.set(product.id, {
        id: product.id,
        name: product.name,
        quantity: product.quantity,
      });
    }

    const productsByZone = Array.from(productsByZoneMap.entries()).map(
      ([zoneId, value]) => ({
        zoneId,
        zoneName: value.zoneName,
        productCount: value.products.size,
        products: Array.from(value.products.values()),
      })
    );

    const ordersByZoneMap = new Map<
      string,
      { orderCount: number; totalItems: number; totalValue: number }
    >();

    for (const order of orders) {
      const zoneId = order.zone_id as string;
      const current = ordersByZoneMap.get(zoneId) ?? {
        orderCount: 0,
        totalItems: 0,
        totalValue: 0,
      };
      current.orderCount += 1;
      current.totalItems += order.quantity;
      current.totalValue += Number(order.total_price);
      ordersByZoneMap.set(zoneId, current);
    }

    const ordersByZone = Array.from(ordersByZoneMap.entries()).map(
      ([zoneId, stats]) => ({
        zoneId,
        zoneName: zoneNameById.get(zoneId) ?? "Unknown zone",
        ...stats,
      })
    );

    const stats: DashboardStats = {
      activeZones: zones.filter((z) => z.is_active).length,
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.quantity, 0),
      acceptedOrders: orders.length,
      totalOrderValue: orders.reduce((sum, o) => sum + Number(o.total_price), 0),
      productsByZone,
      ordersByZone,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}
