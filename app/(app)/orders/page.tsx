"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client-fetch";
import { selectBestDeliveryZone } from "@/lib/delivery/zone-selection";
import { formatCurrency, formatDate } from "@/lib/format";
import { MOROCCO_MAP_DEFAULT } from "@/lib/map/morocco";
import type { DeliveryZone, OrderWithRelations, ProductWithZones } from "@/types";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

const OrderLocationMap = dynamic(() => import("@/components/map/OrderLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

const DEFAULT_CENTER = { lat: MOROCCO_MAP_DEFAULT.lat, lng: MOROCCO_MAP_DEFAULT.lng };

function OrdersPageContent() {
  const { push } = useToast();
  const searchParams = useSearchParams();
  const filterZoneId = searchParams.get("zoneId") ?? "";

  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [products, setProducts] = useState<ProductWithZones[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerLat, setCustomerLat] = useState(String(DEFAULT_CENTER.lat));
  const [customerLng, setCustomerLng] = useState(String(DEFAULT_CENTER.lng));
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const orderUrl = filterZoneId
        ? `/api/orders?zoneId=${encodeURIComponent(filterZoneId)}`
        : "/api/orders";
      const [ordersRes, productsRes, zonesRes] = await Promise.all([
        apiFetch<{ orders: OrderWithRelations[] }>(orderUrl),
        apiFetch<{ products: ProductWithZones[] }>("/api/products"),
        apiFetch<{ zones: DeliveryZone[] }>("/api/zones"),
      ]);
      setOrders(ordersRes.orders);
      setProducts(productsRes.products);
      setZones(zonesRes.zones);
    } catch (error) {
      push(error instanceof Error ? error.message : "Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [filterZoneId, push]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const orderableProducts = useMemo(
    () =>
      products.filter((product) => {
        const assignedActiveZones = (product.zones ?? []).filter((z) =>
          zones.some((zone) => zone.id === z.id && zone.is_active)
        );
        return product.quantity > 0 && assignedActiveZones.length > 0;
      }),
    [products, zones]
  );

  const selectedProduct = products.find((p) => p.id === productId);

  const eligibleZones = useMemo(() => {
    if (!selectedProduct) return [];
    const zoneIds = new Set((selectedProduct.zones ?? []).map((z) => z.id));
    return zones
      .filter((z) => zoneIds.has(z.id) && z.is_active)
      .map((z) => ({
        id: z.id,
        name: z.name,
        center_lat: z.center_lat,
        center_lng: z.center_lng,
        radius_km: z.radius_km,
        is_active: z.is_active,
      }));
  }, [selectedProduct, zones]);

  const coverage = useMemo(() => {
    const lat = Number(customerLat);
    const lng = Number(customerLng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || eligibleZones.length === 0) {
      return null;
    }
    return selectBestDeliveryZone(lat, lng, eligibleZones);
  }, [customerLat, customerLng, eligibleZones]);

  const estimatedTotal = useMemo(() => {
    const qty = Number.parseInt(quantity, 10);
    if (!selectedProduct || Number.isNaN(qty) || qty <= 0) return null;
    return Number(selectedProduct.price) * qty;
  }, [selectedProduct, quantity]);

  const canSubmit =
    !!selectedProduct &&
    !!coverage &&
    Number.parseInt(quantity, 10) > 0 &&
    Number.parseInt(quantity, 10) <= selectedProduct.quantity &&
    !submitting;

  async function handleCreateOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !coverage) {
      push(
        "This delivery location is outside all available delivery zones for the selected product.",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          productId,
          quantity: Number.parseInt(quantity, 10),
          customerLat: Number(customerLat),
          customerLng: Number(customerLng),
        }),
      });
      push("Order created successfully", "success");
      setQuantity("1");
      await load();
    } catch (error) {
      push(error instanceof Error ? error.message : "Order failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <Card>
        <h2 className="mb-4 text-base font-semibold">Create order</h2>
        <form className="space-y-4" onSubmit={handleCreateOrder}>
          <div>
            <Label htmlFor="product">Product</Label>
            <select
              id="product"
              className="w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-text-800 dark:border-primary-400/30"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <option value="">Select a product</option>
              {orderableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · stock {product.quantity} · {formatCurrency(Number(product.price))}
                </option>
              ))}
            </select>
            {orderableProducts.length === 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                Add stock and active zone assignments before creating orders.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="clat">Customer latitude</Label>
              <Input
                id="clat"
                type="number"
                step="any"
                value={customerLat}
                onChange={(e) => setCustomerLat(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clng">Customer longitude</Label>
              <Input
                id="clng"
                type="number"
                step="any"
                value={customerLng}
                onChange={(e) => setCustomerLng(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <OrderLocationMap
              lat={Number(customerLat) || DEFAULT_CENTER.lat}
              lng={Number(customerLng) || DEFAULT_CENTER.lng}
              zones={eligibleZones}
              selectedZoneId={coverage?.zone.id ?? null}
              onMapClick={(lat, lng) => {
                setCustomerLat(lat.toFixed(6));
                setCustomerLng(lng.toFixed(6));
              }}
            />
          </div>

          <div className="rounded-lg bg-surface-muted p-3 text-sm">
            {coverage ? (
              <p className="text-emerald-700 dark:text-emerald-400">
                Covered by <strong>{coverage.zone.name}</strong> (
                {coverage.distanceKm.toFixed(2)} km from center)
              </p>
            ) : selectedProduct ? (
              <p className="text-red-600">
                This delivery location is outside all available delivery zones for the selected
                product.
              </p>
            ) : (
              <p className="text-zinc-500">Select a product and delivery location.</p>
            )}
            {estimatedTotal != null && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                Estimated total: {formatCurrency(estimatedTotal)}
              </p>
            )}
          </div>

          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Creating order…" : "Create order"}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Orders</h2>
          {filterZoneId && <p className="text-xs text-zinc-500">Filtered by zone</p>}
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading orders…</p>
        ) : orders.length === 0 ? (
          <Card>
            <p className="text-sm text-zinc-600">No orders yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{order.product?.name ?? "Product"}</p>
                    <p className="text-xs text-zinc-500">#{order.id.slice(0, 8)}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {order.status}
                  </span>
                </div>
                <dl className="mt-3 grid gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <div>Qty: {order.quantity}</div>
                  <div>Zone: {order.zone?.name ?? "—"}</div>
                  <div>
                    Location: {order.customer_lat.toFixed(4)}, {order.customer_lng.toFixed(4)}
                  </div>
                  <div>
                    {formatCurrency(Number(order.unit_price))} each ·{" "}
                    {formatCurrency(Number(order.total_price))} total
                  </div>
                  <div className="text-xs text-zinc-500">{formatDate(order.created_at)}</div>
                </dl>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading orders…</p>}>
      <OrdersPageContent />
    </Suspense>
  );
}
